import type { FoodGroup } from "@/types"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FoodGroupPickerProps = {
  foodGroups: FoodGroup[]
  selectedId?: string
  onSelect: (id: string) => void
  onManage: () => void
}

/**
 * Selects the food group a rule or exception applies to. Only active (non
 * archived) food groups are offered, plus a Manage entry point that opens food
 * group management (create custom groups, archive/restore, reorder) from within
 * the same drawer.
 */
export default function FoodGroupPicker({
  foodGroups,
  selectedId,
  onSelect,
  onManage,
}: FoodGroupPickerProps) {
  const active = foodGroups
    .filter(g => !g.archived)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Food group</Label>
        <button
          type="button"
          onClick={onManage}
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
        >
          Manage food groups
        </button>
      </div>

      {active.length === 0 ? (
        <button
          type="button"
          onClick={onManage}
          className="border-input text-muted-foreground w-full rounded-md border border-dashed p-3 text-sm"
        >
          No food groups yet — tap to add one
        </button>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {active.map(group => {
            const selected = group.id === selectedId
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelect(group.id)}
                aria-pressed={selected}
                aria-label={group.name}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-foreground/30 bg-primary text-primary-foreground"
                    : "border-border bg-muted hover:bg-muted/70",
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {group.emoji}
                </span>
                {group.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
