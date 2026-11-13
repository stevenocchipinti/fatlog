import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export const Spinner = ({ className }: { className?: string }) => (
  <LoaderCircle aria-hidden className={cn("animate-spin", className)} />
)

/** A centred spinner for a screen, or part of one, whose data hasn't loaded. */
const LoadingState = ({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) => (
  <div
    role="status"
    className={cn(
      "text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-sm",
      className,
    )}
  >
    <Spinner className="size-6" />
    {label}
  </div>
)

export default LoadingState
