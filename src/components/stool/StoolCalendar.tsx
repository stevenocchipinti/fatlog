import type { ReactNode } from "react"

import type { BowelMovement, LocalDate } from "@/types"

import MonthCalendar, { LegendItem } from "@/components/MonthCalendar"
import { ZONE_STYLES } from "@/components/stool/zoneStyles"
import { bristolZone } from "@/lib/bowelMovements"
import { cn } from "@/lib/utils"

import type { CalendarDay } from "@/components/MonthCalendar"

/** Chips beyond this are summarised as "+n" so a cell never overflows. */
const MAX_CHIPS = 4

type StoolCalendarProps = {
  /** Any day in the month being shown. */
  month: LocalDate
  onMonthChange: (month: LocalDate) => void
  selected: LocalDate
  onSelect: (date: LocalDate) => void
  today: LocalDate
  /** Each day's movements in the order they happened. */
  movementsByDate: ReadonlyMap<LocalDate, readonly BowelMovement[]>
}

/**
 * A month of bowel movements. Each movement shows as a chip with its Bristol
 * type, coloured by zone.
 */
export default function StoolCalendar({
  movementsByDate,
  ...calendar
}: StoolCalendarProps) {
  return (
    <MonthCalendar
      {...calendar}
      renderDay={date => stoolDay(movementsByDate.get(date) ?? [])}
      legend={
        <>
          <LegendItem swatch={<Swatch className={ZONE_STYLES.ideal.chip} />}>
            3–4 ideal
          </LegendItem>
          <LegendItem swatch={<Swatch className={ZONE_STYLES.hard.chip} />}>
            1–2 hard, 5–7 loose
          </LegendItem>
        </>
      }
    />
  )
}

const Swatch = ({ className }: { className: string }) => (
  <span className={cn("size-2.5 rounded-sm", className)} />
)

const stoolDay = (movements: readonly BowelMovement[]): CalendarDay => {
  const overflow = movements.length > MAX_CHIPS
  const shown = overflow ? movements.slice(0, MAX_CHIPS - 1) : movements
  const compact = movements.length > 2

  return {
    summary:
      movements.length === 0
        ? "nothing recorded"
        : `${movements.length} bowel movement${movements.length === 1 ? "" : "s"}, type ${movements.map(m => m.bristolType).join(", ")}`,
    content: (
      <span
        aria-hidden
        className={cn(
          "justify-center gap-0.5 px-0.5 pt-0.5",
          compact ? "grid grid-cols-2" : "flex",
        )}
      >
        {shown.map(movement => (
          <Chip
            key={movement.id}
            compact={compact}
            className={ZONE_STYLES[bristolZone(movement.bristolType)].chip}
          >
            {movement.bristolType}
          </Chip>
        ))}
        {overflow && (
          <Chip compact className="bg-muted-foreground">
            +{movements.length - shown.length}
          </Chip>
        )}
      </span>
    ),
  }
}

function Chip({
  compact,
  className,
  children,
}: {
  compact: boolean
  className: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full px-1 leading-none font-bold text-white",
        compact ? "h-3.5 min-w-3.5 text-[10px]" : "h-4 min-w-4.5 text-[11px]",
        className,
      )}
    >
      {children}
    </span>
  )
}
