import { cn } from "@/lib/utils"

/** A pulsing block standing in for content that hasn't loaded yet. */
const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn("bg-foreground/10 animate-pulse rounded-md", className)}
  />
)

export default Skeleton
