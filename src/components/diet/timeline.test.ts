import { describe, expect, it } from "vitest"

import {
  buildTimelineRows,
  gapLabel,
  layoutRuleLine,
  layoutTimeline,
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

describe("layoutTimeline", () => {
  const gapsFor = (dates: Array<string>) =>
    layoutTimeline(
      buildTimelineRows(
        [],
        dates.map((date, i) => ({ id: `e${i}`, foodGroupId: "meat", date })),
        "2026-11-15",
      ),
    ).bands.filter(band => band.kind === "gap")

  it("puts a short gap between adjacent dates", () => {
    expect(gapsFor(["2026-11-14"])).toEqual([
      { kind: "gap", days: 0, top: 52, height: 12, dash: null },
    ])
  })

  it("sizes and dots gaps by how many days they skip", () => {
    const tier = (skipped: number) => {
      const [gap] = gapsFor([addDays("2026-11-15", -(skipped + 1))])
      return [gap.height, gap.dash]
    }

    expect(tier(1)).toEqual([12, null])
    expect(tier(2)).toEqual([32, null])
    expect(tier(14)).toEqual([32, null])
    expect(tier(15)).toEqual([56, { on: 4, off: 4 }])
    expect(tier(60)).toEqual([56, { on: 4, off: 4 }])
    expect(tier(61)).toEqual([56, { on: 4, off: 10 }])
  })

  it("stacks bands without overlap and reports the total height", () => {
    const { bands, height } = layoutTimeline(
      buildTimelineRows(
        [],
        [{ id: "e", foodGroupId: "meat", date: "2026-11-08" }],
        "2026-11-15",
      ),
    )

    expect(bands.map(band => [band.top, band.height])).toEqual([
      [0, 52],
      [52, 32],
      [84, 52],
    ])
    expect(height).toBe(136)
  })
})

describe("layoutRuleLine", () => {
  const today = "2026-11-15"
  const layout = (rule: DietRule, exceptions: Array<DietException> = []) =>
    layoutRuleLine(
      rule,
      layoutTimeline(buildTimelineRows([rule], exceptions, today)).bands,
      today,
    )

  it("runs an active rule from the Today row centre to its start row centre", () => {
    // Today (0-52), 6 skipped days (52-84), start row (84-136).
    const line = layout({
      id: "r",
      foodGroupId: "meat",
      startDate: "2026-11-08",
    })

    expect(line).toEqual({
      startY: 110,
      endY: 26,
      segments: [{ top: 26, height: 84, dash: null }],
    })
  })

  it("dots only the part inside a dotted gap, exactly on its boundaries", () => {
    // Today (0-52), 9 days (52-84), exception (84-136), 30 days (136-192),
    // start row (192-244).
    const line = layout(
      { id: "r", foodGroupId: "meat", startDate: "2026-10-05" },
      [{ id: "e", foodGroupId: "meat", date: "2026-11-05" }],
    )

    expect(line?.segments).toEqual([
      { top: 26, height: 110, dash: null },
      { top: 136, height: 56, dash: { on: 4, off: 4 } },
      { top: 192, height: 26, dash: null },
    ])
  })

  it("stops an ended rule at its end row", () => {
    // Today (0-52), 4 days (52-84), end row (84-136), 8 days (136-168),
    // start row (168-220).
    const line = layout({
      id: "r",
      foodGroupId: "meat",
      startDate: "2026-11-01",
      endDate: "2026-11-10",
    })

    expect(line).toEqual({
      startY: 194,
      endY: 110,
      segments: [{ top: 110, height: 84, dash: null }],
    })
  })
})
