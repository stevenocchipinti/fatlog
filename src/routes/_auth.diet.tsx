import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"

import type { DietDrawerIntent } from "@/components/diet/DietDrawer"

import DietDrawer from "@/components/diet/DietDrawer"
import DietTimeline from "@/components/diet/DietTimeline"
import { useDiet } from "@/lib/firebase"
import { useRegisterPrimaryAction } from "@/lib/primaryAction"

export const Route = createFileRoute("/_auth/diet")({
  component: DietPage,
})

function DietPage() {
  const {
    foodGroups,
    rules,
    exceptions,
    addFoodGroup,
    updateFoodGroup,
    deleteFoodGroup,
    addException,
    updateException,
    deleteException,
    addRule,
    updateRule,
    deleteRule,
  } = useDiet()

  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState<DietDrawerIntent | null>(null)

  const openWith = useCallback((next: DietDrawerIntent) => {
    setIntent(next)
    setOpen(true)
  }, [])

  // The shared bottom nav's `+` opens a blank Diet drawer (Exception tab) while
  // this route is active.
  useRegisterPrimaryAction(
    "Record diet change",
    useCallback(() => openWith({ kind: "new" }), [openWith]),
  )

  return (
    <>
      <DietTimeline
        foodGroups={foodGroups}
        rules={rules}
        exceptions={exceptions}
        onSelectFoodGroup={foodGroupId =>
          openWith({ kind: "new", foodGroupId })
        }
        onSelectCell={(foodGroupId, date) =>
          openWith({ kind: "new", foodGroupId, date })
        }
        onSelectException={exception =>
          openWith({ kind: "editException", exception })
        }
        onSelectRule={rule => openWith({ kind: "editRule", rule })}
      />

      <DietDrawer
        open={open}
        onOpenChange={setOpen}
        intent={intent}
        foodGroups={foodGroups}
        rules={rules}
        exceptions={exceptions}
        onAddFoodGroup={addFoodGroup}
        onUpdateFoodGroup={updateFoodGroup}
        onDeleteFoodGroup={deleteFoodGroup}
        onAddException={addException}
        onUpdateException={updateException}
        onDeleteException={deleteException}
        onAddRule={addRule}
        onUpdateRule={updateRule}
        onDeleteRule={deleteRule}
      />
    </>
  )
}
