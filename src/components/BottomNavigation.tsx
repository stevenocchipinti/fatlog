import { useLocation } from "@tanstack/react-router"
import { Activity, Plus, Salad } from "lucide-react"

import type { NavigationDirection } from "@/lib/viewTransitions"
import { usePrimaryActionSlot } from "@/lib/primaryAction"
import { cn } from "@/lib/utils"
import { TransitionLink } from "@/lib/viewTransitions"

export default function BottomNavigation() {
  const { primaryAction } = usePrimaryActionSlot()

  return (
    <>
      <nav
        aria-label="Primary"
        className="border-border/50 bg-card absolute inset-x-0 bottom-0 z-40 mx-auto flex h-18 items-center justify-around border-t"
        style={{ viewTransitionName: "bottom-nav" }}
      >
        <div
          aria-label="Primary"
          className="mx-auto flex h-16 w-full max-w-sm items-center justify-around"
        >
          <NavTab
            to="/metrics"
            label="Metrics"
            Icon={Activity}
            direction="metrics"
          />
          <span aria-hidden className="w-16" />
          <NavTab to="/diet" label="Diet" Icon={Salad} direction="diet" />
        </div>
      </nav>

      <button
        type="button"
        onClick={() => primaryAction?.onTrigger()}
        disabled={!primaryAction}
        aria-label={primaryAction?.label ?? "Record"}
        className="from-brand-1 to-brand-2 pointer-events-auto absolute right-0 bottom-2 left-0 z-50 mx-auto flex size-14 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{ viewTransitionName: "fab" }}
      >
        <Plus className="!size-6" strokeWidth={2.5} />
      </button>
    </>
  )
}

function NavTab({
  to,
  label,
  Icon,
  direction,
}: {
  to: string
  label: string
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  direction: NavigationDirection
}) {
  const { pathname } = useLocation()
  const isActive = pathname === to

  return (
    <TransitionLink
      to={to}
      direction={direction}
      replace
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className="flex-1"
    >
      <span className="flex flex-col items-center justify-center gap-0.5">
        <span
          className={cn(
            "relative flex items-center rounded-full px-4 py-0.5 transition-colors",
            isActive && "bg-muted",
          )}
        >
          {isActive && (
            <span
              className="bg-muted absolute inset-0 rounded-full"
              style={{ viewTransitionName: "bottom-nav-active-pill" }}
            />
          )}
          <Icon
            className={cn(
              "relative z-10 !size-5",
              isActive ? "text-brand-1" : "",
            )}
            strokeWidth={isActive ? 2.4 : 2}
          />
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            isActive ? "text-brand-1" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </span>
    </TransitionLink>
  )
}
