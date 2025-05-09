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

type BodyMetricsDialogProps = {
  children: React.ReactNode
}
const BodyMetricsDialog = ({ children }: BodyMetricsDialogProps) => {
  const [date, setDate] = useState<Date>(new Date())
  const [weight, setWeight] = useState<number>(74.2)
  const [fatPercentage, setFatPercentage] = useState<number>(17.8)
  const [waistMeasurement, setWaistMeasurement] = useState<number>(81.5)

  // TODO: Previous measurements for reference
  const previousData: Record<string, any> = {
    date: new Date(2023, 3, 15),
    weight: 75.5,
    fatPercentage: 18.2,
    waistMeasurement: 82.3,
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="absolute right-4 bottom-4 left-4 mx-auto max-w-sm rounded-4xl py-6 opacity-95">
          {children}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
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
                value={date.toISOString().split("T")[0]}
                onChange={e => setDate(new Date(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
              <Label htmlFor="weight" className="text-sm">
                Weight (kg)
              </Label>
              <Label className="text-muted-foreground text-sm">Previous</Label>

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
                Fat Percentage (%)
              </Label>
              <Label className="text-muted-foreground text-sm">Previous</Label>

              <Input
                id="fat"
                type="number"
                step="0.1"
                value={fatPercentage}
                onChange={e =>
                  setFatPercentage(Number.parseFloat(e.target.value))
                }
                aria-label={`Fat percentage, previous value was ${previousData.fatPercentage}`}
                className="h-9"
              />
              <Input
                value={previousData.fatPercentage}
                readOnly
                tabIndex={-1}
                aria-label="Previous fat percentage"
                className="bg-muted h-9 w-20 text-sm"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
              <Label htmlFor="waist" className="text-sm">
                Waist (cm)
              </Label>
              <Label className="text-muted-foreground text-sm">Previous</Label>

              <Input
                id="waist"
                type="number"
                step="0.1"
                value={waistMeasurement}
                onChange={e =>
                  setWaistMeasurement(Number.parseFloat(e.target.value))
                }
                aria-label={`Waist measurement in centimeters, previous value was ${previousData.waistMeasurement}`}
                className="h-9"
              />
              <Input
                value={previousData.waistMeasurement}
                readOnly
                tabIndex={-1}
                aria-label="Previous waist measurement"
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
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default BodyMetricsDialog
