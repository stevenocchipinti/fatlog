import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Salad,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

import { Link } from "@tanstack/react-router"
import { usePrimaryActionSlot } from "@/lib/primaryAction"
import { cn } from "@/lib/utils"

import type { AppMode } from "@/types"
import type { ReactNode } from "react"

/**
 * Throwaway UI experiment: alternative bottom-navigation designs.
 *
 * Each variant renders the same three controls (Metrics, primary "+", Diet)
 * but with a different visual/interaction treatment. Variants are selected by
 * URL prefix (see lib/navVariant.tsx) and are not meant for production.
 */

type ModeMeta = {
  to: "/metrics" | "/diet"
  label: string
  Icon: typeof Activity
}

const MODES: Record<AppMode, ModeMeta> = {
  metrics: { to: "/metrics", label: "Metrics", Icon: Activity },
  diet: { to: "/diet", label: "Diet", Icon: Salad },
}

/** Shared wrapper so every variant sits in the same place. */
function NavShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-40 mx-auto flex max-w-sm items-end p-4",
        className,
      )}
    >
      {children}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* nav1 — "Floating dock": one glass bar, raised gradient FAB in the    */
/* middle, active tab tinted with the brand colour                      */
/* ------------------------------------------------------------------ */

export function NavDock() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <NavShell>
      <div className="bg-card/80 border-border/60 pointer-events-auto flex w-full items-center justify-around rounded-full border p-1.5 shadow-lg backdrop-blur-md">
        <DockItem mode="metrics" />
        <button
          type="button"
          onClick={() => primaryAction?.onTrigger()}
          disabled={!primaryAction}
          aria-label={primaryAction?.label ?? "Record"}
          className="from-brand-1 to-brand-2 flex size-12 shrink-0 -translate-y-4 items-center justify-center rounded-full bg-linear-to-br text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Plus className="!size-6" strokeWidth={2.5} />
        </button>
        <DockItem mode="diet" />
      </div>
    </NavShell>
  )
}

function DockItem({ mode }: { mode: AppMode }) {
  const { to, label, Icon } = MODES[mode]
  return (
    <Link to={to} aria-label={label}>
      {({ isActive }) => (
        <span className="relative grid size-14 place-items-center">
          {isActive && (
            <motion.span
              layoutId="nav-experiment-dock-pill"
              className="from-brand-1 to-brand-2 absolute inset-1 rounded-full bg-linear-to-tr opacity-15"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={cn(
              "relative flex flex-col items-center",
              isActive ? "text-brand-1" : "text-muted-foreground",
            )}
          >
            <Icon className="!size-6" strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[10px] leading-tight font-medium">
              {label}
            </span>
          </span>
        </span>
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* nav2 — "Segmented hero": two tall glass cards that fill with the     */
/* brand gradient when active + dark gradient FAB                       */
/* ------------------------------------------------------------------ */

export function NavSegmented() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <NavShell className="justify-center gap-3">
      <SegmentedItem mode="metrics" />
      <button
        type="button"
        onClick={() => primaryAction?.onTrigger()}
        disabled={!primaryAction}
        aria-label={primaryAction?.label ?? "Record"}
        className="ring-background pointer-events-auto relative z-10 size-16 shrink-0 overflow-hidden rounded-full shadow-xl ring-4 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <span className="from-brand-1 to-brand-2 absolute inset-0 rounded-full border border-white/20 bg-linear-to-br" />
        <Plus className="relative !size-7 text-white" strokeWidth={2.5} />
      </button>
      <SegmentedItem mode="diet" />
    </NavShell>
  )
}

function SegmentedItem({ mode }: { mode: AppMode }) {
  const { to, label, Icon } = MODES[mode]
  return (
    <Link to={to} className="pointer-events-auto flex-1" aria-label={label}>
      {({ isActive }) => (
        <span
          className={cn(
            "flex h-16 w-full flex-col items-center justify-center rounded-2xl border backdrop-blur-md transition-all duration-200",
            isActive
              ? "from-brand-1 to-brand-2 border-transparent bg-linear-to-tr text-white shadow-lg"
              : "bg-card/70 border-border/50 text-muted-foreground",
          )}
        >
          <Icon className="!size-5" strokeWidth={2.2} />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {label}
          </span>
        </span>
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* nav3 — "Speed dial": compact pair of round buttons; the chevron      */
/* toggles an extra labelled action row                                 */
/* ------------------------------------------------------------------ */

export function NavSpeedDial() {
  const { primaryAction } = usePrimaryActionSlot()
  const [expanded, setExpanded] = useState(false)

  return (
    <NavShell className="flex-col items-center gap-2">
      {expanded && (
        <div className="bg-card/90 border-border/60 pointer-events-auto mb-1 flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur-md">
          <DialItem mode="metrics" />
          <span className="bg-border mx-1 h-6 w-px" />
          <DialItem mode="diet" />
        </div>
      )}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide navigation" : "Show navigation"}
          className="bg-card/80 text-muted-foreground border-border/60 grid size-11 place-items-center rounded-full border shadow-md backdrop-blur-md active:scale-95"
        >
          {expanded ? (
            <ChevronDown className="!size-5" />
          ) : (
            <ChevronUp className="!size-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => primaryAction?.onTrigger()}
          disabled={!primaryAction}
          aria-label={primaryAction?.label ?? "Record"}
          className="from-brand-1 to-brand-2 ring-background flex size-14 items-center justify-center rounded-full bg-linear-to-bl text-white shadow-lg ring-4 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="!size-6" strokeWidth={2.2} />
        </button>
      </div>
    </NavShell>
  )
}

function DialItem({ mode }: { mode: AppMode }) {
  const { to, label, Icon } = MODES[mode]
  return (
    <Link to={to} aria-label={label}>
      {({ isActive }) => (
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium",
            isActive ? "text-brand-1" : "text-muted-foreground",
          )}
        >
          <Icon className="!size-4" />
          {label}
        </span>
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* nav4 — "Notch bar": edge-to-edge bar with the FAB sitting in a       */
/* centre notch                                                         */
/* ------------------------------------------------------------------ */

export function NavNotch() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <NavShell className="p-0">
      <div className="pointer-events-auto relative w-full">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => primaryAction?.onTrigger()}
            disabled={!primaryAction}
            aria-label={primaryAction?.label ?? "Record"}
            className="ring-background flex size-16 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl ring-8 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-stone-900"
          >
            <Plus className="!size-7" strokeWidth={2.5} />
          </button>
        </div>
        <div className="bg-card/90 border-border/60 flex h-16 items-stretch justify-between border-t px-6 backdrop-blur-md">
          <TabEdge mode="metrics" align="left" />
          <TabEdge mode="diet" align="right" />
        </div>
      </div>
    </NavShell>
  )
}

function TabEdge({ mode, align }: { mode: AppMode; align: "left" | "right" }) {
  const { to, label, Icon } = MODES[mode]
  return (
    <Link to={to} aria-label={label} className="flex-1">
      {({ isActive }) => (
        <span
          className={cn(
            "flex h-16 flex-col justify-center gap-1",
            align === "left" ? "items-start pl-2" : "items-end pr-2",
          )}
        >
          <Icon
            className={cn("!size-6", isActive ? "text-brand-1" : "")}
            strokeWidth={isActive ? 2.4 : 2}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive ? "text-brand-1" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </span>
      )}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* nav5 — "Soft rail": quiet rounded bar, dashed-outline record button  */
/* lifted out of the rail                                               */
/* ------------------------------------------------------------------ */

export function NavRail() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <NavShell className="justify-center">
      <div className="bg-card/85 border-border/60 pointer-events-auto flex items-end gap-4 rounded-3xl border px-5 pt-3 pb-2 shadow-lg backdrop-blur-md">
        <RailItem mode="metrics" />
        <button
          type="button"
          onClick={() => primaryAction?.onTrigger()}
          disabled={!primaryAction}
          aria-label={primaryAction?.label ?? "Record"}
          className="shrink-0 -translate-y-6 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <span className="border-brand-1/50 bg-background grid size-14 place-items-center rounded-full border-2 border-dashed shadow-md">
            <Plus className="text-brand-1 !size-6" strokeWidth={2.5} />
          </span>
        </button>
        <RailItem mode="diet" />
      </div>
    </NavShell>
  )
}

function RailItem({ mode }: { mode: AppMode }) {
  const { to, label, Icon } = MODES[mode]
  return (
    <Link to={to} aria-label={label}>
      {({ isActive }) => (
        <span className="flex w-14 flex-col items-center gap-1 pb-1">
          <span
            className={cn(
              "size-1.5 rounded-full transition-all",
              isActive
                ? "bg-brand-1 scale-125"
                : "bg-muted-foreground/40 scale-100",
            )}
          />
          <span
            className={cn(
              "flex flex-col items-center transition-colors",
              isActive ? "text-brand-1" : "text-muted-foreground",
            )}
          >
            <Icon className="!size-5" strokeWidth={isActive ? 2.4 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </span>
        </span>
      )}
    </Link>
  )
}
