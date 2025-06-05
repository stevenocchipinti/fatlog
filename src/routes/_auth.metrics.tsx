import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

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

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line],
    }))
  }

  return (
    <>
      <BodyMetricsChart
        data={checkins}
        loading={loading}
        timeScale={selectedTimeScale}
        visibleLines={visibleLines}
        selectedPoint={selectedPoint}
        onPointSelect={point => {
          setSelectedPoint(point)
        }}
        className="px-2"
      />

      <TimePeriodSwitcher
        value={selectedTimeScale}
        onChange={value => setSelectedTimeScale(value)}
      />

      <BodyMetricsTable
        data={checkins}
        loading={loading}
        selectedPoint={selectedPoint}
        toggleLine={toggleLine}
        onRowSelect={point => {
          setSelectedPoint(point)
        }}
        onRowDelete={point => {
          const confirmDelete = window.confirm(
            "Are you sure you want to delete this check-in?",
          )
          if (confirmDelete) deleteCheckin(point.id)
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
        Record measurements
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
