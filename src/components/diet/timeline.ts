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

const DAYS_PER_WEEK = 7
const DAYS_PER_MONTH = 365.25 / 12
const DAYS_PER_YEAR = 365.25

/**
 * Compact "stint" label for a food group's diet history, e.g. `+3.1m` (an
 * active rule, on it ~3.1 months) or `-2d` (no active rule, last consumed 2
 * days ago).
 *
 * Positive durations anchor to the active rule's start; an active rule's
 * exceptions are ignored. Negative durations anchor to the most recent
 * exception, falling back to the most recent ended rule's end date.
 *
 * Returns `null` when there is no anchor at all (no active rule and nothing
 * ever recorded to measure from).
 */
export const ruleStintLabel = (
  rules: DietRule[],
  exceptions: DietException[],
  today: LocalDate = todayLocalDate(),
): string | null => {
  const activeRule = rules
    .filter(rule => ruleActiveOn(rule, today, today))
    .sort((a, b) => compareLocalDates(b.startDate, a.startDate))[0]

  if (activeRule) {
    return formatStint(daysBetween(activeRule.startDate, today), "+")
  }

  const lastException = exceptions
    .map(exception => exception.date)
    .filter(date => date <= today)
    .sort((a, b) => compareLocalDates(b, a))[0]

  const lastRuleEnd = rules
    .map(rule => rule.endDate)
    .filter((date): date is LocalDate => date !== undefined && date <= today)
    .sort((a, b) => compareLocalDates(b, a))[0]

  const anchor = lastException ?? lastRuleEnd
  if (!anchor) return null
  return formatStint(daysBetween(anchor, today), "-")
}

/**
 * Format a non-negative day count as a signed short duration: whole days under
 * a week, whole weeks under a month, otherwise months/years to one decimal.
 */
const formatStint = (days: number, sign: "+" | "-"): string => {
  if (days < DAYS_PER_WEEK) return `${sign}${Math.max(days, 1)}d`
  if (days < 30)
    return `${sign}${Math.max(Math.round(days / DAYS_PER_WEEK), 1)}w`
  if (days < 365) return `${sign}${(days / DAYS_PER_MONTH).toFixed(1)}m`
  return `${sign}${(days / DAYS_PER_YEAR).toFixed(1)}y`
}
