import { format } from "date-fns"

import type { LocalDate } from "@/types"

import { addDays, fromLocalDate, todayLocalDate } from "@/lib/localDate"

/** How a day is named above its entries: "Today", "Yesterday", or the date. */
export const dayHeading = (date: LocalDate): string => {
  const today = todayLocalDate()
  if (date === today) return "Today"
  if (date === addDays(today, -1)) return "Yesterday"
  return format(fromLocalDate(date), "EEEE d MMMM")
}
