import { describe, expect, it } from "vitest"

import {
  buildTimelineRows,
  gapLabel,
  ruleActiveOn,
  ruleStintLabel,
} from "./timeline"

import type { DietException, DietRule } from "@/types"
import { addDays } from "@/lib/localDate"

describe("buildTimelineRows", () => {
  it("includes Today and orders event dates newest first", () => {
    const rules: DietRule[] = [
      {
        id: "rule-1",
        foodGroupId: "meat",
        startDate: "2026-08-01",
        endDate: "2026-08-10",
      },
    ]
    const exceptions: DietException[] = [
      {
        id: "exception-1",
        foodGroupId: "meat",
        date: "2026-08-15",
      },
    ]

    const eventDates = buildTimelineRows(rules, exceptions, "2026-08-21")
      .filter(row => row.kind === "event")
      .map(row => row.date)

    expect(eventDates).toEqual([
      "2026-08-21",
      "2026-08-15",
      "2026-08-10",
      "2026-08-01",
    ])
  })

  it("collapses uneventful spans and excludes both event dates", () => {
    expect(buildTimelineRows([], [], "2026-08-21")).toEqual([
      { kind: "event", date: "2026-08-21", isToday: true },
    ])

    const rows = buildTimelineRows(
      [],
      [
        {
          id: "exception-1",
          foodGroupId: "fruit",
          date: "2026-08-10",
        },
      ],
      "2026-08-21",
    )

    expect(rows).toEqual([
      { kind: "event", date: "2026-08-21", isToday: true },
      { kind: "gap", days: 10 },
      { kind: "event", date: "2026-08-10", isToday: false },
    ])
    expect(gapLabel(10)).toBe("10 days")
    expect(gapLabel(1)).toBe("1 day")
  })
})

describe("ruleActiveOn", () => {
  const rule: DietRule = {
    id: "rule-1",
    foodGroupId: "dairy",
    startDate: "2026-08-10",
    endDate: "2026-08-15",
  }

  it("treats both rule boundaries as active", () => {
    expect(ruleActiveOn(rule, "2026-08-09", "2026-08-21")).toBe(false)
    expect(ruleActiveOn(rule, "2026-08-10", "2026-08-21")).toBe(true)
    expect(ruleActiveOn(rule, "2026-08-15", "2026-08-21")).toBe(true)
    expect(ruleActiveOn(rule, "2026-08-16", "2026-08-21")).toBe(false)
  })

  it("ends an open rule at Today for display", () => {
    const openRule = { ...rule, endDate: undefined }

    expect(ruleActiveOn(openRule, "2026-08-21", "2026-08-21")).toBe(true)
    expect(ruleActiveOn(openRule, "2026-08-22", "2026-08-21")).toBe(false)
  })
})

describe("ruleStintLabel", () => {
  const today = "2026-08-21"

  const activeRule = (daysAgo: number): DietRule => ({
    id: "rule-1",
    foodGroupId: "meat",
    startDate: addDays(today, -daysAgo),
  })
  const endedRule = (
    endDaysAgo: number,
    startDaysAgo = endDaysAgo + 30,
  ): DietRule => ({
    id: "rule-2",
    foodGroupId: "cheese",
    startDate: addDays(today, -startDaysAgo),
    endDate: addDays(today, -endDaysAgo),
  })
  const exception = (daysAgo: number): DietException => ({
    id: "exception-1",
    foodGroupId: "cheese",
    date: addDays(today, -daysAgo),
  })

  it("shows a positive duration for an active rule", () => {
    expect(ruleStintLabel([activeRule(5)], [], today)).toBe("+5d")
    expect(ruleStintLabel([activeRule(21)], [], today)).toBe("+3w")
    expect(ruleStintLabel([activeRule(95)], [], today)).toBe("+3.1m")
    expect(ruleStintLabel([activeRule(630)], [], today)).toBe("+1.7y")
  })

  it("ignores exceptions while a rule is active", () => {
    expect(ruleStintLabel([activeRule(5)], [exception(1)], today)).toBe("+5d")
  })

  it("treats a rule ending today as still active", () => {
    expect(ruleStintLabel([endedRule(0, 10)], [], today)).toBe("+1w")
  })

  it("shows a negative duration since the most recent exception", () => {
    expect(ruleStintLabel([], [exception(2)], today)).toBe("-2d")
  })

  it("uses the newest exception when there are several", () => {
    expect(ruleStintLabel([], [exception(30), exception(2)], today)).toBe("-2d")
  })

  it("falls back to the most recent ended rule's end date", () => {
    expect(ruleStintLabel([endedRule(21)], [], today)).toBe("-3w")
  })

  it("prefers a recent exception over an older rule end", () => {
    expect(ruleStintLabel([endedRule(30)], [exception(2)], today)).toBe("-2d")
  })

  it("returns null with no active rule and nothing recorded", () => {
    expect(ruleStintLabel([], [], today)).toBeNull()
  })

  it("rounds unit boundaries", () => {
    expect(ruleStintLabel([activeRule(6)], [], today)).toBe("+6d")
    expect(ruleStintLabel([activeRule(7)], [], today)).toBe("+1w")
    expect(ruleStintLabel([activeRule(29)], [], today)).toBe("+4w")
    expect(ruleStintLabel([activeRule(30)], [], today)).toBe("+1.0m")
    expect(ruleStintLabel([activeRule(364)], [], today)).toBe("+12.0m")
    expect(ruleStintLabel([activeRule(365)], [], today)).toBe("+1.0y")
  })

  it("rounds a same-day anchor up to one day", () => {
    expect(ruleStintLabel([activeRule(0)], [], today)).toBe("+1d")
    expect(ruleStintLabel([], [exception(0)], today)).toBe("-1d")
  })
})
