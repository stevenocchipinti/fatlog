import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Throwaway UI experiment: small floating chip column for hopping between the
 * experimental bottom-nav variants without retyping URLs.
 *
 * Plain anchors (not router Links) on purpose: switching variant means loading
 * the app under a different basepath, which requires a fresh page load.
 */
export default function VariantSwitcher({ current }: { current?: string }) {
  const ids = ["nav1", "nav2", "nav3", "nav4", "nav5"]
  return (
    <div className="pointer-events-auto fixed top-1/2 right-1 z-50 flex -translate-y-1/2 flex-col gap-1.5">
      {ids.map(id => (
        <a
          key={id}
          href={`/${id}/metrics`}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold shadow-md backdrop-blur-sm transition-colors",
            id === current
              ? "from-brand-1 to-brand-2 border-transparent bg-linear-to-br text-white"
              : "bg-card/80 border-border/60 text-muted-foreground",
          )}
        >
          {id.replace("nav", "")}
        </a>
      ))}
      <a
        href="/metrics"
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full border shadow-md backdrop-blur-sm transition-colors",
          !current
            ? "border-transparent bg-stone-900 text-white dark:bg-white dark:text-stone-900"
            : "bg-card/80 border-border/60 text-muted-foreground",
        )}
        aria-label="Production navigation"
      >
        <X className="!size-3.5" />
      </a>
    </div>
  )
}
