import { describe, expect, it } from "vitest"

import {
  parseEnabledTrackers,
  profileSetupUpdate,
  resolveActiveProfileId,
  toggleTracker,
  trackerRedirect,
} from "./profiles"

import type { Profile } from "./profiles"
import type { TrackerId } from "@/lib/trackers"

const profile = (id: string, overrides: Partial<Profile> = {}): Profile => ({
  id,
  name: id,
  enabledTrackers: ["metrics", "diet"],
  archived: false,
  ...overrides,
})

describe("resolveActiveProfileId", () => {
  const own = profile("uid-1")
  const child = profile("-child")

  it("uses the remembered profile when it's one of the account's profiles", () => {
    expect(resolveActiveProfileId("uid-1", "-child", [own, child])).toBe(
      "-child",
    )
  })

  it("falls back to the account holder's own profile when nothing is remembered", () => {
    expect(resolveActiveProfileId("uid-1", null, [own, child])).toBe("uid-1")
  })

  it("falls back to the own profile when the remembered one is unknown (e.g. another account's)", () => {
    expect(resolveActiveProfileId("uid-1", "-stranger", [own, child])).toBe(
      "uid-1",
    )
  })

  it("falls back to the own profile when the remembered one is archived", () => {
    const archived = profile("-child", { archived: true })
    expect(resolveActiveProfileId("uid-1", "-child", [own, archived])).toBe(
      "uid-1",
    )
  })
})

describe("parseEnabledTrackers", () => {
  it("enables every tracker by default", () => {
    expect(parseEnabledTrackers(undefined)).toEqual([
      "metrics",
      "diet",
      "bowelMovements",
      "symptoms",
    ])
  })

  it("leaves out trackers stored as disabled, keeping the canonical order", () => {
    expect(
      parseEnabledTrackers({ diet: false, symptoms: false, metrics: true }),
    ).toEqual(["metrics", "bowelMovements"])
  })

  it("never yields an empty list", () => {
    expect(
      parseEnabledTrackers({
        metrics: false,
        diet: false,
        bowelMovements: false,
        symptoms: false,
      }),
    ).toHaveLength(4)
  })
})

describe("toggleTracker", () => {
  const available: TrackerId[] = ["metrics", "diet"]

  it("disables an enabled tracker", () => {
    expect(toggleTracker(["metrics", "diet"], "diet", available)).toEqual([
      "metrics",
    ])
  })

  it("enables a disabled tracker, keeping the canonical order", () => {
    expect(toggleTracker(["diet", "symptoms"], "metrics", available)).toEqual([
      "metrics",
      "diet",
      "symptoms",
    ])
  })

  it("refuses to disable the last tracker that can be used", () => {
    expect(toggleTracker(["metrics"], "metrics", available)).toEqual([
      "metrics",
    ])
  })

  it("counts only available trackers: a not-yet-built tracker doesn't keep the profile usable", () => {
    expect(
      toggleTracker(["metrics", "symptoms"], "metrics", available),
    ).toEqual(["metrics", "symptoms"])
  })
})

describe("trackerRedirect", () => {
  it("sends a disabled tracker's route to the first enabled tracker", () => {
    expect(trackerRedirect("/metrics", ["diet", "symptoms"])).toBe("/diet")
  })

  it("leaves an enabled tracker's route alone", () => {
    expect(trackerRedirect("/diet", ["diet"])).toBeUndefined()
  })

  it("leaves routes that aren't trackers alone", () => {
    expect(trackerRedirect("/profiles", ["diet"])).toBeUndefined()
  })
})

describe("profileSetupUpdate", () => {
  const setup = (overrides = {}) =>
    profileSetupUpdate({
      profileId: "-child",
      owner: "uid-1",
      name: "Sam",
      includeStarters: true,
      ...overrides,
    })

  it("creates the profile record owned by the account, with every tracker on", () => {
    expect(setup()["profiles/-child"]).toEqual({
      owner: "uid-1",
      name: "Sam",
      trackers: {
        metrics: true,
        diet: true,
        bowelMovements: true,
        symptoms: true,
      },
      archived: false,
    })
  })

  it("includes the emoji only when there is one", () => {
    expect(setup({ emoji: "🦊" })["profiles/-child"]).toMatchObject({
      emoji: "🦊",
    })
    expect(setup()["profiles/-child"]).not.toHaveProperty("emoji")
  })

  it("writes the starter food groups under deterministic keys, in order", () => {
    const update = setup()
    expect(update["foodGroups/-child/starter-meat"]).toEqual({
      emoji: "🥩",
      name: "Meat",
      order: 0,
      archived: false,
    })
    expect(update["foodGroups/-child/starter-sweets"]).toMatchObject({
      name: "Sweets",
      order: 6,
    })
    expect(Object.keys(update)).toHaveLength(1 + 7)
  })

  it("leaves food groups alone when the profile already has some", () => {
    expect(Object.keys(setup({ includeStarters: false }))).toEqual([
      "profiles/-child",
    ])
  })
})
