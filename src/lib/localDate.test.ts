import { describe, expect, it } from "vitest"

import {
  addDays,
  daysBetween,
  fromLocalDate,
  rangeCoversDate,
  rangesOverlap,
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
