import type {
  BowelMovement,
  BristolType,
  LocalDate,
  NewBowelMovement,
} from "@/types"
import { toLocalDate } from "@/lib/localDate"

export type BristolTypeInfo = {
  type: BristolType
  description: string
}

/** The Bristol stool chart, from 1 (separate hard lumps) to 7 (entirely liquid). */
export const BRISTOL_TYPES: readonly BristolTypeInfo[] = [
  { type: 1, description: "Separate hard lumps" },
  { type: 2, description: "Lumpy and sausage-like" },
  { type: 3, description: "Sausage with cracks on the surface" },
  { type: 4, description: "Smooth, soft sausage or snake" },
  { type: 5, description: "Soft blobs with clear-cut edges" },
  {
    type: 6,

    description: "Fluffy, mushy pieces with ragged edges",
  },
  { type: 7, description: "Entirely liquid" },
]

/** A bowel movement as stored at `/bowelMovements/<profileId>/<id>`. */
export type StoredBowelMovement = {
  timestamp: number
  bristolType: BristolType
  note?: string
}

export const parseBowelMovement = (
  id: string,
  record: StoredBowelMovement,
): BowelMovement => ({
  id,
  timestamp: record.timestamp,
  bristolType: record.bristolType,
  ...(record.note ? { note: record.note } : {}),
})

/** The record to store: the database rejects `undefined`, so a blank note is omitted. */
export const toBowelMovementRecord = ({
  timestamp,
  bristolType,
  note,
}: NewBowelMovement): StoredBowelMovement => {
  const trimmedNote = note?.trim()
  return {
    timestamp,
    bristolType,
    ...(trimmedNote ? { note: trimmedNote } : {}),
  }
}

export type BowelMovementDay = {
  date: LocalDate
  movements: BowelMovement[]
}

/** Movements grouped by the device's local day, newest day first and newest movement first within a day. */
export const groupByLocalDay = (
  movements: readonly BowelMovement[],
): BowelMovementDay[] => {
  const days = new Map<LocalDate, BowelMovement[]>()
  for (const movement of [...movements].sort(
    (a, b) => b.timestamp - a.timestamp,
  )) {
    const date = toLocalDate(new Date(movement.timestamp))
    days.set(date, [...(days.get(date) ?? []), movement])
  }
  return [...days].map(([date, dayMovements]) => ({
    date,
    movements: dayMovements,
  }))
}
