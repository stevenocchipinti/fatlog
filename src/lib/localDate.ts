import type { LocalDate } from "@/types"

// Diet events are recorded as local date-only values (`YYYY-MM-DD`) rather than
// timestamps. Doing the formatting/parsing against the browser's *local* time
// avoids the classic off-by-one bug where `new Date("2025-01-01").toISOString()`
// shifts the day backwards for users in negative-offset timezones.

/** Format a `Date` as a local date-only string (`YYYY-MM-DD`). */
export const toLocalDate = (date: Date): LocalDate => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Parse a local date-only string into a `Date` anchored to local midnight. */
export const fromLocalDate = (value: LocalDate): Date => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Today's local date-only string. */
export const todayLocalDate = (): LocalDate => toLocalDate(new Date())

/** Whole days between two local dates (b - a). Negative if `b` precedes `a`. */
export const daysBetween = (a: LocalDate, b: LocalDate): number => {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (fromLocalDate(b).getTime() - fromLocalDate(a).getTime()) / msPerDay,
  )
}

/** Add `days` to a local date, returning a new local date-only string. */
export const addDays = (value: LocalDate, days: number): LocalDate => {
  const date = fromLocalDate(value)
  date.setDate(date.getDate() + days)
  return toLocalDate(date)
}

/** Chronological comparator for local date-only strings. */
export const compareLocalDates = (a: LocalDate, b: LocalDate): number =>
  a < b ? -1 : a > b ? 1 : 0

/**
 * Whether a rule's inclusive range covers the given date. An absent `endDate`
 * means the rule is active through today.
 */
export const rangeCoversDate = (
  startDate: LocalDate,
  endDate: LocalDate | undefined,
  date: LocalDate,
): boolean => {
  if (date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}

/**
 * Whether two inclusive date ranges overlap. An absent `endDate` is treated as
 * open-ended (through the far future), matching "active through today" for the
 * purpose of preventing overlapping rules on the same food group.
 */
export const rangesOverlap = (
  aStart: LocalDate,
  aEnd: LocalDate | undefined,
  bStart: LocalDate,
  bEnd: LocalDate | undefined,
): boolean => {
  const aEndBounded = aEnd ?? "9999-12-31"
  const bEndBounded = bEnd ?? "9999-12-31"
  return aStart <= bEndBounded && bStart <= aEndBounded
}
