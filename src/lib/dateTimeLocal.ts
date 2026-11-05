import { toLocalDate } from "@/lib/localDate"

const pad = (value: number) => String(value).padStart(2, "0")

/** A timestamp as the value of a `<input type="datetime-local">` (device-local `YYYY-MM-DDTHH:mm`). */
export const toDateTimeLocalValue = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${toLocalDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The timestamp for a `datetime-local` input's value, or `undefined` if it is cleared or invalid. */
export const fromDateTimeLocalValue = (value: string): number | undefined => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? undefined : timestamp
}
