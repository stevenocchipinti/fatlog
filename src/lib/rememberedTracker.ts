import type { TrackerId } from "@/lib/trackers"
import { TRACKER_IDS } from "@/lib/trackers"

const KEY = "lastTracker"

/** The tracker last viewed on this device, which the app reopens on. */
export const rememberedTracker = (): TrackerId | null => {
  try {
    const stored = window.localStorage.getItem(KEY)
    return TRACKER_IDS.find(id => id === stored) ?? null
  } catch {
    return null
  }
}

export const rememberTracker = (id: TrackerId) => {
  try {
    window.localStorage.setItem(KEY, id)
  } catch (error) {
    console.warn(error)
  }
}
