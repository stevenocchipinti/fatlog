import type { FoodGroup, StarterFoodGroup } from "@/types"

/**
 * Suggested starter food groups, offered as quick-adds in food group
 * management and in the Diet empty state.
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

/**
 * Starters not yet used by any of the given food groups, matched by name
 * case-insensitively. Archived groups count as used, so a starter is never
 * offered as a duplicate of a group the user can unarchive instead.
 */
export const remainingStarters = (
  foodGroups: FoodGroup[],
): StarterFoodGroup[] => {
  const usedNames = new Set(foodGroups.map(g => g.name.trim().toLowerCase()))
  return STARTER_FOOD_GROUPS.filter(s => !usedNames.has(s.name.toLowerCase()))
}
