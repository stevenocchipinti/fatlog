import { useEffect, useState } from "react"

import type { NewSymptomEpisode, SymptomEpisode } from "@/types"

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
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/dateTimeLocal"
import { isEndBeforeStart, suggestSymptomNames } from "@/lib/symptoms"

type SymptomEpisodeDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The episode being edited; absent when recording a new one. */
  editing?: SymptomEpisode
  /** The active profile's episodes, which the symptom name autocompletes from. */
  history: readonly SymptomEpisode[]
  onSubmit: (episode: NewSymptomEpisode) => void
  onDelete: (episode: SymptomEpisode) => void
}

/**
 * Records or edits a symptom episode: a free-text symptom name (suggesting
 * names from this profile's past episodes), when it started (defaulting to
 * now), and either that it is ongoing or when it ended, plus an optional note.
 * Unticking "Still ongoing" starts the end at the start time, which records a
 * quick one-off. Editing also offers a confirmed delete.
 */
export default function SymptomEpisodeDrawer({
  open,
  onOpenChange,
  editing,
  history,
  onSubmit,
  onDelete,
}: SymptomEpisodeDrawerProps) {
  const [symptom, setSymptom] = useState("")
  const [start, setStart] = useState("")
  const [ongoing, setOngoing] = useState(true)
  const [end, setEnd] = useState("")
  const [note, setNote] = useState("")

  // Start from the edited episode, or from "now" and ongoing.
  useEffect(() => {
    if (!open) return
    setSymptom(editing?.symptom ?? "")
    setStart(toDateTimeLocalValue(editing ? editing.start : Date.now()))
    setOngoing(editing ? editing.end === undefined : true)
    setEnd(editing?.end !== undefined ? toDateTimeLocalValue(editing.end) : "")
    setNote(editing?.note ?? "")
  }, [open, editing])

  const startTime = fromDateTimeLocalValue(start)
  const endTime = ongoing ? undefined : fromDateTimeLocalValue(end)
  const endBeforeStart =
    startTime !== undefined &&
    endTime !== undefined &&
    isEndBeforeStart({ start: startTime, end: endTime })
  const valid =
    symptom.trim() !== "" &&
    startTime !== undefined &&
    (ongoing || endTime !== undefined) &&
    !endBeforeStart

  const suggestions = suggestSymptomNames(history, symptom)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <form
          className="mx-auto flex min-h-0 w-full max-w-sm flex-col"
          onSubmit={event => {
            event.preventDefault()
            if (!valid) return
            onSubmit({ symptom, start: startTime, end: endTime, note })
          }}
        >
          <DrawerHeader className="pb-2">
            <DrawerTitle>{editing ? "Edit" : "Record"} symptom</DrawerTitle>
            <DrawerDescription>
              Leave it ongoing, or give it an end for a one-off.
            </DrawerDescription>
          </DrawerHeader>

          <div
            className="min-h-0 space-y-3 overflow-y-auto p-4"
            data-vaul-no-drag
          >
            <div className="space-y-1.5">
              <Label htmlFor="symptom-name">Symptom</Label>
              <Input
                id="symptom-name"
                value={symptom}
                onChange={event => setSymptom(event.target.value)}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Previous symptoms"
                >
                  {suggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSymptom(name)}
                      className="bg-muted hover:bg-muted/70 rounded-full px-2.5 py-1 text-sm transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symptom-start">Started</Label>
              <Input
                id="symptom-start"
                type="datetime-local"
                value={start}
                onChange={event => setStart(event.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ongoing}
                onChange={event => {
                  setOngoing(event.target.checked)
                  // Unticking records a one-off until the user moves the end.
                  if (!event.target.checked && !end) setEnd(start)
                }}
              />
              Still ongoing
            </label>

            {!ongoing && (
              <div className="space-y-1.5">
                <Label htmlFor="symptom-end">Ended</Label>
                <Input
                  id="symptom-end"
                  type="datetime-local"
                  value={end}
                  onChange={event => setEnd(event.target.value)}
                />
                {endBeforeStart && (
                  <p role="alert" className="text-destructive text-sm">
                    It can't end before it started.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="symptom-note">Note (optional)</Label>
              <Input
                id="symptom-note"
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
                      "Are you sure you want to delete this symptom?",
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
