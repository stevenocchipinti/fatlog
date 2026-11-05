import { describe, expect, it } from "vitest"

import { fromDateTimeLocalValue, toDateTimeLocalValue } from "./dateTimeLocal"

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
