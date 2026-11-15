import { describe, expect, it } from "vitest"

import {
  endEpisodeNow,
  isEndBeforeStart,
  isOneOff,
  parseSymptomEpisode,
  suggestSymptomNames,
  symptomDays,
  toSymptomEpisodeRecord,
} from "./symptoms"

import type { SymptomEpisode } from "@/types"

describe("parseSymptomEpisode", () => {
  it("reads a stored record, keeping start and end as epoch milliseconds", () => {
    expect(
      parseSymptomEpisode("-abc", {
        symptom: "Cold",
        start: 1000,
        end: 2000,
        note: "mild",
      }),
    ).toEqual({
      id: "-abc",
      symptom: "Cold",
      start: 1000,
      end: 2000,
      note: "mild",
    })
  })

  it("leaves out the end and note an ongoing, unannotated episode doesn't have", () => {
    expect(
      parseSymptomEpisode("-abc", { symptom: "Cold", start: 1000 }),
    ).toEqual({ id: "-abc", symptom: "Cold", start: 1000 })
  })
})

describe("toSymptomEpisodeRecord", () => {
  it("trims the symptom name and note", () => {
    expect(
      toSymptomEpisodeRecord({
        symptom: "  Cold ",
        start: 1000,
        end: 2000,
        note: " mild ",
      }),
    ).toEqual({ symptom: "Cold", start: 1000, end: 2000, note: "mild" })
  })

  it("omits a missing end and a blank note, since the database rejects undefined", () => {
    const record = toSymptomEpisodeRecord({
      symptom: "Cold",
      start: 1000,
      end: undefined,
      note: "  ",
    })
    expect(record).toEqual({ symptom: "Cold", start: 1000 })
    expect(record).not.toHaveProperty("end")
    expect(record).not.toHaveProperty("note")
  })

  it("keeps an end equal to the start: a one-off episode is not ongoing", () => {
    expect(
      toSymptomEpisodeRecord({ symptom: "Upset stomach", start: 5, end: 5 }),
    ).toEqual({ symptom: "Upset stomach", start: 5, end: 5 })
  })
})

const episode = (
  id: string,
  start: number,
  end?: number,
  symptom = id,
): SymptomEpisode => ({
  id,
  symptom,
  start,
  ...(end !== undefined ? { end } : {}),
})

/** A local time on a day of November 2026. */
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour).getTime()

describe("isOneOff", () => {
  it("is true only when the episode ended the moment it started", () => {
    expect(isOneOff(episode("blip", 5, 5))).toBe(true)
    expect(isOneOff(episode("spell", 5, 6))).toBe(false)
    expect(isOneOff(episode("ongoing", 5))).toBe(false)
  })
})

describe("symptomDays", () => {
  const today = "2026-11-12"

  it("puts a one-off on its own day, without a bar", () => {
    const blip = episode("blip", at(9), at(9))
    const days = symptomDays([blip], today)
    expect([...days.keys()]).toEqual(["2026-11-09"])
    expect(days.get("2026-11-09")).toEqual({
      episodes: [blip],
      oneOffs: [blip],
      bars: [],
    })
  })

  it("runs an ended episode from its start day to its end day", () => {
    const cold = episode("cold", at(3, 22), at(5, 7))
    const days = symptomDays([cold], today)
    expect([...days.keys()]).toEqual(["2026-11-03", "2026-11-04", "2026-11-05"])
    expect(days.get("2026-11-03")?.bars).toEqual([
      { episode: cold, startsHere: true, endsHere: false },
    ])
    expect(days.get("2026-11-04")?.bars).toEqual([
      { episode: cold, startsHere: false, endsHere: false },
    ])
    expect(days.get("2026-11-05")?.bars).toEqual([
      { episode: cold, startsHere: false, endsHere: true },
    ])
    expect(days.get("2026-11-04")?.oneOffs).toEqual([])
  })

  it("keeps an episode that started and ended on one day as a bar, not a one-off", () => {
    const nap = episode("headache", at(9, 8), at(9, 15))
    expect(symptomDays([nap], today).get("2026-11-09")).toEqual({
      episodes: [nap],
      oneOffs: [],
      bars: [{ episode: nap, startsHere: true, endsHere: true }],
    })
  })

  it("runs an ongoing episode through today", () => {
    const cold = episode("cold", at(10))
    const days = symptomDays([cold], today)
    expect([...days.keys()]).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"])
    expect(days.get("2026-11-12")?.bars).toEqual([
      { episode: cold, startsHere: false, endsHere: true },
    ])
  })

  it("gives overlapping episodes their own lanes, each kept for the whole run", () => {
    const cold = episode("cold", at(2), at(6))
    const headache = episode("headache", at(4), at(5))
    const days = symptomDays([cold, headache], today)
    expect(days.get("2026-11-03")?.bars.map(bar => bar?.episode)).toEqual([
      cold,
    ])
    expect(days.get("2026-11-04")?.bars.map(bar => bar?.episode)).toEqual([
      cold,
      headache,
    ])
    expect(days.get("2026-11-06")?.bars.map(bar => bar?.episode)).toEqual([
      cold,
    ])
  })

  it("leaves a lane empty on days its episode doesn't cover", () => {
    const cold = episode("cold", at(2), at(6))
    const headache = episode("headache", at(4), at(8))
    const days = symptomDays([cold, headache], today)
    expect(days.get("2026-11-07")?.bars[0]).toBeUndefined()
    expect(days.get("2026-11-07")?.bars[1]?.episode).toBe(headache)
  })

  it("reuses a lane once the episode in it is over", () => {
    const first = episode("first", at(2), at(3))
    const second = episode("second", at(4), at(5))
    const days = symptomDays([first, second], today)
    expect(days.get("2026-11-03")?.bars).toHaveLength(1)
    expect(days.get("2026-11-04")?.bars).toHaveLength(1)
  })

  it("lists a day's episodes most recently started first", () => {
    const cold = episode("cold", at(8))
    const morning = episode("morning", at(9, 8), at(9, 8))
    const evening = episode("evening", at(9, 20), at(9, 20))
    expect(
      symptomDays([morning, cold, evening], today).get("2026-11-09")?.episodes,
    ).toEqual([evening, morning, cold])
  })

  it("is empty when there are no episodes", () => {
    expect(symptomDays([], today).size).toBe(0)
  })
})

describe("suggestSymptomNames", () => {
  const history = [
    episode("a", 100, 150, "Headache"),
    episode("b", 300, 350, "Upset stomach"),
    episode("c", 200, 250, "headache"),
    episode("d", 400, undefined, "Cold"),
  ]

  it("offers each past symptom name once, most recently used first", () => {
    expect(suggestSymptomNames(history, "")).toEqual([
      "Cold",
      "Upset stomach",
      "headache",
    ])
  })

  it("treats names that differ only by case as one, using the latest spelling", () => {
    expect(suggestSymptomNames(history, "head")).toEqual(["headache"])
  })

  it("matches what has been typed anywhere in the name, ignoring case", () => {
    expect(suggestSymptomNames(history, "STOMA")).toEqual(["Upset stomach"])
    expect(suggestSymptomNames(history, "  old ")).toEqual(["Cold"])
  })

  it("doesn't offer a name that is already exactly what was typed", () => {
    expect(suggestSymptomNames(history, "Cold")).toEqual([])
  })

  it("still offers a differently-cased version of what was typed", () => {
    expect(suggestSymptomNames(history, "cold")).toEqual(["Cold"])
  })

  it("offers nothing when no name matches, or there is no history", () => {
    expect(suggestSymptomNames(history, "fever")).toEqual([])
    expect(suggestSymptomNames([], "")).toEqual([])
  })

  it("limits how many it offers", () => {
    expect(suggestSymptomNames(history, "", 2)).toEqual([
      "Cold",
      "Upset stomach",
    ])
  })
})

describe("endEpisodeNow", () => {
  it("ends an ongoing episode at the given time, keeping everything else", () => {
    expect(
      endEpisodeNow(
        { id: "cold", symptom: "Cold", start: 100, note: "sniffly" },
        500,
      ),
    ).toEqual({ symptom: "Cold", start: 100, end: 500, note: "sniffly" })
  })

  it("never ends an episode before it started", () => {
    expect(endEpisodeNow(episode("future", 900), 500).end).toBe(900)
  })

  it("doesn't carry the id, since it produces the episode to store", () => {
    expect(endEpisodeNow(episode("cold", 100), 500)).not.toHaveProperty("id")
  })
})

describe("isEndBeforeStart", () => {
  it("is true only when the end is earlier than the start", () => {
    expect(isEndBeforeStart({ start: 200, end: 100 })).toBe(true)
    expect(isEndBeforeStart({ start: 200, end: 200 })).toBe(false)
    expect(isEndBeforeStart({ start: 200, end: 300 })).toBe(false)
  })

  it("is false for an ongoing episode", () => {
    expect(isEndBeforeStart({ start: 200 })).toBe(false)
  })
})
