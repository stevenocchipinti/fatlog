import { useEffect, useState } from "react"

import type { BowelMovement, BristolType, NewBowelMovement } from "@/types"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BRISTOL_TYPES } from "@/lib/bowelMovements"
import BristolIcon from "@/components/stool/BristolIcon"
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/dateTimeLocal"
import { cn } from "@/lib/utils"

type BowelMovementDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The bowel movement being edited; absent when recording a new one. */
  editing?: BowelMovement
  onSubmit: (bowelMovement: NewBowelMovement) => void
  onDelete: (bowelMovement: BowelMovement) => void
}

/**
 * Records or edits a bowel movement: when it happened (defaulting to now), its
 * Bristol type from seven large options, and an optional note. Editing also
 * offers a confirmed delete.
 */
export default function BowelMovementDrawer({
  open,
  onOpenChange,
  editing,
  onSubmit,
  onDelete,
}: BowelMovementDrawerProps) {
  const [time, setTime] = useState("")
  const [bristolType, setBristolType] = useState<BristolType>()
  const [note, setNote] = useState("")

  // Start from the edited movement, or from "now" with nothing chosen.
  useEffect(() => {
    if (!open) return
    setTime(toDateTimeLocalValue(editing ? editing.timestamp : Date.now()))
    setBristolType(editing?.bristolType)
    setNote(editing?.note ?? "")
  }, [open, editing])

  const timestamp = fromDateTimeLocalValue(time)
  const valid = timestamp !== undefined && bristolType !== undefined

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <form
          className="mx-auto flex min-h-0 w-full max-w-sm flex-col"
          onSubmit={event => {
            event.preventDefault()
            if (!valid) return
            onSubmit({ timestamp, bristolType, note })
          }}
        >
          <DrawerHeader className="pb-2">
            <DrawerTitle>
              {editing ? "Edit" : "Record"} bowel movement
            </DrawerTitle>
            <DrawerDescription>
              Pick the type on the Bristol stool chart.
            </DrawerDescription>
          </DrawerHeader>

          <div
            className="min-h-0 space-y-3 overflow-y-auto p-4"
            data-vaul-no-drag
          >
            <div className="space-y-1.5">
              <Label htmlFor="stool-time">When</Label>
              <Input
                id="stool-time"
                type="datetime-local"
                value={time}
                onChange={event => setTime(event.target.value)}
              />
            </div>

            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">Type</legend>
              {BRISTOL_TYPES.map(info => (
                <label key={info.type} className="block cursor-pointer">
                  <input
                    type="radio"
                    name="bristol-type"
                    value={info.type}
                    checked={bristolType === info.type}
                    onChange={() => setBristolType(info.type)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                      "peer-checked:border-brand-1 peer-checked:bg-muted",
                      "peer-focus-visible:ring-ring peer-focus-visible:ring-2",
                    )}
                  >
                    <span className="w-6 text-center text-lg font-semibold tabular-nums">
                      {info.type}
                    </span>
                    <BristolIcon
                      type={info.type}
                      className="!size-7 shrink-0"
                    />
                    <span className="flex-1 text-sm">{info.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="stool-note">Note (optional)</Label>
              <Input
                id="stool-note"
                value={note}
                onChange={event => setNote(event.target.value)}
              />
            </div>
          </div>

          <DrawerFooter className="pt-2">
            <Button disabled={!valid}>Save</Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this bowel movement?",
                    )
                  ) {
                    onDelete(editing)
                  }
                }}
              >
                Delete
              </Button>
            )}
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
