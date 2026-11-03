import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import DietTimeline from "./DietTimeline"

import type { ComponentProps } from "react"
import type { FoodGroup } from "@/types"

afterEach(cleanup)

const meat: FoodGroup = {
  id: "g1",
  emoji: "🥩",
  name: "Meat",
  order: 0,
  archived: false,
}

const renderTimeline = (
  props: Partial<ComponentProps<typeof DietTimeline>> = {},
) => {
  const handlers = {
    onSelectFoodGroup: vi.fn(),
    onSelectCell: vi.fn(),
    onSelectException: vi.fn(),
    onSelectRule: vi.fn(),
    onAddFoodGroup: vi.fn(),
    onManageFoodGroups: vi.fn(),
  }
  render(
    <DietTimeline
      loading={false}
      foodGroups={[]}
      rules={[]}
      exceptions={[]}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe("DietTimeline", () => {
  it("shows a loading placeholder while diet data is loading", () => {
    renderTimeline({ loading: true })

    expect(screen.getByRole("status", { name: "Loading diet" })).toBeTruthy()
  })

  it("shows an empty state with starter food groups once loaded with none", () => {
    renderTimeline({ loading: false, foodGroups: [] })

    expect(screen.queryByRole("status", { name: "Loading diet" })).toBeNull()
    expect(screen.getByText("No food groups yet")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add 🥩 Meat" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add 🍭 Sweets" })).toBeTruthy()
  })

  it("creates the starter food group when its chip is tapped", () => {
    const { onAddFoodGroup } = renderTimeline({ foodGroups: [] })

    fireEvent.click(screen.getByRole("button", { name: "Add 🍎 Fruit" }))

    expect(onAddFoodGroup).toHaveBeenCalledExactlyOnceWith({
      emoji: "🍎",
      name: "Fruit",
      order: 0,
      archived: false,
    })
  })

  it("offers a custom food group via food group management", () => {
    const { onManageFoodGroups } = renderTimeline({ foodGroups: [] })

    fireEvent.click(
      screen.getByRole("button", { name: "Add a custom food group" }),
    )

    expect(onManageFoodGroups).toHaveBeenCalledOnce()
  })

  it("doesn't offer starters whose name is already used by an archived group", () => {
    renderTimeline({ foodGroups: [{ ...meat, archived: true }] })

    expect(screen.getByText("All your food groups are archived")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Add 🥩 Meat" })).toBeNull()
    expect(screen.getByRole("button", { name: "Add 🥚 Eggs" })).toBeTruthy()
  })

  it("points to food group management when every food group is archived", () => {
    const archivedStarters = [
      "Meat",
      "Eggs",
      "Dairy",
      "Fruit",
      "Vegetables",
      "Grains",
      "Sweets",
    ].map((name, i): FoodGroup => ({
      id: `g${i}`,
      emoji: "•",
      name,
      order: i,
      archived: true,
    }))
    const { onManageFoodGroups } = renderTimeline({
      foodGroups: archivedStarters,
    })

    expect(screen.getByText("All your food groups are archived")).toBeTruthy()
    expect(screen.queryByText(/Tap one to add it/)).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Manage food groups" }))
    expect(onManageFoodGroups).toHaveBeenCalledOnce()
  })

  it("shows the timeline once there are active food groups", () => {
    renderTimeline({ foodGroups: [meat] })

    expect(screen.queryByText("No food groups yet")).toBeNull()
    expect(screen.queryByRole("status", { name: "Loading diet" })).toBeNull()
    expect(screen.getByText("Today")).toBeTruthy()
  })
})
