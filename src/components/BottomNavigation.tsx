import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { usePrimaryActionSlot } from "@/lib/primaryAction"
import { cn } from "@/lib/utils"

/**
 * Shared authenticated bottom navigation.
 *
 * Exposes only the Metrics and Diet modes (Fasting is intentionally hidden
 * while it remains a placeholder). The center control is an icon-only `+`
 * primary action whose behaviour and accessible label are supplied by the
 * currently active route via the primary-action slot, so this component stays
 * agnostic of each mode's recording drawer.
 */
const modes = [
  { to: "/metrics", label: "Metrics", emoji: "📈" },
  { to: "/diet", label: "Diet", emoji: "🥗" },
] as const

export default function BottomNavigation() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 mx-auto flex max-w-sm items-end justify-between gap-2 p-4"
    >
      <NavPill mode={modes[0]} />

      <button
        type="button"
        onClick={() => primaryAction?.onTrigger()}
        disabled={!primaryAction}
        aria-label={primaryAction?.label ?? "Record"}
        className="from-brand-1 to-brand-2 bg-linear-to-bl pointer-events-auto -mb-1 flex size-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-background transition-transform hover:scale-105 active:scale-110 disabled:opacity-50"
      >
        <Plus className="!size-7" strokeWidth={2.5} />
      </button>

      <NavPill mode={modes[1]} />
    </nav>
  )
}

function NavPill({
  mode,
}: {
  mode: (typeof modes)[number]
}) {
  return (
    <Link
      to={mode.to}
      className="pointer-events-auto flex flex-1"
      aria-label={mode.label}
    >
      {({ isActive }) => (
        <span
          className={cn(
            "bg-card/80 flex w-full flex-col items-center gap-0.5 rounded-2xl border py-2 backdrop-blur-sm transition-colors",
            isActive
              ? "text-foreground border-foreground/20"
              : "text-muted-foreground border-transparent",
          )}
        >
          <span aria-hidden className="text-lg leading-none">
            {mode.emoji}
          </span>
          <span className="text-xs font-medium">{mode.label}</span>
        </span>
      )}
    </Link>
  )
}
