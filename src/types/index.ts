export type NewBodyMetricDataPoint = {
  createdAt: Date
} & BodyMetrics

export type BodyMetricDataPoint = {
  id: string
  createdAt: Date
} & BodyMetrics

export type BodyMetrics = {
  weight?: number
  fat?: number
  waist?: number
}

export type TimeScaleOption = "1M" | "3M" | "6M" | "1Y" | "ALL"
