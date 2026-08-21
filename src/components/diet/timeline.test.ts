import { describe, expect, it } from "vitest"

import { buildTimelineRows, gapLabel, ruleActiveOn } from "./timeline"

import type { DietException, DietRule } from "@/types"

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
