import { describe, expect, it } from "vitest"

import {
  endEpisodeNow,
  isEndBeforeStart,
  parseSymptomEpisode,
  splitOngoingAndPast,
  suggestSymptomNames,
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

describe("splitOngoingAndPast", () => {
  it("puts episodes without an end in ongoing and the rest in past", () => {
    const { ongoing, past } = splitOngoingAndPast([
      episode("cold", 100),
      episode("stomach", 200, 200),
      episode("headache", 300, 400),
    ])
    expect(ongoing.map(e => e.id)).toEqual(["cold"])
    expect(past.map(e => e.id)).toEqual(["headache", "stomach"])
  })

  it("lists the most recently started first in both groups", () => {
    const { ongoing, past } = splitOngoingAndPast([
      episode("old-ongoing", 100),
      episode("new-ongoing", 900),
      episode("old-past", 200, 300),
      episode("new-past", 800, 850),
    ])
    expect(ongoing.map(e => e.id)).toEqual(["new-ongoing", "old-ongoing"])
    expect(past.map(e => e.id)).toEqual(["new-past", "old-past"])
  })

  it("treats a one-off (end equal to start) as past, not ongoing", () => {
    expect(splitOngoingAndPast([episode("blip", 5, 5)]).ongoing).toEqual([])
  })

  it("is empty when there are no episodes", () => {
    expect(splitOngoingAndPast([])).toEqual({ ongoing: [], past: [] })
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
