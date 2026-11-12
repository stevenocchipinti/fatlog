import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { BowelMovement, BristolType, LocalDate } from "@/types"

import StoolCalendar from "./StoolCalendar"

afterEach(cleanup)

const movements = (...types: BristolType[]): BowelMovement[] =>
  types.map((bristolType, index) => ({
    id: String(index),
    timestamp: index,
    bristolType,
  }))

const renderCalendar = (
  overrides: Partial<Parameters<typeof StoolCalendar>[0]> = {},
) => {
  const props = {
    month: "2026-11-12",
    onMonthChange: vi.fn(),
    selected: "2026-11-12",
    onSelect: vi.fn(),
    today: "2026-11-12",
    movementsByDate: new Map<LocalDate, BowelMovement[]>([
      ["2026-11-09", movements(4, 6, 7, 6)],
      ["2026-11-10", movements(5)],
      ["2026-11-11", movements(4, 4, 3, 5, 6, 2)],
    ]),
    ...overrides,
  }
  render(<StoolCalendar {...props} />)
  return props
}

const day = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) })

describe("StoolCalendar", () => {
  it("shows each movement's Bristol type on its day", () => {
    renderCalendar()
    expect(day("Monday 9 November").textContent).toBe("94676")
    expect(day("Monday 9 November").getAttribute("aria-label")).toBe(
      "Monday 9 November: 4 bowel movements, type 4, 6, 7, 6",
    )
    expect(day("Tuesday 10 November").textContent).toBe("105")
    expect(day("Sunday 1 November").getAttribute("aria-label")).toBe(
      "Sunday 1 November: nothing recorded",
    )
  })

  it("summarises more than four movements as +n", () => {
    renderCalendar()
    expect(day("Wednesday 11 November").textContent).toBe("11443+3")
  })

  it("selects a past day but not a future one", () => {
    const { onSelect } = renderCalendar()
    fireEvent.click(day("Monday 9 November"))
    expect(onSelect).toHaveBeenCalledWith("2026-11-09")
    expect(day("Friday 13 November")).toHaveProperty("disabled", true)
  })

  it("moves back a month, but not past the current one", () => {
    const { onMonthChange } = renderCalendar()
    expect(screen.getByRole("button", { name: "Next month" })).toHaveProperty(
      "disabled",
      true,
    )
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(onMonthChange).toHaveBeenCalledWith("2026-10-01")
  })
})
