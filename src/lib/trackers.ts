import { Activity, NotebookPen, Salad, Thermometer } from "lucide-react"

import type { LucideIcon } from "lucide-react"
import type { NavigationDirection } from "@/lib/viewTransitions"

/** A kind of observation that can be enabled per profile. See GLOSSARY.md. */
export type TrackerId = "metrics" | "diet" | "bowelMovements" | "symptoms"

export type Tracker = {
  id: TrackerId
  route: string
  title: string
  Icon: LucideIcon
}

/** Every tracker, in canonical order (as shown in the bottom bar). */
export const TRACKERS: readonly Tracker[] = [
  { id: "metrics", route: "/metrics", title: "Metrics", Icon: Activity },
  { id: "diet", route: "/diet", title: "Diet", Icon: Salad },
  {
    id: "bowelMovements",
    route: "/stool",
    title: "Stool",
    Icon: NotebookPen,
  },
  {
    id: "symptoms",
    route: "/symptoms",
    title: "Symptoms",
    Icon: Thermometer,
  },
]

/**
 * The trackers shown in the app shell. Hard-coded for now; profiles (#18) will
 * supply this per profile.
 */
export const ENABLED_TRACKERS: readonly Tracker[] = TRACKERS.filter(
  tracker => tracker.id === "metrics" || tracker.id === "diet",
)

export const trackerForPath = (pathname: string) =>
  TRACKERS.find(tracker => tracker.route === pathname)

/**
 * Which way the screen slides when moving between trackers: forward to a
 * tracker later in the fixed order, backward to an earlier one.
 */
export const navigationDirection = (
  from: TrackerId | undefined,
  to: TrackerId,
): NavigationDirection | undefined => {
  if (!from || from === to) return undefined
  const index = (id: TrackerId) =>
    TRACKERS.findIndex(tracker => tracker.id === id)
  return index(to) > index(from) ? "forward" : "backward"
}
