import { describe, expect, it } from "vitest"

import { initialDietDrawerState } from "./drawerState"

const today = "2026-11-05"

const blank = {
  tab: "exception",
  managing: false,
  exFoodGroupId: undefined,
  exDate: today,
  exNote: "",
  editingExceptionId: undefined,
  ruleFoodGroupId: undefined,
  ruleStart: today,
  ruleEnd: "",
  ruleNote: "",
  editingRuleId: undefined,
}

describe("initialDietDrawerState", () => {
  it("starts a blank exception from today without an intent", () => {
    expect(initialDietDrawerState(null, today)).toEqual(blank)
  })

  it("opens food group management for the manage intent", () => {
    expect(initialDietDrawerState({ kind: "manage" }, today)).toEqual({
      ...blank,
      managing: true,
    })
  })

  it("preselects the tab, food group and date for both forms on a new intent", () => {
    expect(
      initialDietDrawerState(
        { kind: "new", tab: "rule", foodGroupId: "dairy", date: "2026-10-01" },
        today,
      ),
    ).toEqual({
      ...blank,
      tab: "rule",
      exFoodGroupId: "dairy",
      exDate: "2026-10-01",
      ruleFoodGroupId: "dairy",
      ruleStart: "2026-10-01",
    })
  })

  it("defaults a new intent to the exception tab from today", () => {
    expect(initialDietDrawerState({ kind: "new" }, today)).toEqual(blank)
  })

  it("fills the exception form from the exception being edited", () => {
    expect(
      initialDietDrawerState(
        {
          kind: "editException",
          exception: {
            id: "ex-1",
            foodGroupId: "meat",
            date: "2026-09-12",
            note: "kangaroo",
          },
        },
        today,
      ),
    ).toEqual({
      ...blank,
      exFoodGroupId: "meat",
      exDate: "2026-09-12",
      exNote: "kangaroo",
      editingExceptionId: "ex-1",
    })
  })

  it("fills the rule form from the rule being edited, on the rule tab", () => {
    expect(
      initialDietDrawerState(
        {
          kind: "editRule",
          rule: { id: "rule-1", foodGroupId: "dairy", startDate: "2026-08-01" },
        },
        today,
      ),
    ).toEqual({
      ...blank,
      tab: "rule",
      ruleFoodGroupId: "dairy",
      ruleStart: "2026-08-01",
      editingRuleId: "rule-1",
    })
  })

  it("keeps an edited rule's end date and note", () => {
    const state = initialDietDrawerState(
      {
        kind: "editRule",
        rule: {
          id: "rule-1",
          foodGroupId: "dairy",
          startDate: "2026-08-01",
          endDate: "2026-08-10",
          note: "reintroducing",
        },
      },
      today,
    )
    expect(state.ruleEnd).toBe("2026-08-10")
    expect(state.ruleNote).toBe("reintroducing")
  })
})
