import type { BristolType } from "@/types"
import { BRISTOL_ICONS } from "@/components/icons"

/** The custom line icon for a Bristol type. Decorative: pair it with text. */
export default function BristolIcon({
  type,
  className,
}: {
  type: BristolType
  className?: string
}) {
  const Icon = BRISTOL_ICONS[type]
  return <Icon className={className} aria-hidden />
}
