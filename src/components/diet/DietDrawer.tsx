import { useEffect, useState } from "react"

import type {
  DietException,
  DietRule,
  FoodGroup,
  LocalDate,
  NewDietException,
  NewDietRule,
  NewFoodGroup,
} from "@/types"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FoodGroupPicker from "@/components/diet/FoodGroupPicker"
import ManageFoodGroups from "@/components/diet/ManageFoodGroups"
import { rangesOverlap, todayLocalDate } from "@/lib/localDate"
import { cn } from "@/lib/utils"

type DietTab = "exception" | "rule"

/**
 * How the drawer was opened, so it can preselect the right tab, food group,
 * date, or an existing record to edit.
 */
export type DietDrawerIntent =
  | { kind: "new"; tab?: DietTab; foodGroupId?: string; date?: LocalDate }
  | { kind: "editException"; exception: DietException }
  | { kind: "editRule"; rule: DietRule }
  | { kind: "manage" }

type DietDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  intent: DietDrawerIntent | null

  foodGroups: FoodGroup[]
  rules: DietRule[]
  exceptions: DietException[]

  onAddFoodGroup: (foodGroup: NewFoodGroup) => void
  onUpdateFoodGroup: (id: string, foodGroup: NewFoodGroup) => void
  onDeleteFoodGroup: (id: string) => void

  onAddException: (exception: NewDietException) => void
  onUpdateException: (id: string, exception: NewDietException) => void
  onDeleteException: (id: string) => void

  onAddRule: (rule: NewDietRule) => void
  onUpdateRule: (id: string, rule: NewDietRule) => void
  onDeleteRule: (id: string) => void
}

/**
 * The single Diet drawer, mirroring the feel of the metrics recording drawer.
 *
 * It has an Exception tab (default) and a Rule tab, each able to add or edit its
 * record type, with delete guarded by confirmation. Food group management is
 * reachable from the picker. Tapping timeline elements opens this drawer with a
 * matching intent (preselected group/date, or an existing record to edit).
 */
export default function DietDrawer(props: DietDrawerProps) {
  const { open, onOpenChange, intent, foodGroups } = props

  const [tab, setTab] = useState<DietTab>("exception")
  const [managing, setManaging] = useState(false)

  // Exception form state
  const [exFoodGroupId, setExFoodGroupId] = useState<string>()
  const [exDate, setExDate] = useState<LocalDate>(todayLocalDate())
  const [exNote, setExNote] = useState("")
  const [editingExceptionId, setEditingExceptionId] = useState<string>()

  // Rule form state
  const [ruleFoodGroupId, setRuleFoodGroupId] = useState<string>()
  const [ruleStart, setRuleStart] = useState<LocalDate>(todayLocalDate())
  const [ruleEnd, setRuleEnd] = useState<LocalDate>("")
  const [ruleNote, setRuleNote] = useState("")
  const [editingRuleId, setEditingRuleId] = useState<string>()

  // Apply the opening intent whenever the drawer opens.
  useEffect(() => {
    if (!open || !intent) return
    setManaging(intent.kind === "manage")

    if (intent.kind === "manage") return

    if (intent.kind === "editException") {
      setTab("exception")
      setEditingExceptionId(intent.exception.id)
      setEditingRuleId(undefined)
      setExFoodGroupId(intent.exception.foodGroupId)
      setExDate(intent.exception.date)
      setExNote(intent.exception.note ?? "")
      return
    }

    if (intent.kind === "editRule") {
      setTab("rule")
      setEditingExceptionId(undefined)
      setEditingRuleId(intent.rule.id)
      setRuleFoodGroupId(intent.rule.foodGroupId)
      setRuleStart(intent.rule.startDate)
      setRuleEnd(intent.rule.endDate ?? "")
      setRuleNote(intent.rule.note ?? "")
      return
    }

    // kind === "new"
    setTab(intent.tab ?? "exception")
    setEditingExceptionId(undefined)
    setEditingRuleId(undefined)
    setExNote("")
    setRuleNote("")
    setRuleEnd("")
    setExFoodGroupId(intent.foodGroupId)
    setRuleFoodGroupId(intent.foodGroupId)
    if (intent.date) {
      setExDate(intent.date)
      setRuleStart(intent.date)
    } else {
      setExDate(todayLocalDate())
      setRuleStart(todayLocalDate())
    }
  }, [open, intent])

  const close = () => onOpenChange(false)

  const submitException = () => {
    if (!exFoodGroupId) return
    const note = exNote.trim() || undefined

    // Enforce one exception per food group per date: if one already exists for
    // this group/date, update it in place rather than creating a duplicate.
    const existing = props.exceptions.find(
      e =>
        e.foodGroupId === exFoodGroupId &&
        e.date === exDate &&
        e.id !== editingExceptionId,
    )
    const targetId = editingExceptionId ?? existing?.id

    if (targetId) {
      props.onUpdateException(targetId, {
        foodGroupId: exFoodGroupId,
        date: exDate,
        note,
      })
    } else {
      props.onAddException({ foodGroupId: exFoodGroupId, date: exDate, note })
    }
    close()
  }

  const ruleOverlapError = (() => {
    if (!ruleFoodGroupId) return null
    const end = ruleEnd || undefined
    const clash = props.rules.find(
      r =>
        r.foodGroupId === ruleFoodGroupId &&
        r.id !== editingRuleId &&
        rangesOverlap(r.startDate, r.endDate, ruleStart, end),
    )
    if (end && end < ruleStart)
      return "End date must be on or after the start date."
    return clash ? "This overlaps an existing rule for this food group." : null
  })()

  const submitRule = () => {
    if (!ruleFoodGroupId || ruleOverlapError) return
    const payload: NewDietRule = {
      foodGroupId: ruleFoodGroupId,
      startDate: ruleStart,
      endDate: ruleEnd || undefined,
      note: ruleNote.trim() || undefined,
    }
    if (editingRuleId) props.onUpdateRule(editingRuleId, payload)
    else props.onAddRule(payload)
    close()
  }

  const deleteException = () => {
    if (!editingExceptionId) return
    if (window.confirm("Delete this diet exception?")) {
      props.onDeleteException(editingExceptionId)
      close()
    }
  }

  const deleteRule = () => {
    if (!editingRuleId) return
    if (window.confirm("Delete this diet rule?")) {
      props.onDeleteRule(editingRuleId)
      close()
    }
  }

  const hasHistory = (foodGroupId: string) =>
    props.rules.some(r => r.foodGroupId === foodGroupId) ||
    props.exceptions.some(e => e.foodGroupId === foodGroupId)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          {managing ? (
            <ManageFoodGroups
              foodGroups={foodGroups}
              hasHistory={hasHistory}
              onCreate={props.onAddFoodGroup}
              onUpdate={props.onUpdateFoodGroup}
              onDelete={props.onDeleteFoodGroup}
              onBack={() => setManaging(false)}
            />
          ) : (
            <>
              <DrawerHeader className="pb-2">
                <DrawerTitle>
                  {editingExceptionId || editingRuleId
                    ? "Edit diet change"
                    : "Record diet change"}
                </DrawerTitle>
                <DrawerDescription>
                  Track how your diet changes over time 🥗
                </DrawerDescription>
              </DrawerHeader>

              {/* Exception / Rule tabs */}
              <div className="px-4">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-200 p-1 dark:bg-stone-900">
                  {(["exception", "rule"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      aria-pressed={tab === t}
                      disabled={
                        // Editing locks the tab to the record being edited.
                        (!!editingExceptionId && t === "rule") ||
                        (!!editingRuleId && t === "exception")
                      }
                      className={cn(
                        "rounded-md py-1.5 text-sm font-medium capitalize transition-colors disabled:opacity-40",
                        tab === t
                          ? "bg-card text-foreground border shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "exception" ? (
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    submitException()
                  }}
                  className="space-y-3 p-4"
                >
                  <FoodGroupPicker
                    foodGroups={foodGroups}
                    selectedId={exFoodGroupId}
                    onSelect={setExFoodGroupId}
                    onManage={() => setManaging(true)}
                  />
                  <div>
                    <Label htmlFor="ex-date" className="text-sm">
                      Date
                    </Label>
                    <Input
                      id="ex-date"
                      type="date"
                      value={exDate}
                      onChange={e =>
                        e.target.value && setExDate(e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ex-note" className="text-sm">
                      Note (optional)
                    </Label>
                    <Input
                      id="ex-note"
                      value={exNote}
                      onChange={e => setExNote(e.target.value)}
                      placeholder="e.g. tried kangaroo for the first time"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button type="submit" disabled={!exFoodGroupId}>
                      Save exception
                    </Button>
                    {editingExceptionId ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={deleteException}
                      >
                        Delete
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={close}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    submitRule()
                  }}
                  className="space-y-3 p-4"
                >
                  <FoodGroupPicker
                    foodGroups={foodGroups}
                    selectedId={ruleFoodGroupId}
                    onSelect={setRuleFoodGroupId}
                    onManage={() => setManaging(true)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rule-start" className="text-sm">
                        Start date
                      </Label>
                      <Input
                        id="rule-start"
                        type="date"
                        value={ruleStart}
                        onChange={e =>
                          e.target.value && setRuleStart(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="rule-end" className="text-sm">
                        End date (optional)
                      </Label>
                      <Input
                        id="rule-end"
                        type="date"
                        value={ruleEnd}
                        onChange={e => setRuleEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rule-note" className="text-sm">
                      Note (optional)
                    </Label>
                    <Input
                      id="rule-note"
                      value={ruleNote}
                      onChange={e => setRuleNote(e.target.value)}
                      placeholder="e.g. reintroducing dairy"
                    />
                  </div>
                  {ruleOverlapError && (
                    <p className="text-destructive text-sm">
                      {ruleOverlapError}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={!ruleFoodGroupId || !!ruleOverlapError}
                    >
                      Save rule
                    </Button>
                    {editingRuleId ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={deleteRule}
                      >
                        Delete
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={close}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
