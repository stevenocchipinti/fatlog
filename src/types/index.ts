export type NewBodyMetricDataPoint = {
  createdAt: Date
} & BodyMetrics

export type BodyMetricDataPoint = {
  id: string
  createdAt: Date
} & BodyMetrics

export type BodyMetrics = {
  weight?: number
  fat?: number
  waist?: number
}

export type TimeScaleOption = "1M" | "3M" | "6M" | "1Y" | "ALL"

// Diet
//
// Diet data models a user's regular diet as `diet rules` (date ranges where a
// food group is intentionally part of the diet) and `diet exceptions` (dated
// notable food-group observations). Food groups are the shared vocabulary both
// concepts hang off. See CONTEXT.md for the agreed domain language.

/**
 * A local date-only value, formatted as `YYYY-MM-DD`.
 *
 * Diet dates are deliberately date-only (no time of day, no timezone) to avoid
 * off-by-one problems when a user records an event near midnight. Never store
 * these as ISO timestamps.
 */
export type LocalDate = string

/** A broad category of food used to describe diet patterns over time. */
export type FoodGroup = {
  id: string
  emoji: string
  name: string
  /** Manual display order; lower numbers appear first. */
  order: number
  /**
   * Archived food groups are hidden from the main timeline but retained so
   * historical rules/exceptions keep their label. Recoverable from Manage food
   * groups.
   */
  archived: boolean
}

export type NewFoodGroup = Omit<FoodGroup, "id">

/**
 * A quick-add suggestion for a starter food group. Starters are suggestions
 * only — they are not auto-created records and never appear as timeline columns
 * until the user saves them.
 */
export type StarterFoodGroup = Pick<FoodGroup, "emoji" | "name">

/**
 * A date range during which a food group is intentionally part of the regular
 * diet. `endDate` is inclusive; an absent `endDate` means the rule is active
 * through today.
 */
export type DietRule = {
  id: string
  foodGroupId: string
  startDate: LocalDate
  endDate?: LocalDate
  note?: string
}

export type NewDietRule = Omit<DietRule, "id">

/**
 * A dated notable observation that the user ate from a food group in a way
 * worth recording, whether or not that food group has an active diet rule.
 * There is at most one exception per food group per local date.
 */
export type DietException = {
  id: string
  foodGroupId: string
  date: LocalDate
  note?: string
}

export type NewDietException = Omit<DietException, "id">

/** The two authenticated app modes exposed in the bottom navigation. */
export type AppMode = "metrics" | "diet"
