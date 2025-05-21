import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { enAU } from "date-fns/locale"
import { useCallback, useEffect, useState } from "react"

import type { BodyMetricDataPoint, TimeScaleOption } from "../types"

import { BodyMetricsChart } from "@/components/BodyMetricsChart"
import TimePeriodSwitcher from "@/components/TimePeriodSwitcher"
import BodyMetricsDialog from "@/components/BodyMetricsDialog"
import BodyMetricsTable from "@/components/BodyMetricsTable"

import { useCheckins } from "@/lib/firebase"

export const Route = createFileRoute("/_auth/metrics")({
  component: App,
})

function App() {
  const { checkins: chartData, deleteCheckin } = useCheckins()

  const [selectedTimeScale, setSelectedTimeScale] =
    useState<TimeScaleOption>("6M")

  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    fat: true,
    waist: true,
  })

  const [selectedPoint, setSelectedPoint] =
    useState<BodyMetricDataPoint | null>(null)

  useEffect(() => {}, [selectedPoint])

  const [_selectedPointInfo, setSelectedPointInfo] = useState<string | null>(
    null,
  )

  const handlePointSelect = useCallback(
    (dataPoint: BodyMetricDataPoint | null) => {
      console.log("Select point:", dataPoint)
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

  const handlePointDelete = (dataPoint: BodyMetricDataPoint) => {
    deleteCheckin(dataPoint.id)
  }

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  return (
    <>
      <BodyMetricsChart
        data={chartData}
        timeScale={selectedTimeScale}
        visibleLines={visibleLines}
        onPointSelect={point => {
          handlePointSelect(point)
        }}
        className="px-2"
      />

      <TimePeriodSwitcher
        defaultValue={selectedTimeScale}
        onChange={value => setSelectedTimeScale(value)}
      />

      <BodyMetricsTable
        data={chartData}
        selectedPoint={selectedPoint}
        toggleLine={toggleLine}
        onRowSelect={point => {
          handlePointSelect(point)
        }}
        onRowDelete={point => {
          handlePointDelete(point)
        }}
      />

      <BodyMetricsDialog>Record Measurements</BodyMetricsDialog>
    </>
  )
}
