import { describe, expect, it } from "vitest"

import {
  addDays,
  addMonths,
  daysBetween,
  fromLocalDate,
  monthWeeks,
  rangeCoversDate,
  rangesOverlap,
  startOfMonth,
  toLocalDate,
} from "./localDate"

describe("local date utilities", () => {
  it("round-trips a date through local midnight", () => {
    const date = fromLocalDate("2026-08-21")

    expect(toLocalDate(date)).toBe("2026-08-21")
    expect(date.getHours()).toBe(0)
  })

  it("adds and counts calendar days", () => {
    expect(addDays("2026-08-21", 10)).toBe("2026-08-31")
    expect(daysBetween("2026-08-10", "2026-08-21")).toBe(11)
  })

  it("treats rule end dates as inclusive", () => {
    expect(rangeCoversDate("2026-08-10", "2026-08-15", "2026-08-15")).toBe(true)
    expect(rangeCoversDate("2026-08-10", "2026-08-15", "2026-08-16")).toBe(
      false,
    )
  })

  it("detects inclusive and open-ended overlaps", () => {
    expect(
      rangesOverlap("2026-08-01", "2026-08-10", "2026-08-10", "2026-08-20"),
    ).toBe(true)
    expect(
      rangesOverlap("2026-08-01", "2026-08-09", "2026-08-10", "2026-08-20"),
    ).toBe(false)
    expect(
      rangesOverlap("2026-08-01", undefined, "2027-01-01", "2027-01-02"),
    ).toBe(true)
  })
})

describe("month helpers", () => {
  it("finds the first day of a month", () => {
    expect(startOfMonth("2026-11-12")).toBe("2026-11-01")
  })

  it("moves between months, across year boundaries and from the 31st", () => {
    expect(addMonths("2026-11-12", -1)).toBe("2026-10-01")
    expect(addMonths("2026-12-31", 1)).toBe("2027-01-01")
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01")
  })

  it("lays a month out in Monday-first weeks, padded with nulls", () => {
    // 1 November 2026 is a Sunday.
    const weeks = monthWeeks("2026-11-12")
    expect(weeks).toHaveLength(6)
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"])
    expect(weeks[1][0]).toBe("2026-11-02")
    expect(weeks[5]).toEqual(["2026-11-30", null, null, null, null, null, null])
  })

  it("needs no padding for a month starting on a Monday", () => {
    // 1 June 2026 is a Monday.
    expect(monthWeeks("2026-06-01")[0][0]).toBe("2026-06-01")
  })
})
