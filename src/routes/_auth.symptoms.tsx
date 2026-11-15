import { createFileRoute } from "@tanstack/react-router"
import { format, isSameDay } from "date-fns"
import { useCallback, useMemo, useState } from "react"

import type { SymptomEpisode } from "@/types"

import SymptomCalendar from "@/components/symptoms/SymptomCalendar"
import SymptomEpisodeDrawer from "@/components/symptoms/SymptomEpisodeDrawer"
import { Button } from "@/components/ui/button"
import { dayHeading } from "@/lib/dayHeading"
import { useSymptomEpisodes } from "@/lib/firebase"
import { toLocalDate, todayLocalDate } from "@/lib/localDate"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"
import { endEpisodeNow, symptomDays } from "@/lib/symptoms"
import Skeleton from "@/components/Skeleton"

export const Route = createFileRoute("/_auth/symptoms")({
  component: SymptomsPage,
})

const moment = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = format(date, "HH:mm")
  if (isSameDay(date, now)) return `Today ${time}`
  if (isSameDay(date, yesterday)) return `Yesterday ${time}`
  return `${format(date, "d MMM")} ${time}`
}

/** "Since …" while ongoing; one moment for a one-off; otherwise start – end. */
const period = ({ start, end }: SymptomEpisode) => {
  if (end === undefined) return `Since ${moment(start)}`
  if (end === start) return moment(start)
  const sameDay = isSameDay(new Date(start), new Date(end))
  return `${moment(start)} – ${sameDay ? format(new Date(end), "HH:mm") : moment(end)}`
}

function SymptomsPage() {
  const {
    symptomEpisodes,
    state,
    addSymptomEpisode,
    updateSymptomEpisode,
    deleteSymptomEpisode,
  } = useSymptomEpisodes()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SymptomEpisode>()

  const today = todayLocalDate()
  const [month, setMonth] = useState(today)
  const [selected, setSelected] = useState(today)

  const days = useMemo(
    () => symptomDays(symptomEpisodes, today),
    [symptomEpisodes, today],
  )
  const selectedEpisodes = days.get(selected)?.episodes ?? []

  const openNew = useCallback(() => {
    setEditing(undefined)
    setOpen(true)
  }, [])

  // The shared bottom nav's `+` records a symptom while this route is active.
  useRegisterPrimaryAction("Record symptom", openNew)

  const edit = (episode: SymptomEpisode) => {
    setEditing(episode)
    setOpen(true)
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-2">
        <SymptomCalendar
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={setSelected}
          today={today}
          days={days}
        />
        <section className="flex flex-col gap-1.5">
          <h2 className="text-muted-foreground text-sm font-medium">
            {dayHeading(selected)}
          </h2>
          {state === "INITIALIZING" ? (
            // Nothing saved from an earlier visit yet: hold the list's place
            // rather than claim the day is empty.
            <div role="status" aria-label="Loading symptoms">
              <Skeleton className="h-[4.125rem] rounded-xl" />
            </div>
          ) : selectedEpisodes.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Nothing recorded. Tap + to record a symptom.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {selectedEpisodes.map(episode => (
                <li key={episode.id} className="flex items-stretch gap-1.5">
                  <button
                    type="button"
                    onClick={() => edit(episode)}
                    className="bg-card hover:bg-muted/60 min-w-0 flex-1 rounded-xl border p-3 text-left transition-colors"
                  >
                    <span className="block text-sm font-medium">
                      {episode.symptom}
                    </span>
                    <span className="text-muted-foreground block text-sm">
                      {period(episode)}
                    </span>
                    {episode.note && (
                      <span className="text-muted-foreground block truncate text-sm">
                        {episode.note}
                      </span>
                    )}
                  </button>
                  {episode.end === undefined && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto rounded-xl"
                      onClick={() =>
                        updateSymptomEpisode(
                          episode.id,
                          endEpisodeNow(episode, Date.now()),
                        )
                      }
                    >
                      End now
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SymptomEpisodeDrawer
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        history={symptomEpisodes}
        onSubmit={episode => {
          if (editing) updateSymptomEpisode(editing.id, episode)
          else addSymptomEpisode(episode)
          // Show the day it starts on, which may not be the one selected.
          const date = toLocalDate(new Date(episode.start))
          setSelected(date)
          setMonth(date)
          setOpen(false)
        }}
        onDelete={episode => {
          deleteSymptomEpisode(episode.id)
          setOpen(false)
        }}
      />
    </>
  )
}
