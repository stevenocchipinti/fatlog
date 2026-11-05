import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { useCallback, useMemo, useState } from "react"

import type { BowelMovement, LocalDate } from "@/types"

import BowelMovementDrawer from "@/components/stool/BowelMovementDrawer"
import { BRISTOL_TYPES, groupByLocalDay } from "@/lib/bowelMovements"
import BristolIcon from "@/components/stool/BristolIcon"
import { useBowelMovements } from "@/lib/firebase"
import { addDays, fromLocalDate, todayLocalDate } from "@/lib/localDate"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"

export const Route = createFileRoute("/_auth/stool")({
  component: StoolPage,
})

const dayHeading = (date: LocalDate) => {
  const today = todayLocalDate()
  if (date === today) return "Today"
  if (date === addDays(today, -1)) return "Yesterday"
  return format(fromLocalDate(date), "EEEE d MMMM")
}

function StoolPage() {
  const {
    bowelMovements,
    state,
    addBowelMovement,
    updateBowelMovement,
    deleteBowelMovement,
  } = useBowelMovements()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BowelMovement>()

  const days = useMemo(() => groupByLocalDay(bowelMovements), [bowelMovements])

  const openNew = useCallback(() => {
    setEditing(undefined)
    setOpen(true)
  }, [])

  // The shared bottom nav's `+` records a bowel movement while this route is
  // active.
  useRegisterPrimaryAction("Record bowel movement", openNew)

  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-2">
        {state !== "LOADED" ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Loading…
          </p>
        ) : days.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="text-lg font-semibold">No bowel movements yet</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tap + to record one.
            </p>
          </div>
        ) : (
          days.map(day => (
            <section key={day.date} className="flex flex-col gap-1.5">
              <h2 className="text-muted-foreground text-sm font-medium">
                {dayHeading(day.date)}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {day.movements.map(movement => {
                  const info = BRISTOL_TYPES[movement.bristolType - 1]
                  return (
                    <li key={movement.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(movement)
                          setOpen(true)
                        }}
                        className="bg-card hover:bg-muted/60 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
                      >
                        <span className="text-muted-foreground w-12 text-sm tabular-nums">
                          {format(new Date(movement.timestamp), "HH:mm")}
                        </span>
                        <span
                          className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full"
                          title={info.description}
                        >
                          <BristolIcon
                            type={movement.bristolType}
                            className="!size-5"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            Type {movement.bristolType}
                          </span>
                          {movement.note && (
                            <span className="text-muted-foreground block truncate text-sm">
                              {movement.note}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <BowelMovementDrawer
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSubmit={bowelMovement => {
          if (editing) void updateBowelMovement(editing.id, bowelMovement)
          else void addBowelMovement(bowelMovement)
          setOpen(false)
        }}
        onDelete={bowelMovement => {
          void deleteBowelMovement(bowelMovement.id)
          setOpen(false)
        }}
      />
    </>
  )
}
