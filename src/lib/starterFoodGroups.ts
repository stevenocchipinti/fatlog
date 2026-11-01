import type { StarterFoodGroup } from "@/types"

/**
 * Suggested starter food groups offered as quick-adds in the food group picker.
 *
 * These are suggestions only: they are not auto-created records and never
 * appear as timeline columns until the user explicitly saves one. Only saved
 * food groups become columns.
 */
export const STARTER_FOOD_GROUPS: StarterFoodGroup[] = [
  { emoji: "🥩", name: "Meat" },
  { emoji: "🥚", name: "Eggs" },
  { emoji: "🧀", name: "Dairy" },
  { emoji: "🍎", name: "Fruit" },
  { emoji: "🥦", name: "Vegetables" },
  { emoji: "🍞", name: "Grains" },
  { emoji: "🍭", name: "Sweets" },
]
