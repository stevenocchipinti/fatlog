import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { ArchiveRestore, ArchiveX, Check, Pencil, Plus, X } from "lucide-react"

import type { Profile } from "@/lib/profiles"
import type { TrackerId } from "@/lib/trackers"
import type { ProfileChanges } from "@/lib/firebase"
import ProfileAvatar from "@/components/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, useProfiles } from "@/lib/firebase"
import { toggleTracker } from "@/lib/profiles"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"
import { AVAILABLE_TRACKERS, TRACKER_IDS } from "@/lib/trackers"

export const Route = createFileRoute("/_auth/profiles")({
  component: ProfilesPage,
})

const AVAILABLE_IDS = AVAILABLE_TRACKERS.map(tracker => tracker.id)

function ProfilesPage() {
  const { user } = useAuth()
  const { profiles, addProfile, updateProfile, setProfileArchived } =
    useProfiles()

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string>()

  // The bottom bar's + adds a profile on this page.
  useRegisterPrimaryAction(
    "Add profile",
    useCallback(() => setAdding(true), []),
  )

  const active = profiles.filter(profile => !profile.archived)
  const archived = profiles.filter(profile => profile.archived)

  const photoFor = (profile: Profile) =>
    profile.id === user?.uid ? user.photoURL : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 pb-4">
      <ul className="flex flex-col gap-2">
        {active.map(profile => (
          <li key={profile.id} className="bg-card rounded-xl border p-3">
            {editingId === profile.id ? (
              <ProfileForm
                initial={profile}
                submitLabel="Save"
                onSubmit={changes => {
                  updateProfile(profile.id, changes)
                  setEditingId(undefined)
                }}
                onCancel={() => setEditingId(undefined)}
                onArchive={
                  profile.id === user?.uid
                    ? undefined
                    : () => {
                        if (
                          window.confirm(
                            `Archive ${profile.name}? Their data is kept.`,
                          )
                        ) {
                          setProfileArchived(profile.id, true)
                          setEditingId(undefined)
                        }
                      }
                }
              />
            ) : (
              <div className="flex items-center gap-3">
                <ProfileAvatar profile={profile} photoURL={photoFor(profile)} />
                <span className="flex-1 truncate font-medium">
                  {profile.name}
                  {profile.id === user?.uid && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      You
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${profile.name}`}
                  onClick={() => setEditingId(profile.id)}
                >
                  <Pencil />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="bg-card rounded-xl border p-3">
          <ProfileForm
            submitLabel="Add profile"
            onSubmit={({ name, emoji }) => {
              addProfile({ name, emoji })
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
            hideTrackers
          />
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus /> Add profile
        </Button>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            Archived
          </h2>
          <ul className="flex flex-col gap-2">
            {archived.map(profile => (
              <li
                key={profile.id}
                className="flex items-center gap-3 rounded-xl border p-3 opacity-70"
              >
                <ProfileAvatar profile={profile} />
                <span className="flex-1 truncate">{profile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Restore ${profile.name}`}
                  onClick={() => setProfileArchived(profile.id, false)}
                >
                  <ArchiveRestore />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ProfileForm({
  initial,
  submitLabel,
  hideTrackers = false,
  onSubmit,
  onCancel,
  onArchive,
}: {
  initial?: Profile
  submitLabel: string
  hideTrackers?: boolean
  onSubmit: (changes: ProfileChanges) => void
  onCancel: () => void
  onArchive?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [emoji, setEmoji] = useState(initial?.emoji ?? "")
  const [enabled, setEnabled] = useState<TrackerId[]>(
    initial?.enabledTrackers ?? [...TRACKER_IDS],
  )

  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSubmit({
      name: trimmedName,
      emoji: emoji.trim() || undefined,
      enabledTrackers: enabled,
    })
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={event => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-emoji">Emoji</Label>
          <Input
            id="profile-emoji"
            value={emoji}
            onChange={event => setEmoji(event.target.value)}
            className="w-16 px-1 text-center text-lg"
            maxLength={4}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={event => setName(event.target.value)}
            autoFocus
          />
        </div>
      </div>

      {!hideTrackers && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-medium">Trackers</legend>
          {AVAILABLE_TRACKERS.map(({ id, title, Icon }) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled.includes(id)}
                onChange={() =>
                  setEnabled(prev => toggleTracker(prev, id, AVAILABLE_IDS))
                }
              />
              <Icon className="text-muted-foreground size-4" />
              {title}
            </label>
          ))}
          <p className="text-muted-foreground text-xs">
            Turning a tracker off hides it; its data is kept.
          </p>
        </fieldset>
      )}

      <div className="flex items-center gap-2">
        {onArchive && (
          <Button type="button" variant="ghost" onClick={onArchive}>
            <ArchiveX /> Archive
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto"
          aria-label="Cancel"
          onClick={onCancel}
        >
          <X />
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          <Check /> {submitLabel}
        </Button>
      </div>
    </form>
  )
}
