import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useId, useState } from "react"
import {
  ArchiveRestore,
  ArchiveX,
  Check,
  ChevronDown,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import type { Profile } from "@/lib/profiles"
import type { TrackerId } from "@/lib/trackers"
import type { ProfileChanges } from "@/lib/firebase"
import type { ReactNode } from "react"
import ProfileAvatar from "@/components/ProfileAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, useProfiles } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { isAccountId, toggleTracker } from "@/lib/profiles"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"
import { AVAILABLE_TRACKERS, TRACKER_IDS } from "@/lib/trackers"

export const Route = createFileRoute("/_auth/profiles")({
  component: ProfilesPage,
})

const AVAILABLE_IDS = AVAILABLE_TRACKERS.map(tracker => tracker.id)

function ProfilesPage() {
  const { user } = useAuth()
  const {
    profiles,
    addProfile,
    updateProfile,
    setProfileArchived,
    deleteProfile,
    setProfileShared,
  } = useProfiles()

  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  // A form stays mounted while it collapses, so it can animate closed. Each
  // opening gives it a fresh key, which drops whatever was left unsaved.
  const [formKeys, setFormKeys] = useState<Record<string, number>>({})
  const toggle = (id: string) => {
    if (editingId === id) {
      setEditingId(undefined)
    } else {
      setEditingId(id)
      setFormKeys(keys => ({ ...keys, [id]: (keys[id] ?? 0) + 1 }))
    }
  }

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
        {active.map(profile => {
          const expanded = editingId === profile.id
          return (
            <li key={profile.id} className="bg-card rounded-xl border">
              {/* Only the owner can change a profile, so only theirs opens. */}
              <ProfileHeader
                toggle={
                  profile.owned
                    ? {
                        expanded,
                        controls: `profile-${profile.id}-form`,
                        onToggle: () => toggle(profile.id),
                      }
                    : undefined
                }
              >
                <ProfileAvatar profile={profile} photoURL={photoFor(profile)} />
                <span className="flex-1 truncate font-medium">
                  {profile.name}
                  {profile.id === user?.uid && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      You
                    </span>
                  )}
                  {!profile.owned && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      Shared with you
                    </span>
                  )}
                </span>
              </ProfileHeader>
              {profile.owned && (
                <div
                  id={`profile-${profile.id}-form`}
                  // Animates between 0 and the form's natural height
                  // (interpolate-size, in styles.css). Browsers without it
                  // open and close instantly. Inert while closed, so the
                  // hidden form can't be focused or read out.
                  className={cn(
                    "overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none",
                    expanded ? "h-auto" : "h-0",
                  )}
                  inert={!expanded}
                >
                  <div className="mx-3 mb-3 border-t pt-3">
                    <ProfileForm
                      key={formKeys[profile.id] ?? 0}
                      initial={profile}
                      submitLabel="Save"
                      onSubmit={changes => {
                        updateProfile(profile.id, changes)
                        setEditingId(undefined)
                      }}
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
                    >
                      {user && (
                        <ProfileSharing
                          profile={profile}
                          ownAccountId={user.uid}
                          onChange={(accountId, shared) =>
                            setProfileShared(profile.id, accountId, shared)
                          }
                        />
                      )}
                    </ProfileForm>
                  </div>
                </div>
              )}
            </li>
          )
        })}
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
            autoFocus
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${profile.name} permanently`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete ${profile.name} and everything recorded for them? This can't be undone.`,
                      )
                    ) {
                      deleteProfile(profile.id)
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {user && <AccountId accountId={user.uid} />}
    </div>
  )
}

/**
 * A profile's name row. With `toggle`, the whole row is the button that opens
 * and closes the profile's edit form below it.
 */
function ProfileHeader({
  toggle,
  children,
}: {
  toggle?: { expanded: boolean; controls: string; onToggle: () => void }
  children: ReactNode
}) {
  const row = "flex w-full items-center gap-3 p-3"
  if (!toggle) return <div className={row}>{children}</div>
  return (
    <button
      type="button"
      className={cn(
        row,
        "focus-visible:ring-ring cursor-pointer rounded-xl text-left focus-visible:ring-1 focus-visible:outline-none",
      )}
      aria-expanded={toggle.expanded}
      aria-controls={toggle.controls}
      onClick={toggle.onToggle}
    >
      {children}
      <span className="flex size-9 items-center justify-center">
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 transition-transform motion-reduce:transition-none",
            toggle.expanded && "rotate-180",
          )}
        />
      </span>
    </button>
  )
}

/** The account's own ID, to send to whoever is sharing a profile with it. */
function AccountId({ accountId }: { accountId: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(accountId).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      },
      // No clipboard access: the ID is on screen to select by hand.
      () => {},
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-muted-foreground text-sm font-medium">
        Your account ID
      </h2>
      <div className="flex items-center gap-2 rounded-xl border p-3">
        <code className="min-w-0 flex-1 text-xs break-all select-all">
          {accountId}
        </code>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        To see someone else&apos;s profile here, send them this ID. They paste
        it under Sharing when editing that profile.
      </p>
    </section>
  )
}

/**
 * Who a profile is shared with, and a field to share it with another account
 * by pasting that account's ID. Changes apply straight away, not on Save.
 */
function ProfileSharing({
  profile,
  ownAccountId,
  onChange,
}: {
  profile: Profile
  ownAccountId: string
  onChange: (accountId: string, shared: boolean) => void
}) {
  const [accountId, setAccountId] = useState("")
  const shareId = useId()
  const trimmed = accountId.trim()
  const canShare =
    isAccountId(trimmed) &&
    trimmed !== ownAccountId &&
    !profile.sharedWith.includes(trimmed)

  const share = () => {
    if (!canShare) return
    onChange(trimmed, true)
    setAccountId("")
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={shareId}>Sharing</Label>
      {profile.sharedWith.length > 0 && (
        <ul className="flex flex-col gap-1">
          {profile.sharedWith.map(id => (
            <li key={id} className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate text-xs">{id}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Stop sharing with ${id}`}
                onClick={() => {
                  if (
                    window.confirm(`Stop sharing ${profile.name} with ${id}?`)
                  ) {
                    onChange(id, false)
                  }
                }}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={shareId}
          value={accountId}
          onChange={event => setAccountId(event.target.value)}
          // Enter would otherwise submit the profile form around this.
          onKeyDown={event => {
            if (event.key !== "Enter") return
            event.preventDefault()
            share()
          }}
          placeholder="Their account ID"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!canShare}
          onClick={share}
        >
          Share
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        They can see and record everything for {profile.name}. Their account ID
        is at the bottom of their Profiles page.
      </p>
    </div>
  )
}

function ProfileForm({
  initial,
  submitLabel,
  hideTrackers = false,
  autoFocus = false,
  onSubmit,
  onCancel,
  onArchive,
  children,
}: {
  initial?: Profile
  submitLabel: string
  hideTrackers?: boolean
  /** Focus the name field, e.g. for a new profile. */
  autoFocus?: boolean
  onSubmit: (changes: ProfileChanges) => void
  /** Shows a Cancel button; an expanded profile closes from its chevron. */
  onCancel?: () => void
  onArchive?: () => void
  /** Extra sections shown above the buttons. */
  children?: ReactNode
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const emojiId = useId()
  const nameId = useId()
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
          <Label htmlFor={emojiId}>Emoji</Label>
          <Input
            id={emojiId}
            value={emoji}
            onChange={event => setEmoji(event.target.value)}
            className="w-16 px-1 text-center text-lg"
            maxLength={4}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            id={nameId}
            value={name}
            onChange={event => setName(event.target.value)}
            autoFocus={autoFocus}
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

      {children}

      <div className="flex items-center gap-2">
        {onArchive && (
          <Button type="button" variant="ghost" onClick={onArchive}>
            <ArchiveX /> Archive
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className={cn(!onCancel && "ml-auto")}
          disabled={!name.trim()}
        >
          <Check /> {submitLabel}
        </Button>
      </div>
    </form>
  )
}
