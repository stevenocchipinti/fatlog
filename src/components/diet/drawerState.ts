import type { DietException, DietRule, LocalDate } from "@/types"

export type DietTab = "exception" | "rule"

/**
 * How the drawer was opened, so it can preselect the right tab, food group,
 * date, or an existing record to edit.
 */
export type DietDrawerIntent =
  | { kind: "new"; tab?: DietTab; foodGroupId?: string; date?: LocalDate }
  | { kind: "editException"; exception: DietException }
  | { kind: "editRule"; rule: DietRule }
  | { kind: "manage" }

export type DietDrawerState = {
  tab: DietTab
  managing: boolean

  exFoodGroupId?: string
  exDate: LocalDate
  exNote: string
  editingExceptionId?: string

  ruleFoodGroupId?: string
  ruleStart: LocalDate
  ruleEnd: LocalDate
  ruleNote: string
  editingRuleId?: string
}

/** The drawer's form state for an opening with the given intent. */
export const initialDietDrawerState = (
  intent: DietDrawerIntent | null,
  today: LocalDate,
): DietDrawerState => {
  const blank: DietDrawerState = {
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

  switch (intent?.kind) {
    case undefined:
      return blank
    case "manage":
      return { ...blank, managing: true }
    case "new":
      return {
        ...blank,
        tab: intent.tab ?? "exception",
        exFoodGroupId: intent.foodGroupId,
        exDate: intent.date ?? today,
        ruleFoodGroupId: intent.foodGroupId,
        ruleStart: intent.date ?? today,
      }
    case "editException":
      return {
        ...blank,
        exFoodGroupId: intent.exception.foodGroupId,
        exDate: intent.exception.date,
        exNote: intent.exception.note ?? "",
        editingExceptionId: intent.exception.id,
      }
    case "editRule":
      return {
        ...blank,
        tab: "rule",
        ruleFoodGroupId: intent.rule.foodGroupId,
        ruleStart: intent.rule.startDate,
        ruleEnd: intent.rule.endDate ?? "",
        ruleNote: intent.rule.note ?? "",
        editingRuleId: intent.rule.id,
      }
  }
}
