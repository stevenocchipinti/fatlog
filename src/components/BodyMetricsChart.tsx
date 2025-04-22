import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js'

import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import { enAU } from 'date-fns/locale'
import {
  endOfDay,
  max as maxDate,
  startOfDay,
  subMonths,
  subYears,
} from 'date-fns'
import zoomPlugin from 'chartjs-plugin-zoom'

import type {
  ActiveElement,
  ChartData,
  ChartEvent,
  ChartOptions, // Use the base ChartOptions
  FontSpec,
  InteractionOptions,
  LegendOptions,
  LinearScaleOptions,
  PluginOptionsByType,
  TimeScaleOptions,
  TooltipOptions,
} from 'chart.js'

import type { BodyMetricDataPoint, TimeScaleOption } from '../types'

interface ZoomPluginOptions {
  pan?: {
    enabled?: boolean
    mode?: 'x' | 'y' | 'xy'
    threshold?: number
    modifierKey?: 'ctrl' | 'alt' | 'shift' | 'meta' | null
  }
  zoom?: {
    wheel?: {
      enabled?: boolean
      speed?: number
      modifierKey?: 'ctrl' | 'alt' | 'shift' | 'meta' | null
    }
    drag?: { enabled?: boolean }
    pinch?: { enabled?: boolean }
    mode?: 'x' | 'y' | 'xy'
    enabled?: boolean
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin,
)

interface VisibleLines {
  weight: boolean
  fat: boolean
  waist: boolean
}
interface BodyMetricsChartProps {
  data: BodyMetricDataPoint[]
  timeScale?: TimeScaleOption
  visibleLines?: VisibleLines
  onPointSelect?: (dataPoint: BodyMetricDataPoint | null) => void
  className?: string
}

const styles = getComputedStyle(document.documentElement)
const chart1 = styles.getPropertyValue('--chart-1')
const chart2 = styles.getPropertyValue('--chart-2')
const chart3 = styles.getPropertyValue('--chart-3')

const COLORS = {
  weight: chart1,
  fat: chart2,
  waist: chart3,
}

type BodyMetricsChartOptionsType = ChartOptions<'line'> & {
  plugins?: PluginOptionsByType<'line'> & {
    zoom?: ZoomPluginOptions
    legend?: Partial<LegendOptions<'line'>>
    tooltip?: Partial<TooltipOptions<'line'>>
  }
  scales?: {
    x?: TimeScaleOptions
    yWeight?: LinearScaleOptions
    yFat?: LinearScaleOptions
    yWaist?: LinearScaleOptions
    // Allow other scales potentially added by plugins or future changes
    [key: string]: any // Allow additional scale definitions if necessary
  }
  interaction?: Partial<InteractionOptions>
}

export const BodyMetricsChart: React.FC<BodyMetricsChartProps> = ({
  data,
  timeScale = 'ALL',
  visibleLines = { weight: true, fat: true, waist: true },
  onPointSelect,
  className = '',
}) => {
  const chartRef = useRef<ChartJS<
    'line',
    { x: number; y: number | null }[],
    number
  > | null>(null)
  const [selectedDataPoint, setSelectedDataPoint] =
    useState<BodyMetricDataPoint | null>(null)
  const [sortedData, setSortedData] = useState<BodyMetricDataPoint[]>([])

  useEffect(() => {
    const newSortedData = [...data].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )

    setSortedData(newSortedData)
    setSelectedDataPoint(null)
    onPointSelect?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // TODO: Work out if I want this or not.
  // When it is used, the graph does not use the vertical space very well
  // becaues of some more extreme points that are out of view.
  // When it is not used, there are some lines that go from visible points out
  // of bounds to invisible points (outside of the currently zoomed area)
  //
  // const globalMinMax = useMemo(() => {
  //   const minMax = {
  //     weight: { min: Infinity, max: -Infinity },
  //     fat: { min: Infinity, max: -Infinity },
  //     waist: { min: Infinity, max: -Infinity },
  //   }
  //
  //   data.forEach((point) => {
  //     if (point.weight !== undefined) {
  //       minMax.weight.min = Math.min(minMax.weight.min, point.weight)
  //       minMax.weight.max = Math.max(minMax.weight.max, point.weight)
  //     }
  //     if (point.fat !== undefined) {
  //       minMax.fat.min = Math.min(minMax.fat.min, point.fat)
  //       minMax.fat.max = Math.max(minMax.fat.max, point.fat)
  //     }
  //     if (point.waist !== undefined) {
  //       minMax.waist.min = Math.min(minMax.waist.min, point.waist)
  //       minMax.waist.max = Math.max(minMax.waist.max, point.waist)
  //     }
  //   })
  //
  //   return minMax
  // }, [data])

  const { chartData, chartOptions } = useMemo(() => {
    if (sortedData.length === 0) {
      const emptyChartData: ChartData<
        'line',
        { x: number; y: number | null }[],
        number
      > = { datasets: [] }
      const emptyChartOptions = {} as BodyMetricsChartOptionsType

      return { chartData: emptyChartData, chartOptions: emptyChartOptions }
    }

    const selectedIndex = selectedDataPoint
      ? sortedData.findIndex(
          (p) =>
            p.createdAt.getTime() === selectedDataPoint.createdAt.getTime(),
        )
      : -1

    let minTs: number | undefined = undefined
    let maxTs: number | undefined = undefined
    const lastDataPointDate = sortedData[sortedData.length - 1]?.createdAt
    const firstDataPointDate = sortedData[0]?.createdAt

    if (timeScale !== 'ALL') {
      const endDate = endOfDay(lastDataPointDate)

      maxTs = endDate.getTime()
      let startDate: Date

      switch (timeScale) {
        case '1M':
          startDate = subMonths(endDate, 1)
          break
        case '3M':
          startDate = subMonths(endDate, 3)
          break
        case '6M':
          startDate = subMonths(endDate, 6)
          break
        case '1Y':
          startDate = subYears(endDate, 1)
          break
        default:
          startDate = firstDataPointDate
      }
      minTs = maxDate([
        startOfDay(startDate),
        startOfDay(firstDataPointDate),
      ]).getTime()
    } else {
      minTs = startOfDay(firstDataPointDate).getTime()
      maxTs = endOfDay(lastDataPointDate).getTime()
    }

    let timeUnit: 'day' | 'week' | 'month' | 'year' = 'day'

    if (minTs && maxTs) {
      const visibleDurationMs = maxTs - minTs
      const visibleDays = visibleDurationMs / (1000 * 60 * 60 * 24)

      if (visibleDays > 730) timeUnit = 'year'
      else if (visibleDays > 180) timeUnit = 'month'
      else if (visibleDays > 30) timeUnit = 'week'
      else timeUnit = 'day'
    }

    const createDataset = (
      key: keyof VisibleLines,
      label: string,
      yAxisID: string,
      color: string,
      dataExtractor: (p: BodyMetricDataPoint) => number | undefined | null,
    ) => {
      if (!visibleLines[key]) return null
      const pointRadius =
        sortedData.length > 100 && timeScale === 'ALL'
          ? 1
          : sortedData.length > 50
            ? 2
            : 4

      return {
        label: label,
        data: sortedData.map((point) => ({
          x: point.createdAt.getTime(),
          y: dataExtractor(point) ?? null,
        })),
        borderColor: color,
        backgroundColor: color,
        tension: 0.1,
        pointRadius: pointRadius,
        pointHoverRadius: pointRadius + 2,
        yAxisID: yAxisID,
        borderWidth: 2,
        spanGaps: true,
        parsing: false,
      }
    }
    const datasets = [
      createDataset(
        'weight',
        'Weight (kg)',
        'yWeight',
        COLORS.weight,
        (p) => p.weight,
      ),
      createDataset('fat', 'Fat %', 'yFat', COLORS.fat, (p) => p.fat),
      createDataset(
        'waist',
        'Waist (cm)',
        'yWaist',
        COLORS.waist,
        (p) => p.waist,
      ),
    ].filter(Boolean)

    const chartDataConfig: ChartData<
      'line',
      { x: number; y: number | null }[],
      number
    > = {
      datasets: datasets as ChartData<
        'line',
        { x: number; y: number | null }[],
        number
      >['datasets'],
    }

    const chartOptionsConfig: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
        axis: 'x',
        includeInvisible: false,
      },
      scales: {
        x: {
          type: 'time',
          min: minTs,
          max: maxTs,
          time: {
            unit: timeUnit,
            tooltipFormat: 'PPpp',
            displayFormats: {
              day: 'd MMM',
              week: 'd MMM yyyy',
              month: 'MMM yyyy',
              year: 'yyyy',
            },
            parser: undefined,
            round: 'day',
            isoWeekday: false,
            minUnit: 'millisecond',
          },
          title: {
            display: false,
            text: 'Date',
            align: 'center',
            color: undefined,
            font: {} as FontSpec,
            padding: 0,
          },
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 15,
            maxTicksLimit: timeScale === '1M' ? 12 : 15,
            display: true,
            callback: (value) => {
              const date = new Date(value as number)

              return date.toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year:
                  timeScale === 'ALL' || timeScale === '1Y'
                    ? 'numeric'
                    : undefined,
              })
            },
            color: undefined,
            font: {} as FontSpec,
            major: {},
            padding: 3,
            stepSize: undefined,
          },
          adapters: { date: { locale: enAU } },
        },
        ...(visibleLines.weight && {
          yWeight: {
            display: false,
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Weight (kg)',
              font: { size: 10 },
              color: COLORS.weight,
              align: 'center',
              padding: 0,
            },
            grid: { display: false },
            ticks: { maxTicksLimit: 5, color: COLORS.weight },
            // min: globalMinMax.weight.min,
            // max: globalMinMax.weight.max,
          },
        }),
        ...(visibleLines.fat && {
          yFat: {
            display: false,
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Fat %',
              font: { size: 10 },
              color: COLORS.fat,
              align: 'center',
              padding: 0,
            },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value: number | string) => `${value}%`,
              maxTicksLimit: 5,
              color: COLORS.fat,
            },
            // min: globalMinMax.fat.min,
            // max: globalMinMax.fat.max,
          },
        }),
        ...(visibleLines.waist && {
          yWaist: {
            display: false,
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Waist (cm)',
              font: { size: 10 },
              color: COLORS.waist,
              align: 'center',
              padding: 0,
            },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (value: number | string) => `${value} cm`,
              maxTicksLimit: 5,
              color: COLORS.waist,
            },
            // min: globalMinMax.waist.min,
            // max: globalMinMax.waist.max,
          },
        }),
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        zoom: {
          pan: { enabled: true, mode: 'x', threshold: 5 },
          zoom: {
            wheel: { enabled: false, speed: 0.1 },
            drag: { enabled: false },
            pinch: { enabled: false },
            mode: 'x',
          },
        },
      },
      onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
        if (!onPointSelect) return
        const chart = chartRef.current

        if (elements.length > 0 && chart) {
          const { index } = elements[0]
          const clickedDataPoint = sortedData[index]

          if (
            selectedDataPoint?.createdAt.getTime() !==
            clickedDataPoint.createdAt.getTime()
          ) {
            setSelectedDataPoint(clickedDataPoint)
            onPointSelect(clickedDataPoint)

            // Preserve the current visible range of the x-axis
            const xScale = chart.scales.x
            const currentMin = xScale.min
            const currentMax = xScale.max

            chart.options.scales!.x!.min = currentMin
            chart.options.scales!.x!.max = currentMax
            chart.update('none')
          }
        } else if (selectedDataPoint) {
          setSelectedDataPoint(null)
          onPointSelect(null)
        }
      },
      animation: {
        duration: 500,
        easing: 'easeOutQuad',
      },
    }

    return { chartData: chartDataConfig, chartOptions: chartOptionsConfig }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedData, timeScale, visibleLines, selectedDataPoint])

  return (
    <div className={`relative ${className} min-h-48`}>
      {chartData.datasets.length > 0 && (
        <Line ref={chartRef} data={chartData} options={chartOptions as any} />
      )}
    </div>
  )
}
