import type { TrackerId } from "@/lib/trackers"
import { STARTER_FOOD_GROUPS } from "@/lib/starterFoodGroups"
import { TRACKERS, TRACKER_IDS, trackerForPath } from "@/lib/trackers"

/** A person whose observations are recorded. See GLOSSARY.md. */
export type Profile = {
  id: string
  name: string
  emoji?: string
  enabledTrackers: TrackerId[]
  archived: boolean
  /**
   * False for a profile another account shared with this one. Only the owner
   * can change the profile itself; observations are open to both.
   */
  owned: boolean
  /** The auth uids of the accounts this profile is shared with. */
  sharedWith: string[]
}

/**
 * Whether `value` could be an account ID (a Firebase auth uid). It ends up as
 * a database key, so it must not contain the characters a key can't.
 */
export const isAccountId = (value: string): boolean =>
  /^[A-Za-z0-9_:-]{6,128}$/.test(value)

/**
 * The multi-path `update()` that shares a profile with another account, or
 * stops sharing it. `/sharedWith/<accountId>/<profileId>` grants the access
 * and is how that account finds the profile; the copy on the profile record
 * lets the owner see who it is shared with.
 */
export const profileSharingUpdate = (
  profileId: string,
  accountId: string,
  shared: boolean,
): Record<string, true | null> => ({
  [`sharedWith/${accountId}/${profileId}`]: shared || null,
  [`profiles/${profileId}/sharedWith/${accountId}`]: shared || null,
})

/**
 * The profiles an account sees: the ones it owns followed by the unarchived
 * ones shared with it. Only the owner can restore an archived profile, so
 * there is no use showing one to anyone else.
 */
export const mergeProfiles = (
  owned: readonly Profile[],
  shared: readonly Profile[],
): Profile[] => [
  ...owned,
  ...shared.filter(
    profile =>
      !profile.archived && !owned.some(other => other.id === profile.id),
  ),
]

/**
 * Which profile is active: the one remembered on this device if it is still
 * one of the account's unarchived profiles, otherwise the account holder's own
 * profile (whose ID is their auth uid, see ADR 0001).
 */
export const resolveActiveProfileId = (
  ownProfileId: string,
  rememberedId: string | null,
  profiles: readonly Profile[],
): string => {
  const remembered = profiles.find(
    profile => profile.id === rememberedId && !profile.archived,
  )
  return remembered ? remembered.id : ownProfileId
}

/** The enabled trackers as stored on a profile record: `{ diet: false }`. */
export type StoredTrackers = Partial<Record<TrackerId, boolean>>

/**
 * Trackers are all enabled unless the record says otherwise, so a profile
 * created before a new tracker existed gets it automatically. A profile never
 * ends up with none.
 */
export const parseEnabledTrackers = (
  stored: StoredTrackers | undefined,
): TrackerId[] => {
  const enabled = TRACKER_IDS.filter(id => stored?.[id] !== false)
  return enabled.length > 0 ? enabled : [...TRACKER_IDS]
}

/**
 * Flip one tracker on or off. At least one of the `available` (built)
 * trackers must stay enabled, so a toggle that would break that is ignored.
 */
export const toggleTracker = (
  enabled: readonly TrackerId[],
  id: TrackerId,
  available: readonly TrackerId[],
): TrackerId[] => {
  const next = enabled.includes(id)
    ? enabled.filter(existing => existing !== id)
    : [...enabled, id]
  const ordered = TRACKER_IDS.filter(trackerId => next.includes(trackerId))
  return ordered.some(trackerId => available.includes(trackerId))
    ? ordered
    : [...enabled]
}

/**
 * Where to go instead when `pathname` is a tracker the active profile has
 * disabled: the first enabled tracker's route. `undefined` means stay.
 */
export const trackerRedirect = (
  pathname: string,
  enabled: readonly TrackerId[],
): string | undefined => {
  const current = trackerForPath(pathname)
  if (!current || enabled.includes(current.id)) return undefined
  return TRACKERS.find(tracker => enabled.includes(tracker.id))?.route
}

/**
 * The single multi-path `update()` (keyed by database path from the root) that
 * sets a profile up: its record plus, unless the profile already has food
 * groups, the starter food groups under deterministic keys. Writing both
 * atomically means the profile record's existence reliably means "already set
 * up", so starters never come back after the user deletes them.
 */
export const profileSetupUpdate = ({
  profileId,
  owner,
  name,
  emoji,
  includeStarters,
}: {
  profileId: string
  owner: string
  name: string
  emoji?: string
  includeStarters: boolean
}): Record<string, unknown> => {
  const update: Record<string, unknown> = {
    [`profiles/${profileId}`]: {
      owner,
      name,
      ...(emoji ? { emoji } : {}),
      trackers: Object.fromEntries(TRACKER_IDS.map(id => [id, true])),
      archived: false,
    },
  }
  if (includeStarters) {
    STARTER_FOOD_GROUPS.forEach((starter, order) => {
      update[`foodGroups/${profileId}/starter-${starter.name.toLowerCase()}`] =
        { emoji: starter.emoji, name: starter.name, order, archived: false }
    })
  }
  return update
}
