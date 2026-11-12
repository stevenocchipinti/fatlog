import type { BristolZone } from "@/lib/bowelMovements"

/**
 * How each Bristol zone is coloured wherever Bristol types appear: green for
 * ideal, orange for either extreme (hard or loose). Written out in full so
 * Tailwind sees every class.
 */
export const ZONE_STYLES: Record<
  BristolZone,
  { chip: string; text: string; checked: string }
> = {
  hard: {
    chip: "bg-orange-600",
    text: "text-orange-600 dark:text-orange-500",
    checked: "peer-checked:border-orange-600 peer-checked:bg-orange-600/10",
  },
  ideal: {
    chip: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-500",
    checked: "peer-checked:border-emerald-600 peer-checked:bg-emerald-600/10",
  },
  loose: {
    chip: "bg-orange-600",
    text: "text-orange-600 dark:text-orange-500",
    checked: "peer-checked:border-orange-600 peer-checked:bg-orange-600/10",
  },
}
