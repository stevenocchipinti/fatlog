import type { DietException, DietRule, FoodGroup, LocalDate } from "@/types"

import {
  buildTimelineRows,
  gapLabel,
  ruleActiveOn,
  ruleStintLabel,
  todayLocalDate,
} from "@/components/diet/timeline"
import { fromLocalDate } from "@/lib/localDate"
import { cn } from "@/lib/utils"

type DietTimelineProps = {
  foodGroups: FoodGroup[]
  rules: DietRule[]
  exceptions: DietException[]
  /** Open the drawer preselecting a food group column. */
  onSelectFoodGroup: (foodGroupId: string) => void
  /** Open the drawer preselecting a food group and date cell. */
  onSelectCell: (foodGroupId: string, date: LocalDate) => void
  /** Open an existing exception for editing. */
  onSelectException: (exception: DietException) => void
  /** Open an existing rule for editing. */
  onSelectRule: (rule: DietRule) => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})
const yearFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric" })

/**
 * Compact diet timeline: dates as rows (newest first), active food groups as
 * emoji-only columns.
 *
 * A diet rule renders as a continuous vertical lane across its active range,
 * continuing through collapsed gap rows and open-ended through Today. A diet
 * exception renders as a dot on its food group/date cell, which may sit on top
 * of a rule lane (a notable observation within the rule) or stand alone.
 */
export default function DietTimeline({
  foodGroups,
  rules,
  exceptions,
  onSelectFoodGroup,
  onSelectCell,
  onSelectException,
  onSelectRule,
}: DietTimelineProps) {
  const columns = foodGroups
    .filter(g => !g.archived)
    .sort((a, b) => a.order - b.order)

  const visibleGroupIds = new Set(columns.map(group => group.id))
  const visibleRules = rules.filter(rule =>
    visibleGroupIds.has(rule.foodGroupId),
  )
  const visibleExceptions = exceptions.filter(exception =>
    visibleGroupIds.has(exception.foodGroupId),
  )
  const rows = buildTimelineRows(visibleRules, visibleExceptions)
  const today = todayLocalDate()

  if (columns.length === 0) {
    return (
      <div className="text-muted-foreground mx-auto max-w-sm px-6 py-16 text-center text-sm">
        No food groups yet. Tap the + button to record a diet change and add
        your first food group.
      </div>
    )
  }

  // A single column-template shared by the header and every row so lanes stay
  // aligned. Horizontal scroll only kicks in when columns exceed the width.
  const gridStyle = {
    gridTemplateColumns: `4.5rem repeat(${columns.length}, minmax(3rem, 1fr))`,
  }

  const exceptionAt = (foodGroupId: string, date: LocalDate) =>
    visibleExceptions.find(
      e => e.foodGroupId === foodGroupId && e.date === date,
    )

  const ruleAt = (foodGroupId: string, date: LocalDate) =>
    visibleRules.find(
      r => r.foodGroupId === foodGroupId && ruleActiveOn(r, date),
    )

  return (
    <div className="mx-auto w-full max-w-3xl overflow-x-auto">
      <div className="min-w-fit">
        {rows.map((row, index) => {
          if (row.kind === "gap") {
            return (
              <div
                key={`gap-${index}`}
                className="grid gap-x-1"
                style={gridStyle}
              >
                <div className="text-muted-foreground/70 flex items-center justify-end pr-2 text-[0.65rem]">
                  {gapLabel(row.days)}
                </div>
                {columns.map(group => (
                  <Lane
                    key={group.id}
                    // A rule spanning this gap keeps its lane drawn through it.
                    active={visibleRules.some(
                      r =>
                        r.foodGroupId === group.id &&
                        // Active on the newer boundary implies it crosses the gap
                        // since gaps sit between two active-or-boundary rows.
                        crossesGap(r, rows, index),
                    )}
                    height="h-4"
                  />
                ))}
              </div>
            )
          }

          const date = row.date
          const jsDate = fromLocalDate(date)
          return (
            <div
              key={date}
              className={cn(
                "grid items-stretch gap-x-1",
                row.isToday ? "border-foreground/30" : "border-border/60",
              )}
              style={gridStyle}
            >
              <div className="flex flex-col items-end justify-center py-2 pr-2 text-right">
                <span
                  className={cn(
                    "text-xs font-medium",
                    row.isToday && "text-foreground",
                  )}
                >
                  {row.isToday ? "Today" : dateFormatter.format(jsDate)}
                </span>
                <span className="text-muted-foreground/70 text-[0.65rem]">
                  {yearFormatter.format(jsDate)}
                </span>
              </div>

              {columns.map(group => {
                const rule = ruleAt(group.id, date)
                const exception = exceptionAt(group.id, date)
                return (
                  <div
                    key={group.id}
                    className="relative flex min-h-9 items-center justify-center"
                  >
                    {rule && (
                      <button
                        type="button"
                        aria-label={`Edit rule for ${group.name}`}
                        onClick={() => onSelectRule(rule)}
                        className="absolute inset-y-0 left-1/2 z-10 w-6 -translate-x-1/2"
                      >
                        <span className="bg-brand-1/70 absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full" />
                      </button>
                    )}
                    {exception ? (
                      <button
                        type="button"
                        aria-label={`Edit exception for ${group.name}`}
                        title={exception.note || undefined}
                        onClick={() => onSelectException(exception)}
                        className="bg-brand-2 ring-background relative z-20 size-3 rounded-full ring-2 transition-transform hover:scale-125"
                      />
                    ) : (
                      <button
                        type="button"
                        aria-label={`Record for ${group.name} on ${date}`}
                        onClick={() => onSelectCell(group.id, date)}
                        className="absolute inset-0 z-0"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div
        className="bg-card sticky bottom-0 z-10 grid items-center gap-x-1 rounded-3xl rounded-b-none border border-b-0 pt-2 pb-4 text-sm"
        style={{ ...gridStyle, viewTransitionName: "tab-header" }}
      >
        <span className="text-muted-foreground min-w-[4.5rem] pr-2 pl-4 text-end font-semibold">
          Date
        </span>
        {columns.map(group => {
          const label = ruleStintLabel(
            visibleRules.filter(rule => rule.foodGroupId === group.id),
            visibleExceptions.filter(
              exception => exception.foodGroupId === group.id,
            ),
            today,
          )
          const hasActiveRule = rules.some(
            rule => rule.foodGroupId === group.id && ruleActiveOn(rule, today),
          )
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectFoodGroup(group.id)}
              aria-label={group.name}
              title={group.name}
              className={cn(
                "hover:bg-muted flex flex-col items-center rounded-md py-1 text-xl transition-colors",
                !hasActiveRule && "saturate-0",
              )}
            >
              <span aria-hidden>{group.emoji}</span>
              <span
                className={cn(
                  "text-xs",
                  label === null
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground",
                )}
              >
                {label ?? "–"}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A vertical rule lane segment (used within gap rows). */
function Lane({ active, height }: { active: boolean; height: string }) {
  return (
    <div className={cn("relative flex justify-center", height)}>
      {active && (
        <div className="bg-brand-1/70 absolute inset-y-0 w-1.5 rounded-full" />
      )}
    </div>
  )
}

/**
 * Whether a rule's lane crosses the gap row at `gapIndex`. A gap sits between
 * the event row above it (newer) and below it (older); if the rule is active on
 * both bounding event dates it spans the gap.
 */
function crossesGap(
  rule: DietRule,
  rows: ReturnType<typeof buildTimelineRows>,
  gapIndex: number,
): boolean {
  const newer = rows[gapIndex - 1]
  const older = rows[gapIndex + 1]
  if (newer.kind !== "event" || older.kind !== "event") return false
  return ruleActiveOn(rule, newer.date) && ruleActiveOn(rule, older.date)
}
