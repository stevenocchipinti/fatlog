import type {
  DietException,
  DietRule,
  FoodGroup,
  LocalDate,
  NewFoodGroup,
} from "@/types"

import type { TimelineBand } from "@/components/diet/timeline"
import {
  TIMELINE_STYLE,
  buildTimelineRows,
  gapLabel,
  layoutRuleLine,
  layoutTimeline,
  ruleActiveOn,
  ruleStintLabel,
  todayLocalDate,
} from "@/components/diet/timeline"
import { fromLocalDate } from "@/lib/localDate"
import { Button } from "@/components/ui/button"
import { remainingStarters } from "@/lib/starterFoodGroups"
import { cn } from "@/lib/utils"

type DietTimelineProps = {
  /** True until the food groups subscription has responded at least once. */
  loading: boolean
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
  /** Create a food group directly (used by the empty state's starters). */
  onAddFoodGroup: (foodGroup: NewFoodGroup) => void
  /** Open food group management. */
  onManageFoodGroups: () => void
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
})

/** Width of the date column, shared by the rows, the overlay and the key bar. */
const DATE_COLUMN = "4.5rem"
/** Column rail: the foreground colour (white in dark mode) at 8% opacity. */
const RAIL_COLOR = "color-mix(in srgb, var(--foreground) 8%, transparent)"
const yearFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric" })

/**
 * Compact diet timeline: dates as rows (newest first), active food groups as
 * emoji-only columns.
 *
 * A diet rule renders as one thin continuous line down its column's rail, from
 * its end row (Today while active) to its start row. Gaps between dated rows
 * are sized by how much time they skip, and the line turns dotted through the
 * long ones. A diet exception renders as a ring on its food group/date cell,
 * which may sit on a rule line or stand alone.
 */
export default function DietTimeline({
  loading,
  foodGroups,
  rules,
  exceptions,
  onSelectFoodGroup,
  onSelectCell,
  onSelectException,
  onSelectRule,
  onAddFoodGroup,
  onManageFoodGroups,
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

  if (columns.length === 0 && !loading) {
    return (
      <DietEmptyState
        foodGroups={foodGroups}
        onAddFoodGroup={onAddFoodGroup}
        onManageFoodGroups={onManageFoodGroups}
      />
    )
  }

  if (columns.length === 0) {
    // Show a skeleton grid placeholder so the view transition animates against
    // meaningful grid content rather than jumping to data after the animation
    // completes when Firebase subscriptions return.
    const columnCount = 4
    const gridStyle = {
      gridTemplateColumns: `4.5rem repeat(${columnCount}, minmax(3rem, 1fr))`,
    }
    return (
      <div
        role="status"
        aria-label="Loading diet"
        className="mx-auto w-full max-w-3xl overflow-x-auto px-2"
      >
        <div className="min-w-fit">
          {Array.from({ length: 6 }).map((_row, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                "grid items-stretch gap-x-1",
                rowIndex === 0 ? "border-foreground/30" : "border-border/60",
              )}
              style={gridStyle}
            >
              <div className="flex flex-col items-end justify-center py-2 pr-2 text-right">
                <span className="text-foreground text-xs font-medium">Day</span>
                <span className="text-muted-foreground text-[0.65rem]">
                  2024
                </span>
              </div>
              {Array.from({ length: columnCount }).map((_col, colIndex) => (
                <div
                  key={colIndex}
                  className="relative flex min-h-9 items-center justify-center"
                >
                  <div className="bg-border/20 absolute left-1/2 h-2/3 w-2/3 -translate-x-1/2 animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // A single column-template shared by the rows, the line overlay and the key
  // bar so everything stays aligned. Horizontal scroll only kicks in when
  // columns exceed the width.
  const gridStyle = {
    gridTemplateColumns: `${DATE_COLUMN} repeat(${columns.length}, minmax(3rem, 1fr))`,
  }

  const { bands, height } = layoutTimeline(rows)

  const exceptionAt = (foodGroupId: string, date: LocalDate) =>
    visibleExceptions.find(
      e => e.foodGroupId === foodGroupId && e.date === date,
    )

  const ruleAt = (foodGroupId: string, date: LocalDate) =>
    visibleRules.find(
      r => r.foodGroupId === foodGroupId && ruleActiveOn(r, date),
    )

  return (
    <div className="mx-auto w-full max-w-3xl overflow-x-auto px-2">
      <div className="relative min-w-fit" style={{ height }}>
        {/* Everything drawn: guides, rails, rule lines and rule marks. It sits
            under the rows, which only hold labels, tap targets and exception
            rings, and is positioned from the same fixed band heights. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid gap-x-1"
          style={gridStyle}
        >
          {bands.map(
            band =>
              band.kind === "event" && (
                <div
                  key={band.date}
                  className="bg-foreground/6 absolute right-0 h-px"
                  style={{
                    left: DATE_COLUMN,
                    top: band.top + band.height / 2,
                  }}
                />
              ),
          )}
          <div />
          {columns.map(group => (
            <div key={group.id} className="relative">
              <div
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${RAIL_COLOR} ${TIMELINE_STYLE.railFade}px)`,
                }}
              />
              {visibleRules
                .filter(rule => rule.foodGroupId === group.id)
                .map(rule => (
                  <RuleLine
                    key={rule.id}
                    rule={rule}
                    bands={bands}
                    today={today}
                  />
                ))}
            </div>
          ))}
        </div>

        {bands.map((band, index) => {
          if (band.kind === "gap") {
            return (
              <div
                key={`gap-${index}`}
                className="flex items-center justify-end pr-2 text-[11px]"
                style={{
                  height: band.height,
                  width: DATE_COLUMN,
                  color: TIMELINE_STYLE.gapLabelColor,
                }}
              >
                {band.days > 0 && gapLabel(band.days)}
              </div>
            )
          }

          const date = band.date
          const jsDate = fromLocalDate(date)
          return (
            <div
              key={date}
              className="grid items-stretch gap-x-1"
              style={{ ...gridStyle, height: band.height }}
            >
              <div className="flex flex-col items-end justify-center pr-2 text-right">
                <span
                  className={cn(
                    "text-[15px] leading-tight font-semibold",
                    band.isToday && "text-foreground",
                  )}
                >
                  {band.isToday ? "Today" : dateFormatter.format(jsDate)}
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
                    className="relative flex items-center justify-center"
                  >
                    {rule && (
                      <button
                        type="button"
                        aria-label={`Edit rule for ${group.name}`}
                        onClick={() => onSelectRule(rule)}
                        className="absolute inset-y-0 left-1/2 z-10 w-6 -translate-x-1/2"
                      />
                    )}
                    {exception ? (
                      <button
                        type="button"
                        aria-label={`Edit exception for ${group.name}`}
                        title={exception.note || undefined}
                        onClick={() => onSelectException(exception)}
                        className="bg-background relative z-20 size-2.5 rounded-full transition-transform hover:scale-125"
                        style={{
                          border: `1.5px solid ${TIMELINE_STYLE.exceptionColor}`,
                        }}
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
        className="bg-card sticky bottom-0 z-10 grid items-center gap-x-1 rounded-3xl border py-3 text-sm"
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
                  hasActiveRule
                    ? "text-brand-1"
                    : label === null
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

/**
 * One rule drawn within its column: a thin continuous line centred on the
 * rail, dotted only inside dotted gaps, with a ring where it starts and either
 * a ring where it ended or a haloed dot at Today while it is still active.
 */
function RuleLine({
  rule,
  bands,
  today,
}: {
  rule: DietRule
  bands: Array<TimelineBand>
  today: LocalDate
}) {
  const line = layoutRuleLine(rule, bands, today)
  if (!line) return null
  const { ruleColor, ruleWidth, dottedOpacity } = TIMELINE_STYLE

  const ring = (y: number) => (
    <div
      className="bg-background absolute left-1/2 size-2.5 -translate-1/2 rounded-full"
      style={{ top: y, border: `2px solid ${ruleColor}` }}
    />
  )

  return (
    <>
      {line.segments.map(segment => (
        <div
          key={segment.top}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: segment.top,
            height: segment.height,
            width: ruleWidth,
            ...(segment.dash
              ? {
                  opacity: dottedOpacity,
                  background: `repeating-linear-gradient(to bottom, ${ruleColor} 0 ${segment.dash.on}px, transparent ${segment.dash.on}px ${segment.dash.on + segment.dash.off}px)`,
                }
              : { background: ruleColor }),
          }}
        />
      ))}
      {ring(line.startY)}
      {rule.endDate === undefined ? (
        <div
          className="absolute left-1/2 size-2 -translate-1/2 rounded-full"
          style={{
            top: line.endY,
            background: ruleColor,
            boxShadow: `0 0 0 4px color-mix(in srgb, ${ruleColor} 22%, transparent)`,
          }}
        />
      ) : (
        rule.endDate !== rule.startDate && ring(line.endY)
      )}
    </>
  )
}

/**
 * Shown once diet data has loaded and there are no active food groups: a new
 * user, or one who has archived every group. Starters are offered as one-tap
 * creates; anything else (custom groups, unarchiving) goes through food group
 * management.
 */
function DietEmptyState({
  foodGroups,
  onAddFoodGroup,
  onManageFoodGroups,
}: Pick<
  DietTimelineProps,
  "foodGroups" | "onAddFoodGroup" | "onManageFoodGroups"
>) {
  // Only reached with no active groups, so any group here is archived.
  const allArchived = foodGroups.length > 0
  const starters = remainingStarters(foodGroups)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">
        {allArchived
          ? "All your food groups are archived"
          : "No food groups yet"}
      </h2>
      <p className="text-muted-foreground text-sm">
        {starters.length === 0
          ? "Unarchive one, or add a new one, in food group management."
          : allArchived
            ? "Unarchive one in food group management, or tap a starter below to add it."
            : "Food groups are the columns of your diet timeline. Tap one to add it."}
      </p>
      {starters.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {starters.map(starter => (
            <button
              key={starter.name}
              type="button"
              aria-label={`Add ${starter.emoji} ${starter.name}`}
              onClick={() =>
                onAddFoodGroup({
                  emoji: starter.emoji,
                  name: starter.name,
                  // No active groups, so this is first in the column order.
                  order: 0,
                  archived: false,
                })
              }
              className="bg-muted hover:bg-muted/70 flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors"
            >
              <span aria-hidden>{starter.emoji}</span>
              {starter.name}
            </button>
          ))}
        </div>
      )}
      <Button
        variant="link"
        size="sm"
        className="text-muted-foreground"
        onClick={onManageFoodGroups}
      >
        {allArchived ? "Manage food groups" : "Add a custom food group"}
      </Button>
    </div>
  )
}
