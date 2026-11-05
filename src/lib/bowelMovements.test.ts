import { describe, expect, it } from "vitest"

import {
  BRISTOL_TYPES,
  fromDateTimeLocalValue,
  groupByLocalDay,
  parseBowelMovement,
  toBowelMovementRecord,
  toDateTimeLocalValue,
} from "./bowelMovements"
import type { BowelMovement } from "@/types"

describe("BRISTOL_TYPES", () => {
  it("lists the seven Bristol types in order, from hard lumps to liquid", () => {
    expect(BRISTOL_TYPES.map(({ type }) => type)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(BRISTOL_TYPES[0].description).toBe("Separate hard lumps")
    expect(BRISTOL_TYPES[6].description).toBe("Entirely liquid")
  })

  it("gives every type an emoji and a description", () => {
    for (const { emoji, description } of BRISTOL_TYPES) {
      expect(emoji).not.toBe("")
      expect(description).not.toBe("")
    }
  })
})

describe("parseBowelMovement", () => {
  it("reads a stored record, keeping the timestamp as epoch milliseconds", () => {
    expect(
      parseBowelMovement("-abc", {
        timestamp: 1_730_000_000_000,
        bristolType: 4,
        note: "After coffee",
      }),
    ).toEqual({
      id: "-abc",
      timestamp: 1_730_000_000_000,
      bristolType: 4,
      note: "After coffee",
    })
  })

  it("leaves the note out when there isn't one", () => {
    expect(
      parseBowelMovement("-abc", { timestamp: 1, bristolType: 7 }),
    ).not.toHaveProperty("note")
  })
})

describe("toBowelMovementRecord", () => {
  it("stores the timestamp, Bristol type and trimmed note", () => {
    expect(
      toBowelMovementRecord({
        timestamp: 1_730_000_000_000,
        bristolType: 3,
        note: "  urgent  ",
      }),
    ).toEqual({ timestamp: 1_730_000_000_000, bristolType: 3, note: "urgent" })
  })

  it("omits a missing or blank note, since the database rejects undefined", () => {
    expect(toBowelMovementRecord({ timestamp: 1, bristolType: 3 })).toEqual({
      timestamp: 1,
      bristolType: 3,
    })
    expect(
      toBowelMovementRecord({ timestamp: 1, bristolType: 3, note: "   " }),
    ).toEqual({ timestamp: 1, bristolType: 3 })
  })
})

describe("groupByLocalDay", () => {
  // Built from local date parts so the tests hold in any timezone.
  const at = (day: number, hour: number, minute = 0) =>
    new Date(2026, 10, day, hour, minute).getTime()
  const movement = (id: string, timestamp: number): BowelMovement => ({
    id,
    timestamp,
    bristolType: 4,
  })

  it("groups by the device's local day, newest day first", () => {
    const groups = groupByLocalDay([
      movement("a", at(3, 9)),
      movement("b", at(5, 8)),
      movement("c", at(4, 20)),
    ])
    expect(groups.map(group => group.date)).toEqual([
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
    ])
  })

  it("lists each day's movements newest first", () => {
    const [group] = groupByLocalDay([
      movement("morning", at(5, 7, 15)),
      movement("evening", at(5, 19, 40)),
      movement("noon", at(5, 12)),
    ])
    expect(group.movements.map(m => m.id)).toEqual([
      "evening",
      "noon",
      "morning",
    ])
  })

  it("keeps late-night and just-after-midnight movements on different days", () => {
    const groups = groupByLocalDay([
      movement("late", at(4, 23, 59)),
      movement("early", at(5, 0, 1)),
    ])
    expect(groups.map(group => group.date)).toEqual([
      "2026-11-05",
      "2026-11-04",
    ])
  })

  it("is empty when there are no movements", () => {
    expect(groupByLocalDay([])).toEqual([])
  })
})

describe("datetime-local input values", () => {
  const local = new Date(2026, 10, 5, 7, 5).getTime()

  it("formats a timestamp as the device's local time for the input", () => {
    expect(toDateTimeLocalValue(local)).toBe("2026-11-05T07:05")
  })

  it("parses the input's value back to the same timestamp", () => {
    expect(fromDateTimeLocalValue("2026-11-05T07:05")).toBe(local)
  })

  it("has no timestamp for a cleared or invalid input", () => {
    expect(fromDateTimeLocalValue("")).toBeUndefined()
    expect(fromDateTimeLocalValue("not a date")).toBeUndefined()
  })
})
