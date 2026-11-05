import { createLucideIcon } from "lucide-react"

import type { LucideIcon } from "lucide-react"
import type { BristolType } from "@/types"

/*
 * Custom icons drawn on Lucide's 24×24 grid and rendered through
 * createLucideIcon, so they share Lucide's stroke width, caps and sizing and
 * sit alongside the stock icons without looking out of place.
 *
 * The Bristol type icons follow the shapes on the standard Bristol stool chart,
 * leaning on the usual food analogies (rabbit droppings, grapes, corn,
 * sausage, nuggets, porridge, gravy) and simplified to read at 20–28px.
 */

/** A line version of the poo emoji, for the Stool tracker tab. */
export const Poo = createLucideIcon("Poo", [
  [
    "path",
    { d: "M5.5 21h13a2.75 2.75 0 0 0 0-5.5h-13a2.75 2.75 0 0 0 0 5.5Z" },
  ],
  ["path", { d: "M8 15.5h8a2.5 2.5 0 0 0 0-5H8a2.5 2.5 0 0 0 0 5Z" }],
  ["path", { d: "M10 10.5h4a2.25 2.25 0 0 0 .6-4.42C14.6 4.2 13.4 3 11.5 3" }],
  ["path", { d: "M10 10.5a2.25 2.25 0 0 1-.4-4.46" }],
])

/** Separate hard pellets, like rabbit droppings. */
export const BristolType1 = createLucideIcon("BristolType1", [
  ["circle", { cx: "5", cy: "9", r: "2" }],
  ["circle", { cx: "12", cy: "6.5", r: "2" }],
  ["circle", { cx: "19", cy: "9", r: "2" }],
  ["circle", { cx: "8", cy: "16.5", r: "2" }],
  ["circle", { cx: "16", cy: "16.5", r: "2" }],
])

/** A lumpy sausage, like a bunch of grapes. */
export const BristolType2 = createLucideIcon("BristolType2", [
  ["circle", { cx: "6", cy: "15", r: "3" }],
  ["circle", { cx: "12", cy: "15", r: "3" }],
  ["circle", { cx: "18", cy: "15", r: "3" }],
  ["path", { d: "M6.9 12.1A3 3 0 1 1 11.1 12.1" }],
  ["path", { d: "M12.9 12.1A3 3 0 1 1 17.1 12.1" }],
])

/** A sausage with cracks on the surface, like a cob of corn. */
export const BristolType3 = createLucideIcon("BristolType3", [
  ["path", { d: "M2 12c2.5-6.5 17.5-6.5 20 0-2.5 6.5-17.5 6.5-20 0Z" }],
  ["path", { d: "M6 9.5c-.7 1.6-.7 3.4 0 5" }],
  ["path", { d: "M10 7.8c-.9 2.6-.9 5.8 0 8.4" }],
  ["path", { d: "M14 7.8c-.9 2.6-.9 5.8 0 8.4" }],
  ["path", { d: "M18 9.5c-.7 1.6-.7 3.4 0 5" }],
  ["path", { d: "M4.5 12h15" }],
])

/** A smooth, soft, snake-like sausage. */
export const BristolType4 = createLucideIcon("BristolType4", [
  [
    "path",
    {
      d: "M3.6 9.6C8.5 5 12.5 11.5 18 7a3 3 0 0 1 3.4 4.9C15 17.5 9.5 11 5.6 15.4a3 3 0 0 1-2-5.8Z",
    },
  ],
])

/** Soft blobs with clear-cut edges, like chicken nuggets. */
export const BristolType5 = createLucideIcon("BristolType5", [
  [
    "path",
    {
      d: "M3 8.5C2.6 6 4.5 4 7 4.3c1 .1 1.5-.5 2.6-.3 2 .4 2.9 2.3 2.2 4.2-.4 1 .2 1.6-.3 2.6-.9 1.6-3 2-4.4 1.4-.9-.4-1.5 0-2.4-.4C3.6 11.3 3.1 10 3 8.5Z",
    },
  ],
  [
    "path",
    {
      d: "M15 9.3c-.2-1.7 1.3-3 3-2.8.8.1 1.2-.3 2-.1 1.4.4 2 1.9 1.6 3.3-.3.8.1 1.3-.3 2-.7 1.2-2.3 1.5-3.4 1-.7-.3-1.2 0-1.8-.4-.7-.6-1-1.8-1.1-3Z",
    },
  ],
  [
    "path",
    {
      d: "M6 17.5c.1-1.9 1.9-3.2 3.8-2.8.9.2 1.4-.2 2.4 0 1.8.4 2.6 2.2 2 3.9-.3.9.1 1.4-.5 2.3-1 1.3-2.8 1.5-4.1.9-.8-.4-1.4 0-2.2-.4C6.5 20.8 5.9 19.3 6 17.5Z",
    },
  ],
])

/** Fluffy, ragged mushy pieces, like a bowl of porridge. */
export const BristolType6 = createLucideIcon("BristolType6", [
  ["path", { d: "M3 13h18a9 8 0 0 1-18 0Z" }],
  [
    "path",
    {
      d: "M4.5 13c-.4-1.8 1-3 2.6-2.4.3-1.8 2.4-2.5 3.6-1.2 1-1.3 3-1.1 3.6.4 1.4-.7 3.2.3 3 2 1.4 0 2.4 1 2.2 1.2",
    },
  ],
])

/** A droplet over a puddle: entirely liquid, like gravy. */
export const BristolType7 = createLucideIcon("BristolType7", [
  [
    "path",
    { d: "M12 3s-3.5 3.8-3.5 6.25a3.5 3.5 0 0 0 7 0C15.5 6.8 12 3 12 3Z" },
  ],
  [
    "path",
    {
      d: "M2 18.5c0-1.6 3.2-2.5 6.5-2.5 2.4 0 3.6.8 5.5.8 3.3 0 8 .1 8 1.7S17.5 21 12 21 2 20.1 2 18.5Z",
    },
  ],
])

/** The icon for each Bristol type, from 1 (hard lumps) to 7 (liquid). */
export const BRISTOL_ICONS: Record<BristolType, LucideIcon> = {
  1: BristolType1,
  2: BristolType2,
  3: BristolType3,
  4: BristolType4,
  5: BristolType5,
  6: BristolType6,
  7: BristolType7,
}
