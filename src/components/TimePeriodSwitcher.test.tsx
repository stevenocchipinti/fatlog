import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import TimePeriodSwitcher from "./TimePeriodSwitcher"

afterEach(cleanup)

const radio = (label: string) =>
  screen.getByRole("radio", { name: new RegExp(`^${label}`) })

describe("TimePeriodSwitcher arrow keys", () => {
  it("selects and focuses the next option, wrapping at the end", () => {
    const onChange = vi.fn()
    render(<TimePeriodSwitcher value="ALL" onChange={onChange} />)

    fireEvent.keyDown(radio("ALL"), { key: "ArrowRight" })

    expect(onChange).toHaveBeenCalledWith("1M")
    expect(document.activeElement).toBe(radio("1M"))
  })

  it("selects and focuses the previous option, wrapping at the start", () => {
    const onChange = vi.fn()
    render(<TimePeriodSwitcher value="1M" onChange={onChange} />)

    fireEvent.keyDown(radio("1M"), { key: "ArrowLeft" })

    expect(onChange).toHaveBeenCalledWith("ALL")
    expect(document.activeElement).toBe(radio("ALL"))
  })
})
