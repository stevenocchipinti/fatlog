export interface BodyMetricDataPoint {
  createdAt: Date
  // These are optional in case data is missing for a specific date
  weight?: number
  fat?: number
  waist?: number
}

export type TimeScaleOption = '1M' | '3M' | '6M' | '1Y' | 'ALL'
