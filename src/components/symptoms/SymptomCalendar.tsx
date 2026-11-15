import type { LocalDate } from "@/types"

import MonthCalendar, { LegendItem } from "@/components/MonthCalendar"
import { fromLocalDate } from "@/lib/localDate"
import { cn } from "@/lib/utils"

import type { CalendarDay } from "@/components/MonthCalendar"
import type { SymptomBar, SymptomDay } from "@/lib/symptoms"

/** One-offs beyond this are summarised as "+n" so a cell never overflows. */
const MAX_DOTS = 3

/** Overlapping episodes beyond this aren't drawn; the day's list still has them. */
const MAX_LANES = 2

type SymptomCalendarProps = {
  /** Any day in the month being shown. */
  month: LocalDate
  onMonthChange: (month: LocalDate) => void
  selected: LocalDate
  onSelect: (date: LocalDate) => void
  today: LocalDate
  /** Each day that has symptoms, from `symptomDays`. */
  days: ReadonlyMap<LocalDate, SymptomDay>
}

/**
 * A month of symptoms. A one-off shows as a dot on its day. An episode that
 * lasted a while shows as a bar running along the bottom of every day it
 * covers, rounded where it starts and ends. An ongoing episode's bar fades out
 * at today instead of ending.
 */
export default function SymptomCalendar({
  days,
  ...calendar
}: SymptomCalendarProps) {
  return (
    <MonthCalendar
      {...calendar}
      renderDay={date => symptomDay(date, days.get(date))}
      legend={
        <>
          <LegendItem swatch={<span className={cn(DOT, "size-2")} />}>
            One-off
          </LegendItem>
          <LegendItem
            swatch={<span className="h-1.5 w-5 rounded-full bg-rose-500" />}
          >
            Lasted a while
          </LegendItem>
          <LegendItem
            swatch={<span className={cn("w-5 rounded-l-full", ONGOING_END)} />}
          >
            Ongoing
          </LegendItem>
        </>
      }
    />
  )
}

const DOT = "rounded-full bg-rose-500"
const ONGOING_END = "h-1.5 bg-linear-to-r from-rose-500 from-35% to-transparent"

const symptomDay = (date: LocalDate, day?: SymptomDay): CalendarDay => {
  if (!day) return { summary: "nothing recorded" }

  const overflow = day.oneOffs.length > MAX_DOTS
  const dots = overflow ? MAX_DOTS - 1 : day.oneOffs.length
  const weekday = fromLocalDate(date).getDay()

  return {
    summary: day.episodes
      .map(({ symptom, end }) =>
        end === undefined ? `${symptom} (ongoing)` : symptom,
      )
      .join(", "),
    content: dots > 0 && (
      <span
        aria-hidden
        className="flex items-center justify-center gap-0.5 pt-1"
      >
        {Array.from({ length: dots }, (_, index) => (
          <span key={index} className={cn(DOT, "size-1.5")} />
        ))}
        {overflow && (
          <span className="text-[9px] leading-none font-bold text-rose-600 dark:text-rose-400">
            +{day.oneOffs.length - dots}
          </span>
        )}
      </span>
    ),
    overlay: day.bars.length > 0 && (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-1.5 flex flex-col-reverse gap-0.5"
      >
        {Array.from({ length: MAX_LANES }, (_, lane) => (
          <Bar
            key={lane}
            bar={day.bars[lane]}
            isMonday={weekday === 1}
            isSunday={weekday === 0}
          />
        ))}
      </span>
    ),
  }
}

/**
 * One day's stretch of an episode's bar. Mid-run it reaches across the gap to
 * the neighbouring days so the run reads as one line, stopping at the edges
 * of the week.
 */
function Bar({
  bar,
  isMonday,
  isSunday,
}: {
  bar: SymptomBar | undefined
  isMonday: boolean
  isSunday: boolean
}) {
  if (!bar) return <span className="h-1.5" />
  const ongoing = bar.episode.end === undefined
  return (
    <span
      data-bar={
        bar.endsHere && ongoing
          ? "ongoing"
          : bar.startsHere && bar.endsHere
            ? "whole"
            : bar.startsHere
              ? "start"
              : bar.endsHere
                ? "end"
                : "middle"
      }
      className={cn(
        bar.endsHere && ongoing ? ONGOING_END : "h-1.5 bg-rose-500",
        bar.startsHere ? "ml-1.5 rounded-l-full" : !isMonday && "-ml-0.5",
        bar.endsHere
          ? cn("mr-1.5", !ongoing && "rounded-r-full")
          : !isSunday && "-mr-1",
      )}
    />
  )
}
