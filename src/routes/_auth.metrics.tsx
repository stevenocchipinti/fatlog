import { createFileRoute } from "@tanstack/react-router"
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
  const { checkins, state, deleteCheckin } = useCheckins()
  const loading = state !== "LOADED"

  const [selectedTimeScale, setSelectedTimeScale] =
    useState<TimeScaleOption>("6M")

  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    fat: true,
    waist: true,
  })

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [checkinToEdit, setCheckinToEdit] = useState<
    BodyMetricDataPoint | undefined
  >(undefined)
  const { addCheckin, updateCheckin } = useCheckins()

  const [selectedPoint, setSelectedPoint] =
    useState<BodyMetricDataPoint | null>(null)
  useEffect(() => {}, [selectedPoint])

  const handlePointSelect = useCallback(
    (dataPoint: BodyMetricDataPoint | null) => {
      console.log("Select point:", dataPoint)
      if (dataPoint) {
        setSelectedPoint(dataPoint)
      } else {
        setSelectedPoint(null)
      }
    },
    [],
  )

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  // TODO: Some of these components get their own data using the hook and others
  // get it passed it, this should probably be consistent
  return (
    <>
      <BodyMetricsChart
        loading={loading}
        data={checkins}
        timeScale={selectedTimeScale}
        visibleLines={visibleLines}
        onPointSelect={point => {
          handlePointSelect(point)
        }}
        className="px-2"
      />

      <TimePeriodSwitcher
        value={selectedTimeScale}
        onChange={value => setSelectedTimeScale(value)}
      />

      <BodyMetricsTable
        loading={loading}
        data={checkins}
        selectedPoint={selectedPoint}
        toggleLine={toggleLine}
        onRowSelect={point => {
          handlePointSelect(point)
        }}
        onRowDelete={point => {
          deleteCheckin(point.id)
        }}
        onRowEdit={point => {
          setCheckinToEdit(point)
          setEditDialogOpen(true)
        }}
      />

      <BodyMetricsDialog
        mode="add"
        open={addDialogOpen}
        onOpenChange={isOpen => {
          setAddDialogOpen(isOpen)
          if (!isOpen) setCheckinToEdit(undefined)
        }}
        loading={loading}
        lastCheckin={checkins[0] || undefined}
        onSubmit={({ createdAt, weight, fat, waist }) => {
          addCheckin({
            createdAt,
            weight,
            fat,
            waist,
          })
          setAddDialogOpen(false)
        }}
      >
        Record Measurements
      </BodyMetricsDialog>

      <BodyMetricsDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        loading={loading}
        editingCheckin={checkinToEdit}
        onSubmit={({ createdAt, weight, fat, waist }) => {
          if (!checkinToEdit) return
          updateCheckin(checkinToEdit.id, {
            createdAt,
            weight,
            fat,
            waist,
          })
          setEditDialogOpen(false)
          setCheckinToEdit(undefined)
        }}
      />
    </>
  )
}
