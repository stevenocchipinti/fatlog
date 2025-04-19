import { createFileRoute } from '@tanstack/react-router'

import { useCallback, useState } from 'react'
import { format } from 'date-fns'
import { enAU } from 'date-fns/locale'

import type { BodyMetricDataPoint, TimeScaleOption } from '../types'
import { BodyMetricsChart } from '@/components/BodyMetricsChart'
import sampleData from '@/sampleData'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [chartData] = useState<Array<BodyMetricDataPoint>>(sampleData)

  const [selectedTimeScale, setSelectedTimeScale] =
    useState<TimeScaleOption>('3M')

  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    fat: true,
    waist: true,
  })

  const [selectedPoint, setSelectedPoint] =
    useState<BodyMetricDataPoint | null>(null)

  const [_selectedPointInfo, setSelectedPointInfo] = useState<string | null>(
    null,
  )

  const handlePointSelect = useCallback(
    (dataPoint: BodyMetricDataPoint | null) => {
      if (dataPoint) {
        const formattedDate = format(dataPoint.createdAt, 'PPP p', {
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
        setSelectedPointInfo(infoLines.filter(Boolean).join('\n'))
      } else {
        // If null is received (clicked outside points), clear the info display
        setSelectedPoint(null)
        setSelectedPointInfo(null)
      }
    },
    [],
  )

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  return (
    <div>
      {chartData.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          No data available to display the chart.
        </p>
      ) : (
        <>
          <BodyMetricsChart
            data={chartData}
            timeScale={selectedTimeScale}
            visibleLines={visibleLines}
            onPointSelect={handlePointSelect}
          />
        </>
      )}
    </div>
  )
}
