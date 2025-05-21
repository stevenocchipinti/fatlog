import { Edit, MoreVertical, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"
import type { BodyMetricDataPoint, BodyMetrics } from "@/types"

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

type BodyMetricsTableProps = {
  data: BodyMetricDataPoint[]
  selectedPoint: BodyMetricDataPoint | null
  toggleLine: (line: keyof BodyMetrics) => void
  onRowSelect: (point: BodyMetricDataPoint | null) => void
  onRowDelete: (point: BodyMetricDataPoint) => void
}
const BodyMetricsTable = ({
  data,
  selectedPoint,
  toggleLine,
  onRowSelect,
  onRowDelete,
}: BodyMetricsTableProps) => {
  const tableRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    tableRef.current?.querySelector("tr[aria-selected=true]")?.scrollIntoView({
      behavior: "smooth",
    })
  }, [selectedPoint])

  return (
    <Card className="container mx-auto flex flex-1 flex-col gap-0 overflow-hidden rounded-b-none">
      <Table
        ref={tableRef}
        className="mt-[-2px] border-separate border-spacing-0 pb-16"
      >
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
          {data
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(entry => (
              <TableRow
                key={entry.id}
                className={`hover:bg-muted cursor-pointer transition-colors ${
                  selectedPoint?.createdAt === entry.createdAt
                    ? "bg-muted"
                    : "bg-transparent"
                }`}
                aria-selected={selectedPoint?.createdAt === entry.createdAt}
                onClick={() => {
                  onRowSelect(entry)
                }}
              >
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
                      <pre>{entry.id}</pre>
                      <DropdownMenuItem className="flex cursor-pointer items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          onRowDelete(entry)
                        }}
                        className="text-destructive flex cursor-pointer items-center"
                      >
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
  )
}

export default BodyMetricsTable
