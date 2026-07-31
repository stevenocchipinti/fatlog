import type { DietException, DietRule, LocalDate } from "@/types"

import { compareLocalDates, daysBetween, todayLocalDate } from "@/lib/localDate"

/**
 * A single rendered row in the diet timeline. Rows are one of:
 *
 * - `event`: a date on which something happens — a rule starts, a rule ends, or
 *   an exception occurs — plus a guaranteed Today row.
 * - `gap`: a collapsed span of uneventful days between two event rows, labelled
 *   with the skipped duration so long quiet stretches stay compact.
 */
export type TimelineRow =
  | { kind: "event"; date: LocalDate; isToday: boolean }
  | { kind: "gap"; days: number }

/**
 * Build the ordered (newest-first) list of timeline rows from the current rules
 * and exceptions.
 *
 * Event dates are deduplicated from every rule start, rule end and exception
 * date, with Today always included. Consecutive event dates more than a day
 * apart are separated by a single compact gap row describing the skipped
 * duration; rule lines are expected to visually continue through these gaps.
 */
export const buildTimelineRows = (
  rules: DietRule[],
  exceptions: DietException[],
  today: LocalDate = todayLocalDate(),
): TimelineRow[] => {
  const eventDates = new Set<LocalDate>([today])

  for (const rule of rules) {
    eventDates.add(rule.startDate)
    // An open-ended rule "ends" at today for layout purposes.
    eventDates.add(rule.endDate ?? today)
  }
  for (const exception of exceptions) {
    eventDates.add(exception.date)
  }

  // Newest first.
  const sorted = [...eventDates].sort((a, b) => compareLocalDates(b, a))

  const rows: TimelineRow[] = []
  sorted.forEach((date, index) => {
    rows.push({ kind: "event", date, isToday: date === today })

    const next = sorted[index + 1]
    if (!next) return
    // `date` is newer than `next`; the skipped span excludes both event days.
    const skipped = daysBetween(next, date) - 1
    if (skipped > 0) rows.push({ kind: "gap", days: skipped })
  })

  return rows
}

/** Human-readable duration label for a gap row, e.g. "10 days" or "1 day". */
export const gapLabel = (days: number): string =>
  `${days} ${days === 1 ? "day" : "days"}`

/**
 * Whether a rule's lane is active on a given date (inclusive range, open-ended
 * rules run through today). Used to decide whether to draw the rule's line on a
 * row and whether a dot sits on top of a line.
 */
export const ruleActiveOn = (
  rule: DietRule,
  date: LocalDate,
  today: LocalDate = todayLocalDate(),
): boolean => {
  const end = rule.endDate ?? today
  return date >= rule.startDate && date <= end
}
