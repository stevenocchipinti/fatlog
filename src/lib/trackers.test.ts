import { describe, expect, it } from "vitest"

import { navigationDirection, trackerForPath } from "./trackers"

describe("trackerForPath", () => {
  it("finds the tracker whose route matches the path", () => {
    expect(trackerForPath("/diet")?.title).toBe("Diet")
    expect(trackerForPath("/metrics")?.title).toBe("Metrics")
  })

  it("returns undefined for a path that isn't a tracker", () => {
    expect(trackerForPath("/")).toBeUndefined()
  })
})

describe("navigationDirection", () => {
  it("goes forward to a tracker later in the fixed order", () => {
    expect(navigationDirection("metrics", "diet")).toBe("forward")
    expect(navigationDirection("metrics", "symptoms")).toBe("forward")
    expect(navigationDirection("diet", "bowelMovements")).toBe("forward")
  })

  it("goes backward to a tracker earlier in the fixed order", () => {
    expect(navigationDirection("symptoms", "bowelMovements")).toBe("backward")
    expect(navigationDirection("diet", "metrics")).toBe("backward")
  })

  it("has no direction when there's no current tracker", () => {
    expect(navigationDirection(undefined, "diet")).toBeUndefined()
  })
})
