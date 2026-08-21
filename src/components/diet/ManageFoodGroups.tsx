import { useState } from "react"
import {
  ArchiveRestore,
  ArchiveX,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

import type { FoodGroup, NewFoodGroup } from "@/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { STARTER_FOOD_GROUPS } from "@/lib/starterFoodGroups"

type ManageFoodGroupsProps = {
  foodGroups: FoodGroup[]
  /** Predicate: does this food group have any rules/exceptions in history? */
  hasHistory: (foodGroupId: string) => boolean
  onCreate: (foodGroup: NewFoodGroup) => void
  onUpdate: (id: string, foodGroup: NewFoodGroup) => void
  onDelete: (id: string) => void
  onBack: () => void
}

/**
 * Food group management, surfaced from inside the Diet drawer.
 *
 * Creating offers the starter food groups as one-tap suggestions but only ever
 * persists a record once the user saves it. Removing a food group that has
 * history archives it (preserving that history); an unused food group can be
 * permanently deleted. Archived groups are hidden from the main timeline but
 * recoverable here.
 */
export default function ManageFoodGroups({
  foodGroups,
  hasHistory,
  onCreate,
  onUpdate,
  onDelete,
  onBack,
}: ManageFoodGroupsProps) {
  const [emoji, setEmoji] = useState("")
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string>()
  const [editingEmoji, setEditingEmoji] = useState("")
  const [editingName, setEditingName] = useState("")

  const active = foodGroups
    .filter(g => !g.archived)
    .sort((a, b) => a.order - b.order)
  const archived = foodGroups.filter(g => g.archived)

  const nextOrder = active.reduce((max, g) => Math.max(max, g.order), -1) + 1

  const usedNames = new Set(foodGroups.map(g => g.name.trim().toLowerCase()))
  const remainingStarters = STARTER_FOOD_GROUPS.filter(
    s => !usedNames.has(s.name.toLowerCase()),
  )

  const create = () => {
    const trimmedName = name.trim()
    const trimmedEmoji = emoji.trim()
    if (!trimmedName || !trimmedEmoji) return
    onCreate({
      emoji: trimmedEmoji,
      name: trimmedName,
      order: nextOrder,
      archived: false,
    })
    setEmoji("")
    setName("")
  }

  const move = (group: FoodGroup, direction: -1 | 1) => {
    const index = active.findIndex(g => g.id === group.id)
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= active.length) return
    const swapWith = active[swapIndex]
    onUpdate(group.id, { ...toNew(group), order: swapWith.order })
    onUpdate(swapWith.id, { ...toNew(swapWith), order: group.order })
  }

  const startEditing = (group: FoodGroup) => {
    setEditingId(group.id)
    setEditingEmoji(group.emoji)
    setEditingName(group.name)
  }

  const saveEditing = (group: FoodGroup) => {
    const trimmedEmoji = editingEmoji.trim()
    const trimmedName = editingName.trim()
    if (!trimmedEmoji || !trimmedName) return
    onUpdate(group.id, {
      ...toNew(group),
      emoji: trimmedEmoji,
      name: trimmedName,
    })
    setEditingId(undefined)
  }

  const remove = (group: FoodGroup) => {
    if (hasHistory(group.id)) {
      // Preserve history: archive rather than delete.
      onUpdate(group.id, { ...toNew(group), archived: true })
    } else if (
      window.confirm(`Permanently delete "${group.name}"? It has no history.`)
    ) {
      onDelete(group.id)
    }
  }

  const editFields = (group: FoodGroup) => (
    <>
      <Input
        value={editingEmoji}
        onChange={event => setEditingEmoji(event.target.value)}
        aria-label={`Emoji for ${group.name}`}
        className="h-8 w-12 px-1 text-center text-lg"
        maxLength={4}
        autoFocus
      />
      <Input
        value={editingName}
        onChange={event => setEditingName(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault()
            saveEditing(group)
          }
          if (event.key === "Escape") setEditingId(undefined)
        }}
        aria-label={`Name for ${group.name}`}
        className="h-8 min-w-0 flex-1"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={!editingEmoji.trim() || !editingName.trim()}
        aria-label={`Save ${group.name}`}
        onClick={() => saveEditing(group)}
      >
        <Check className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={`Cancel editing ${group.name}`}
        onClick={() => setEditingId(undefined)}
      >
        <X className="size-4" />
      </Button>
    </>
  )

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Manage food groups</h3>
        <Button variant="ghost" size="sm" onClick={onBack}>
          Done
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">
          Add a food group
        </Label>
        {remainingStarters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {remainingStarters.map(starter => (
              <button
                key={starter.name}
                type="button"
                onClick={() =>
                  onCreate({
                    emoji: starter.emoji,
                    name: starter.name,
                    order: nextOrder,
                    archived: false,
                  })
                }
                className="bg-muted hover:bg-muted/70 flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors"
              >
                <span aria-hidden>{starter.emoji}</span>
                {starter.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder="🥗"
            aria-label="Food group emoji"
            className="w-14 text-center text-lg"
            maxLength={4}
          />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault()
                create()
              }
            }}
            placeholder="Custom food group name"
            aria-label="Food group name"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={create}
            disabled={!emoji.trim() || !name.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {active.length > 0 && (
        <ul className="divide-border divide-y rounded-md border">
          {active.map((group, index) => (
            <li key={group.id} className="flex items-center gap-2 p-2">
              {editingId === group.id ? (
                editFields(group)
              ) : (
                <>
                  <span aria-hidden className="text-lg">
                    {group.emoji}
                  </span>
                  <span className="flex-1 text-sm">{group.name}</span>
                </>
              )}
              {editingId !== group.id && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Edit ${group.name}`}
                    onClick={() => startEditing(group)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0}
                    aria-label={`Move ${group.name} up`}
                    onClick={() => move(group, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === active.length - 1}
                    aria-label={`Move ${group.name} down`}
                    onClick={() => move(group, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-7"
                    aria-label={
                      hasHistory(group.id)
                        ? `Archive ${group.name}`
                        : `Delete ${group.name}`
                    }
                    onClick={() => remove(group)}
                  >
                    {hasHistory(group.id) ? (
                      <ArchiveX className="size-4" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Archived</Label>
          <ul className="divide-border divide-y rounded-md border opacity-70">
            {archived.map(group => (
              <li key={group.id} className="flex items-center gap-2 p-2">
                {editingId === group.id ? (
                  editFields(group)
                ) : (
                  <>
                    <span aria-hidden className="text-lg grayscale">
                      {group.emoji}
                    </span>
                    <span className="flex-1 text-sm">{group.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Edit ${group.name}`}
                      onClick={() => startEditing(group)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Unarchive ${group.name}`}
                      onClick={() =>
                        onUpdate(group.id, {
                          ...toNew(group),
                          archived: false,
                          order: nextOrder,
                        })
                      }
                    >
                      <ArchiveRestore className="mr-1 size-4" />
                      Restore
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const toNew = (group: FoodGroup): NewFoodGroup => ({
  emoji: group.emoji,
  name: group.name,
  order: group.order,
  archived: group.archived,
})
