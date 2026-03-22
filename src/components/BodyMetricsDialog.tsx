import { useEffect, useRef, useState } from "react"
import type { BodyMetricDataPoint, NewBodyMetricDataPoint } from "@/types"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type BodyMetricsDialogProps = {
  mode: "add" | "edit"
  open: boolean
  loading: boolean
  lastCheckin?: BodyMetricDataPoint
  editingCheckin?: BodyMetricDataPoint
  children?: React.ReactNode
  onOpenChange: (open: boolean) => void
  onSubmit: (newCheckin: NewBodyMetricDataPoint) => void
}
const BodyMetricsDialog = ({
  mode,
  open,
  loading,
  lastCheckin,
  editingCheckin,
  children,
  onOpenChange,
  onSubmit: onAddCheckin,
}: BodyMetricsDialogProps) => {
  const [createdAt, setCreatedAt] = useState<Date>(new Date())
  const [weight, setWeight] = useState<number>()
  const [fat, setFat] = useState<number>()
  const [waist, setWaist] = useState<number>()

  const weightInputRef = useRef<HTMLInputElement>(null)
  const fatInputRef = useRef<HTMLInputElement>(null)
  const waistInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingCheckin) {
      setCreatedAt(editingCheckin.createdAt)
      setWeight(editingCheckin.weight)
      setFat(editingCheckin.fat)
      setWaist(editingCheckin.waist)
    }
  }, [editingCheckin])

  const formatPreviousValue = (current?: number, previous?: number) => {
    if (!previous) return ""
    if (!current) return previous
    if (current === previous) return `${previous}  ●`
    if (previous > current) return `${previous}  ↓`
    if (previous < current) return `${previous}  ↑`
  }

  // The date should always be valid because it shouldn't be able to be set to
  // an invalid value from the onChange handler
  const validInputs = weight && fat && waist

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {children && (
        <DrawerTrigger asChild>
          <Button
            size="xl"
            variant="glass"
            className="absolute right-4 bottom-4 left-4 mx-auto max-w-sm rounded-4xl py-6"
          >
            {children}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <form
            onSubmit={e => {
              e.preventDefault()
              if (!validInputs) return
              onAddCheckin({ createdAt, weight, fat, waist })
              setWeight(undefined)
              setFat(undefined)
              setWaist(undefined)
            }}
          >
            <DrawerHeader className="pb-2">
              <DrawerTitle>
                {mode === "add" ? "Record" : "Edit"} measurements
              </DrawerTitle>
              <DrawerDescription>Track those gains 💪</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-3 p-4">
              <div>
                <Label htmlFor="date" className="text-sm">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={createdAt.toISOString().split("T")[0]}
                  onChange={e => {
                    if (e.target.value) setCreatedAt(new Date(e.target.value))
                  }}
                />
              </div>

              <div
                className={
                  lastCheckin
                    ? "grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1"
                    : "pb-2"
                }
              >
                <Label htmlFor="weight" className="text-sm">
                  Weight (kg)
                </Label>
                {lastCheckin && (
                  <Label className="text-muted-foreground text-sm">
                    Previous
                  </Label>
                )}

                <Input
                  ref={weightInputRef}
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight || ""}
                  onChange={e =>
                    setWeight(Number.parseFloat(e.target.value) || undefined)
                  }
                  aria-label={
                    lastCheckin
                      ? `Weight in kilograms, previous value was ${lastCheckin.weight}`
                      : "Weight in kilograms"
                  }
                  className="h-9"
                  autoFocus
                />
                {lastCheckin && (
                  <Input
                    value={formatPreviousValue(weight, lastCheckin.weight)}
                    readOnly
                    tabIndex={-1}
                    aria-label="Previous weight"
                    // Use onMouseDown instead of onClick to prevent focus from leaving the
                    // current input field. This keeps the virtual keyboard visible on mobile
                    // devices when tapping to copy previous values.
                    onMouseDown={e => {
                      e.preventDefault()
                      setWeight(lastCheckin.weight)
                      weightInputRef.current?.focus()
                    }}
                    className="bg-muted hover:bg-muted/80 h-9 w-20 cursor-pointer text-sm"
                  />
                )}
              </div>

              <div
                className={
                  lastCheckin
                    ? "grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1"
                    : "pb-2"
                }
              >
                <Label htmlFor="fat" className="text-sm">
                  Fat (%)
                </Label>
                {lastCheckin && (
                  <Label className="text-muted-foreground text-sm">
                    Previous
                  </Label>
                )}

                <Input
                  ref={fatInputRef}
                  id="fat"
                  type="number"
                  step="0.1"
                  value={fat || ""}
                  onChange={e =>
                    setFat(Number.parseFloat(e.target.value) || undefined)
                  }
                  aria-label={
                    lastCheckin
                      ? `Fat, previous value was ${lastCheckin.fat}`
                      : "Fat"
                  }
                  className="h-9"
                />
                {lastCheckin && (
                  <Input
                    value={formatPreviousValue(fat, lastCheckin.fat)}
                    readOnly
                    tabIndex={-1}
                    aria-label="Previous fat"
                    // Use onMouseDown instead of onClick to prevent focus from leaving the
                    // current input field. This keeps the virtual keyboard visible on mobile
                    // devices when tapping to copy previous values.
                    onMouseDown={e => {
                      e.preventDefault()
                      setFat(lastCheckin.fat)
                      fatInputRef.current?.focus()
                    }}
                    className="bg-muted hover:bg-muted/80 h-9 w-20 cursor-pointer text-sm"
                  />
                )}
              </div>

              <div
                className={
                  lastCheckin
                    ? "grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1"
                    : "pb-2"
                }
              >
                <Label htmlFor="waist" className="text-sm">
                  Waist (cm)
                </Label>
                {lastCheckin && (
                  <Label className="text-muted-foreground text-sm">
                    Previous
                  </Label>
                )}

                <Input
                  ref={waistInputRef}
                  id="waist"
                  type="number"
                  step="0.1"
                  value={waist || ""}
                  onChange={e =>
                    setWaist(Number.parseFloat(e.target.value) || undefined)
                  }
                  aria-label={
                    lastCheckin
                      ? `Waist in centimeters, previous value was ${lastCheckin.waist}`
                      : "Wait in centimeters"
                  }
                  className="h-9"
                />
                {lastCheckin && (
                  <Input
                    value={formatPreviousValue(waist, lastCheckin.waist)}
                    readOnly
                    tabIndex={-1}
                    aria-label="Previous waist"
                    // Use onMouseDown instead of onClick to prevent focus from leaving the
                    // current input field. This keeps the virtual keyboard visible on mobile
                    // devices when tapping to copy previous values.
                    onMouseDown={e => {
                      e.preventDefault()
                      setWaist(lastCheckin.waist)
                      waistInputRef.current?.focus()
                    }}
                    className="bg-muted hover:bg-muted/80 h-9 w-20 cursor-pointer text-sm"
                  />
                )}
              </div>
            </div>
            <DrawerFooter className="pt-2">
              <Button disabled={loading || !validInputs}>Save</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default BodyMetricsDialog
