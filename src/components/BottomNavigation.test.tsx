import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import BottomNavigation from "./BottomNavigation"

import {
  PrimaryActionProvider,
  useRegisterPrimaryAction,
} from "@/lib/primaryAction"
import { TRACKERS } from "@/lib/trackers"

let pathname = "/metrics"
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  useNavigate: () => vi.fn(),
}))

afterEach(cleanup)

const RegisterAction = ({ onTrigger }: { onTrigger: () => void }) => {
  useRegisterPrimaryAction("Record metrics", onTrigger)
  return null
}

const renderNav = (trackerIds: string[], onTrigger: () => void = () => {}) =>
  render(
    <PrimaryActionProvider>
      <RegisterAction onTrigger={onTrigger} />
      <BottomNavigation
        trackers={TRACKERS.filter(tracker => trackerIds.includes(tracker.id))}
      />
    </PrimaryActionProvider>,
  )

describe("BottomNavigation", () => {
  it("shows an icon-only tab per tracker, named for screen readers", () => {
    pathname = "/metrics"
    renderNav(["metrics", "diet", "bowelMovements", "symptoms"])

    const tabs = screen.getAllByRole("link")
    expect(tabs.map(tab => tab.getAttribute("aria-label"))).toEqual([
      "Metrics",
      "Diet",
      "Stool",
      "Symptoms",
    ])
    expect(tabs.map(tab => tab.textContent)).toEqual(["", "", "", ""])
  })

  it("marks the current tracker's tab as the current page", () => {
    pathname = "/diet"
    renderNav(["metrics", "diet"])

    const current = (name: string) =>
      screen.getByRole("link", { name }).getAttribute("aria-current")
    expect(current("Diet")).toBe("page")
    expect(current("Metrics")).toBeNull()
  })

  it("hides the tabs when only one tracker is enabled", () => {
    pathname = "/metrics"
    renderNav(["metrics"])

    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByRole("button", { name: "Record metrics" })).toBeTruthy()
  })

  it("triggers the current page's primary action from the + button", () => {
    const onTrigger = vi.fn()
    renderNav(["metrics", "diet"], onTrigger)

    fireEvent.click(screen.getByRole("button", { name: "Record metrics" }))
    expect(onTrigger).toHaveBeenCalledOnce()
  })
})
