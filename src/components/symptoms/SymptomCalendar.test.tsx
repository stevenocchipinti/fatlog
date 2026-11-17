import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SymptomEpisode } from "@/types"

import { symptomDays } from "@/lib/symptoms"

import SymptomCalendar from "./SymptomCalendar"

afterEach(cleanup)

const at = (day: number, hour = 12) => new Date(2026, 10, day, hour).getTime()

const episode = (
  symptom: string,
  start: number,
  end?: number,
): SymptomEpisode => ({
  id: `${symptom}-${start}`,
  symptom,
  start,
  ...(end !== undefined ? { end } : {}),
})

const renderCalendar = (episodes: SymptomEpisode[]) =>
  render(
    <SymptomCalendar
      month="2026-11-12"
      onMonthChange={vi.fn()}
      selected="2026-11-12"
      onSelect={vi.fn()}
      today="2026-11-12"
      days={symptomDays(episodes, "2026-11-12")}
    />,
  )

const day = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) })

/** The bar pieces drawn over a day, bottom lane first. */
const bars = (name: string) =>
  [...day(name).parentElement!.querySelectorAll("[data-bar]")].map(bar =>
    bar.getAttribute("data-bar"),
  )

describe("SymptomCalendar", () => {
  it("names each day's symptoms", () => {
    renderCalendar([episode("Headache", at(9), at(9)), episode("Cold", at(8))])
    expect(day("Monday 9 November").getAttribute("aria-label")).toBe(
      "Monday 9 November: Headache, Cold (ongoing)",
    )
    expect(day("Sunday 1 November").getAttribute("aria-label")).toBe(
      "Sunday 1 November: nothing recorded",
    )
  })

  it("draws an ended episode as a bar from its start to its end", () => {
    renderCalendar([episode("Cold", at(3), at(5))])
    expect(bars("Tuesday 3 November")).toEqual(["start"])
    expect(bars("Wednesday 4 November")).toEqual(["middle"])
    expect(bars("Thursday 5 November")).toEqual(["end"])
    expect(bars("Friday 6 November")).toEqual([])
  })

  it("leaves an ongoing episode's bar open at today", () => {
    renderCalendar([episode("Cold", at(11))])
    expect(bars("Wednesday 11 November")).toEqual(["start"])
    expect(bars("Thursday 12 November")).toEqual(["ongoing"])
  })

  it("shows one-offs as dots, summarising more than three as +n", () => {
    renderCalendar([
      episode("Headache", at(9, 8), at(9, 8)),
      ...[1, 2, 3, 4].map(hour => episode("Cramp", at(10, hour), at(10, hour))),
    ])
    expect(bars("Monday 9 November")).toEqual([])
    expect(day("Monday 9 November").textContent).toBe("9")
    expect(day("Tuesday 10 November").textContent).toBe("10+2")
  })

  it("shows an episode's emoji in place of the dot, and on the day a bar starts", () => {
    renderCalendar([
      { ...episode("Headache", at(9), at(9)), emoji: "🤕" },
      { ...episode("Cold", at(3), at(5)), emoji: "🤧" },
      episode("Cramp", at(9, 8), at(9, 8)),
    ])
    expect(day("Monday 9 November").textContent).toBe("9🤕")
    expect(
      day("Monday 9 November").parentElement!.querySelectorAll(".bg-rose-500"),
    ).toHaveLength(1)
    expect(day("Tuesday 3 November").textContent).toBe("3🤧")
    expect(day("Wednesday 4 November").textContent).toBe("4")
  })
})
