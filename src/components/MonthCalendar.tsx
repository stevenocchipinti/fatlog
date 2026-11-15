import { format } from "date-fns"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"
import { flushSync } from "react-dom"

import type { PanInfo } from "framer-motion"
import type { ReactNode } from "react"

import type { LocalDate } from "@/types"

import { Button } from "@/components/ui/button"
import {
  addMonths,
  fromLocalDate,
  monthWeeks,
  startOfMonth,
} from "@/lib/localDate"
import { cn } from "@/lib/utils"

/** Every month is laid out over six weeks so the height never jumps. */
const CELLS = 6 * 7

/**
 * A swipe changes month once it covers this fraction of the calendar's width,
 * or is flicked faster than SWIPE_VELOCITY (px/s).
 */
const SWIPE_DISTANCE = 0.25
const SWIPE_VELOCITY = 400

export type CalendarDay = {
  /** What was recorded that day, read out after the date. */
  summary: string
  /** Shown under the day number, inside the cell. */
  content?: ReactNode
  /**
   * Drawn over the cell without being clipped to it, so a mark can reach
   * across the gap into the next day.
   */
  overlay?: ReactNode
}

type MonthCalendarProps = {
  /** Any day in the month being shown. */
  month: LocalDate
  onMonthChange: (month: LocalDate) => void
  selected: LocalDate
  onSelect: (date: LocalDate) => void
  today: LocalDate
  renderDay: (date: LocalDate) => CalendarDay
  /** `LegendItem`s explaining the marks. */
  legend: ReactNode
}

/**
 * A month of days, Monday first, each showing whatever a tracker recorded on
 * it. The months sit side by side on a strip that follows a horizontal swipe;
 * the arrows slide it the same way. It never goes past the current month, and
 * days after today can't be selected.
 */
export default function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  today,
  renderDay,
  legend,
}: MonthCalendarProps) {
  const canGoNext = startOfMonth(month) < startOfMonth(today)
  const viewport = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const reduceMotion = useReducedMotion()
  const sliding = useRef(false)
  // Set once a drag starts, so the click that ends it doesn't select a day.
  const dragged = useRef(false)

  const slide = (by: -1 | 1) => {
    if (sliding.current || (by > 0 && !canGoNext)) return
    const finish = () => {
      // Render the new month before recentring the strip, so the old month
      // never flashes back into view.
      flushSync(() => onMonthChange(addMonths(month, by)))
      x.set(0)
      sliding.current = false
    }
    const width = viewport.current?.offsetWidth ?? 0
    if (reduceMotion || !width) return finish()
    sliding.current = true
    void animate(x, -by * width, {
      type: "tween",
      ease: "easeOut",
      duration: 0.25,
    }).then(finish)
  }

  const onDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    const width = viewport.current?.offsetWidth ?? 0
    const distance = width * SWIPE_DISTANCE
    if (canGoNext && (offset.x < -distance || velocity.x < -SWIPE_VELOCITY))
      slide(1)
    else if (offset.x > distance || velocity.x > SWIPE_VELOCITY) slide(-1)
    else void animate(x, 0, { type: "spring", bounce: 0, duration: 0.3 })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => slide(-1)}
        >
          <ChevronLeft />
        </Button>
        <h2 className="text-sm font-semibold" aria-live="polite">
          {format(fromLocalDate(month), "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => slide(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-0.5" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div
            key={index}
            className="text-muted-foreground text-center text-xs"
          >
            {day}
          </div>
        ))}
      </div>

      <div ref={viewport} className="overflow-hidden">
        {/* Previous, current and next month; the strip is offset by one
            month's width so the current one shows. */}
        <motion.div
          className="-ml-[100%] flex w-[300%]"
          style={{ x }}
          drag="x"
          dragDirectionLock
          dragMomentum={false}
          // Resist swiping towards next month while on the current one.
          dragConstraints={canGoNext ? undefined : { left: 0, right: 1e5 }}
          dragElastic={0.15}
          onPointerDownCapture={() => {
            dragged.current = false
          }}
          onDragStart={() => {
            dragged.current = true
          }}
          onDragEnd={onDragEnd}
          onClickCapture={event => {
            if (dragged.current) {
              event.stopPropagation()
              event.preventDefault()
            }
          }}
        >
          {([-1, 0, 1] as const).map(offset => {
            const shown = offset === 0
            const panelMonth = addMonths(month, offset)
            return (
              <div
                key={offset > 0 && !canGoNext ? "none" : panelMonth}
                className="w-1/3 shrink-0 px-0.5"
                aria-hidden={!shown}
                inert={!shown}
              >
                {(offset <= 0 || canGoNext) && (
                  <MonthGrid
                    month={panelMonth}
                    today={today}
                    selected={selected}
                    onSelect={onSelect}
                    renderDay={renderDay}
                  />
                )}
              </div>
            )
          })}
        </motion.div>
      </div>

      <div className="text-muted-foreground flex justify-center gap-4 text-xs">
        {legend}
      </div>
    </div>
  )
}

export function LegendItem({
  swatch,
  children,
}: {
  /** A small sample of the mark being explained. */
  swatch: ReactNode
  children: ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  )
}

function MonthGrid({
  month,
  today,
  selected,
  onSelect,
  renderDay,
}: Pick<
  MonthCalendarProps,
  "month" | "today" | "selected" | "onSelect" | "renderDay"
>) {
  const days = monthWeeks(month).flat()
  while (days.length < CELLS) days.push(null)
  return (
    <div className="grid grid-cols-7 gap-1 py-0.5">
      {days.map((date, index) =>
        date ? (
          <DayCell
            key={date}
            date={date}
            day={renderDay(date)}
            isToday={date === today}
            isSelected={date === selected}
            isFuture={date > today}
            onSelect={() => onSelect(date)}
          />
        ) : (
          <div key={`pad-${index}`} className="aspect-[1/1.1]" />
        ),
      )}
    </div>
  )
}

function DayCell({
  date,
  day,
  isToday,
  isSelected,
  isFuture,
  onSelect,
}: {
  date: LocalDate
  day: CalendarDay
  isToday: boolean
  isSelected: boolean
  isFuture: boolean
  onSelect: () => void
}) {
  return (
    <div className={cn("relative", isFuture && "opacity-35")}>
      <button
        type="button"
        disabled={isFuture}
        aria-label={`${format(fromLocalDate(date), "EEEE d MMMM")}: ${day.summary}`}
        aria-pressed={isSelected}
        onClick={onSelect}
        className={cn(
          "flex aspect-[1/1.1] w-full flex-col items-center gap-0.5 overflow-hidden rounded-lg pt-1 tabular-nums transition-colors",
          isSelected
            ? "bg-foreground/15"
            : "bg-foreground/5 hover:bg-foreground/10",
          isToday && "ring-foreground ring-2",
        )}
      >
        <span className="text-xs leading-none font-medium">
          {fromLocalDate(date).getDate()}
        </span>
        {day.content}
      </button>
      {day.overlay}
    </div>
  )
}
