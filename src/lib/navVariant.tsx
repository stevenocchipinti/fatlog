import {
  NavDock,
  NavNotch,
  NavRail,
  NavSegmented,
  NavSpeedDial,
} from "@/components/navExperiments"

import type { ComponentType } from "react"

/**
 * Throwaway UI experiment: maps URL prefixes to alternative bottom-nav
 * designs so each can be tried in situ without touching any other app code.
 *
 * - undefined (no prefix) → the production BottomNavigation (untouched)
 * - /nav1 … /nav5          → experimental variants below
 */
export const NAV_VARIANTS: Record<string, ComponentType> = {
  nav1: NavDock,
  nav2: NavSegmented,
  nav3: NavSpeedDial,
  nav4: NavNotch,
  nav5: NavRail,
}

/** Longest `nav*` segment at the start of the pathname, if any. */
export const parseNavPrefix = (
  pathname: string,
): { id?: string; rest: string } => {
  const match = /^\/(nav\d)(\/|$)/.exec(pathname)
  if (!match) return { rest: pathname }
  return { id: match[1], rest: pathname.slice(match[1].length) }
}
