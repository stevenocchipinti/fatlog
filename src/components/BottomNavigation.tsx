import { useLocation } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import type { Tracker, TrackerId } from "@/lib/trackers"
import { usePrimaryActionSlot } from "@/lib/primaryAction"
import {
  ENABLED_TRACKERS,
  navigationDirection,
  trackerForPath,
} from "@/lib/trackers"
import { cn } from "@/lib/utils"
import { TransitionLink } from "@/lib/viewTransitions"

/**
 * The app shell's bottom bar: a floating pill of icon-only tracker tabs on the
 * left and the current page's primary (+) action on the right. It sits in its
 * own row rather than over the page, so it never hides content. With a single
 * tracker there's nothing to switch between, so the pill is hidden; the + stays
 * put.
 */
export default function BottomNavigation({
  trackers = ENABLED_TRACKERS,
}: {
  trackers?: readonly Tracker[]
}) {
  const { primaryAction } = usePrimaryActionSlot()
  const { pathname } = useLocation()
  const currentTrackerId = trackerForPath(pathname)?.id

  return (
    <div className="flex shrink-0 items-center gap-3 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {trackers.length > 1 && (
        <nav
          aria-label="Trackers"
          className="border-border/50 bg-card flex h-14 items-center rounded-full border p-1 shadow-lg"
          style={{ viewTransitionName: "bottom-nav" }}
        >
          {trackers.map(tracker => (
            <TrackerTab
              key={tracker.id}
              tracker={tracker}
              currentTrackerId={currentTrackerId}
            />
          ))}
        </nav>
      )}

      <button
        type="button"
        onClick={() => primaryAction?.onTrigger()}
        disabled={!primaryAction}
        aria-label={primaryAction?.label ?? "Record"}
        className="from-brand-1 to-brand-2 ml-auto flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{ viewTransitionName: "fab" }}
      >
        <Plus className="!size-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function TrackerTab({
  tracker: { id, route, title, Icon },
  currentTrackerId,
}: {
  tracker: Tracker
  currentTrackerId: TrackerId | undefined
}) {
  const isActive = id === currentTrackerId

  return (
    <TransitionLink
      to={route}
      direction={navigationDirection(currentTrackerId, id)}
      replace
      aria-label={title}
      aria-current={isActive ? "page" : undefined}
      className="relative flex h-full w-14 items-center justify-center rounded-full"
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
          isActive ? "text-brand-1" : "text-muted-foreground",
        )}
        strokeWidth={isActive ? 2.4 : 2}
      />
    </TransitionLink>
  )
}
