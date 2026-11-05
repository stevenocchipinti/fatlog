import { createFileRoute } from "@tanstack/react-router"
import { format, isSameDay } from "date-fns"
import { useCallback, useMemo, useState } from "react"

import type { SymptomEpisode } from "@/types"

import SymptomEpisodeDrawer from "@/components/symptoms/SymptomEpisodeDrawer"
import { Button } from "@/components/ui/button"
import { useSymptomEpisodes } from "@/lib/firebase"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"
import { endEpisodeNow, splitOngoingAndPast } from "@/lib/symptoms"

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

  const { ongoing, past } = useMemo(
    () => splitOngoingAndPast(symptomEpisodes),
    [symptomEpisodes],
  )

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

  const row = (episode: SymptomEpisode, action?: React.ReactNode) => (
    <li key={episode.id} className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={() => edit(episode)}
        className="bg-card hover:bg-muted/60 min-w-0 flex-1 rounded-xl border p-3 text-left transition-colors"
      >
        <span className="block text-sm font-medium">{episode.symptom}</span>
        <span className="text-muted-foreground block text-sm">
          {period(episode)}
        </span>
        {episode.note && (
          <span className="text-muted-foreground block truncate text-sm">
            {episode.note}
          </span>
        )}
      </button>
      {action}
    </li>
  )

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-2">
        {state !== "LOADED" ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Loading…
          </p>
        ) : symptomEpisodes.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="text-lg font-semibold">No symptoms yet</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tap + to record one.
            </p>
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <section className="flex flex-col gap-1.5">
                <h2 className="text-muted-foreground text-sm font-medium">
                  Ongoing
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {ongoing.map(episode =>
                    row(
                      episode,
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
                      </Button>,
                    ),
                  )}
                </ul>
              </section>
            )}
            {past.length > 0 && (
              <section className="flex flex-col gap-1.5">
                <h2 className="text-muted-foreground text-sm font-medium">
                  Past
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {past.map(episode => row(episode))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <SymptomEpisodeDrawer
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        history={symptomEpisodes}
        onSubmit={episode => {
          if (editing) void updateSymptomEpisode(editing.id, episode)
          else void addSymptomEpisode(episode)
          setOpen(false)
        }}
        onDelete={episode => {
          void deleteSymptomEpisode(episode.id)
          setOpen(false)
        }}
      />
    </>
  )
}
