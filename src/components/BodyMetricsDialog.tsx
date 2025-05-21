import { useState } from "react"
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
import { useCheckins } from "@/lib/firebase"

type BodyMetricsDialogProps = {
  children: React.ReactNode
}
const BodyMetricsDialog = ({ children }: BodyMetricsDialogProps) => {
  const [createdAt, setCreatedAt] = useState<Date>(new Date())
  const [weight, setWeight] = useState<number>(74.2)
  const [fat, setFat] = useState<number>(17.8)
  const [waist, setWaist] = useState<number>(81.5)

  const [open, setOpen] = useState(false)

  const { addCheckin } = useCheckins()

  // TODO: Previous measurements for reference
  const previousData: Record<string, any> = {
    date: new Date(2023, 3, 15),
    weight: 75.5,
    fat: 18.2,
    waist: 82.3,
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button className="absolute right-4 bottom-4 left-4 mx-auto max-w-sm rounded-4xl py-6 opacity-95">
          {children}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <form
            onSubmit={e => {
              e.preventDefault()
              addCheckin({
                createdAt,
                weight,
                fat,
                waist,
              })
              setOpen(false)
            }}
          >
            <DrawerHeader className="pb-2">
              <DrawerTitle>Body Measurements</DrawerTitle>
              <DrawerDescription>
                Record your measurements for tracking progress.
              </DrawerDescription>
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
                  onChange={e => setCreatedAt(new Date(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                <Label htmlFor="weight" className="text-sm">
                  Weight (kg)
                </Label>
                <Label className="text-muted-foreground text-sm">
                  Previous
                </Label>

                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(Number.parseFloat(e.target.value))}
                  aria-label={`Weight in kilograms, previous value was ${previousData.weight}`}
                  className="h-9"
                />
                <Input
                  value={previousData.weight}
                  readOnly
                  tabIndex={-1}
                  aria-label="Previous weight"
                  className="bg-muted h-9 w-20 text-sm"
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                <Label htmlFor="fat" className="text-sm">
                  Fat (%)
                </Label>
                <Label className="text-muted-foreground text-sm">
                  Previous
                </Label>

                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={e => setFat(Number.parseFloat(e.target.value))}
                  aria-label={`Fat, previous value was ${previousData.fat}`}
                  className="h-9"
                />
                <Input
                  value={previousData.fat}
                  readOnly
                  tabIndex={-1}
                  aria-label="Previous fat"
                  className="bg-muted h-9 w-20 text-sm"
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
                <Label htmlFor="waist" className="text-sm">
                  Waist (cm)
                </Label>
                <Label className="text-muted-foreground text-sm">
                  Previous
                </Label>

                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={e => setWaist(Number.parseFloat(e.target.value))}
                  aria-label={`Waist in centimeters, previous value was ${previousData.waist}`}
                  className="h-9"
                />
                <Input
                  value={previousData.waist}
                  readOnly
                  tabIndex={-1}
                  aria-label="Previous waist"
                  className="bg-muted h-9 w-20 text-sm"
                />
              </div>
            </div>
            <DrawerFooter className="pt-2">
              <Button>Save</Button>
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
