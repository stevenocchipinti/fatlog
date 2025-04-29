import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { enAU } from "date-fns/locale"
import { Edit, LogIn, LogOut, MoreVertical, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import type { BodyMetricDataPoint, TimeScaleOption } from "../types"

import { BodyMetricsChart } from "@/components/BodyMetricsChart"
import TimePeriodSwitcher from "@/components/TimePeriodSwitcher"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import sampleData from "@/sampleData"

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
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const { user, login, logout } = useAuth()

  const [chartData] = useState<BodyMetricDataPoint[]>(sampleData)

  const [selectedTimeScale, setSelectedTimeScale] =
    useState<TimeScaleOption>("6M")

  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    fat: true,
    waist: true,
  })

  const [selectedPoint, setSelectedPoint] =
    useState<BodyMetricDataPoint | null>(null)

  useEffect(() => {
    console.log("Selected point:", selectedPoint)
  }, [selectedPoint])

  const [_selectedPointInfo, setSelectedPointInfo] = useState<string | null>(
    null,
  )

  const [date, setDate] = useState<Date>(new Date())
  const [weight, setWeight] = useState<number>(74.2)
  const [fatPercentage, setFatPercentage] = useState<number>(17.8)
  const [waistMeasurement, setWaistMeasurement] = useState<number>(81.5)

  // Previous measurements for reference
  const previousData: Record<string, any> = {
    date: new Date(2023, 3, 15),
    weight: 75.5,
    fatPercentage: 18.2,
    waistMeasurement: 82.3,
  }

  const handlePointSelect = useCallback(
    (dataPoint: BodyMetricDataPoint | null) => {
      if (dataPoint) {
        const formattedDate = format(dataPoint.createdAt, "PPP p", {
          locale: enAU,
        })
        const infoLines = [
          `Selected: ${formattedDate}`,
          dataPoint.weight !== undefined
            ? `  Weight: ${dataPoint.weight} kg`
            : null,
          dataPoint.fat !== undefined ? `  Fat: ${dataPoint.fat}%` : null,
          dataPoint.waist !== undefined
            ? `  Waist: ${dataPoint.waist} cm`
            : null,
        ]

        // Filter out null lines (where data was missing) and join with newlines
        setSelectedPoint(dataPoint)
        setSelectedPointInfo(infoLines.filter(Boolean).join("\n"))
      } else {
        // If null is received (clicked outside points), clear the info display
        setSelectedPoint(null)
        setSelectedPointInfo(null)
      }
    },
    [],
  )

  const tableDateFormat = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0")
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const year = d.getFullYear()

    return (
      <div className="flex flex-col">
        <span>
          {day}/{month}
        </span>
        <span className="text-muted-foreground text-xs">{year}</span>
      </div>
    )
  }
  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  return (
    <div className="flex h-dvh flex-col gap-4">
      <header className="grid grid-cols-[4rem_1fr_4rem] place-items-center">
        <span />
        <h1 className="m-4 text-center text-3xl font-extrabold text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            Fatlog
          </span>
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar>
                {user?.photoURL && <AvatarImage src={user.photoURL} />}
                {user?.displayName && (
                  <AvatarFallback>{user.displayName[0] || "✅"}</AvatarFallback>
                )}
                {!user && <AvatarFallback>⨯</AvatarFallback>}
              </Avatar>
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2">{user ? "Logged in" : "Logged out"}</div>
            <DropdownMenuItem
              onClick={() => login()}
              className="flex cursor-pointer items-center"
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span>Login</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex cursor-pointer items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {chartData.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          No data available to display the chart.
        </p>
      ) : (
        <>
          <BodyMetricsChart
            data={chartData}
            timeScale={selectedTimeScale}
            visibleLines={visibleLines}
            onPointSelect={handlePointSelect}
            className="px-2"
          />
          <TimePeriodSwitcher
            defaultValue={selectedTimeScale}
            onChange={value => setSelectedTimeScale(value)}
          />
          <Card className="container mx-auto flex flex-1 flex-col gap-0 overflow-hidden rounded-b-none">
            <Table className="mt-[-2px] border-separate border-spacing-0 pb-16">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 px-4 font-semibold text-(--chart-1)"
                      onClick={() => toggleLine("weight")}
                    >
                      Weight
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 px-4 font-semibold text-(--chart-2)"
                      onClick={() => toggleLine("fat")}
                    >
                      Fat
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 px-4 font-semibold text-(--chart-3)"
                      onClick={() => toggleLine("waist")}
                    >
                      Waist
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map(entry => (
                  <TableRow key={entry.createdAt.toISOString()}>
                    <TableCell>{tableDateFormat(entry.createdAt)}</TableCell>
                    <TableCell>
                      {entry.weight?.toFixed(1)}
                      <span className="text-muted-foreground pl-0.5 text-xs">
                        kg
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.fat?.toFixed(1)}
                      <span className="text-muted-foreground text-xs">%</span>
                    </TableCell>
                    <TableCell>
                      {entry.waist?.toFixed(1)}
                      <span className="text-muted-foreground pl-0.5 text-xs">
                        cm
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex cursor-pointer items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive flex cursor-pointer items-center">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Drawer>
            <DrawerTrigger asChild>
              <Button className="absolute right-4 bottom-4 left-4 mx-auto max-w-sm rounded-4xl py-6 opacity-95">
                Record Measurements
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
                    <Label className="text-muted-foreground text-sm">
                      Previous
                    </Label>

                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={e =>
                        setWeight(Number.parseFloat(e.target.value))
                      }
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
                    <Label className="text-muted-foreground text-sm">
                      Previous
                    </Label>

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
                    <Label className="text-muted-foreground text-sm">
                      Previous
                    </Label>

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
        </>
      )}
    </div>
  )
}
