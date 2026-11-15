import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import {
  ArchiveRestore,
  ArchiveX,
  Check,
  Copy,
  Pencil,
  Plus,
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
    setProfileShared,
  } = useProfiles()

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
                  {!profile.owned && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      Shared with you
                    </span>
                  )}
                </span>
                {/* Only the owner can change a profile. */}
                {profile.owned && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${profile.name}`}
                    onClick={() => setEditingId(profile.id)}
                  >
                    <Pencil />
                  </Button>
                )}
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

      {user && <AccountId accountId={user.uid} />}
    </div>
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
      <Label htmlFor="profile-share">Sharing</Label>
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
          id="profile-share"
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
  onSubmit,
  onCancel,
  onArchive,
  children,
}: {
  initial?: Profile
  submitLabel: string
  hideTrackers?: boolean
  onSubmit: (changes: ProfileChanges) => void
  onCancel: () => void
  onArchive?: () => void
  /** Extra sections shown above the buttons. */
  children?: ReactNode
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

      {children}

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
