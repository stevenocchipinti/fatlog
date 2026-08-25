import { Link } from "@tanstack/react-router"
import { Activity, Plus, Salad } from "lucide-react"

import { usePrimaryActionSlot } from "@/lib/primaryAction"
import { cn } from "@/lib/utils"

/**
 * Shared authenticated bottom navigation.
 *
 * WhatsApp-style layout: a short solid bar of icon+label tabs hugging the
 * bottom edge, with a floating primary action button hovering just above the
 * bar's right edge (like WhatsApp's compose FAB). Exposes only the Metrics
 * and Diet modes (Fasting is intentionally hidden while it remains a
 * placeholder). The FAB's behaviour and accessible label are supplied by the
 * currently active route via the primary-action slot, so this component stays
 * agnostic of each mode's recording drawer.
 */
const modes = [
  { to: "/metrics", label: "Metrics", Icon: Activity },
  { to: "/diet", label: "Diet", Icon: Salad },
] as const

export default function BottomNavigation() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <>
      <nav
        aria-label="Primary"
        className="absolute inset-x-0 bottom-0 z-40 mx-auto flex h-16 max-w-sm items-center justify-around"
      >
        {modes.map(mode => (
          <NavTab key={mode.to} mode={mode} />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => primaryAction?.onTrigger()}
        disabled={!primaryAction}
        aria-label={primaryAction?.label ?? "Record"}
        className="from-brand-1 to-brand-2 pointer-events-auto absolute right-4 bottom-20 z-50 mx-auto flex size-14 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <Plus className="!size-6" strokeWidth={2.5} />
      </button>
    </>
  )
}

function NavTab({ mode }: { mode: (typeof modes)[number] }) {
  return (
    <Link to={mode.to} aria-label={mode.label} className="flex-1">
      {({ isActive }) => (
        <span className="flex flex-col items-center justify-center gap-0.5">
          <span
            className={cn(
              "flex items-center rounded-full px-4 py-0.5 transition-colors",
              isActive && "bg-muted",
            )}
          >
            <mode.Icon
              className={cn("!size-5", isActive ? "text-brand-1" : "")}
              strokeWidth={isActive ? 2.4 : 2}
            />
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              isActive ? "text-brand-1" : "text-muted-foreground",
            )}
          >
            {mode.label}
          </span>
        </span>
      )}
    </Link>
  )
}
