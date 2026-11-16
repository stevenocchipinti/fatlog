import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TransitionLink } from "./viewTransitions"

const navigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/metrics" }),
  useNavigate: () => navigate,
}))

afterEach(() => {
  cleanup()
  navigate.mockReset()
  Reflect.deleteProperty(document, "startViewTransition")
  delete document.documentElement.dataset.navDirection
  delete document.documentElement.dataset.tabHeaderMorph
})

/** Lets promise callbacks that are already queued run. */
const settle = () => new Promise(resolve => setTimeout(resolve))

const clickDiet = () => {
  render(
    <TransitionLink to="/diet" direction="forward">
      Diet
    </TransitionLink>,
  )
  fireEvent.click(screen.getByRole("link", { name: "Diet" }))
}

describe("TransitionLink", () => {
  it("navigates without a transition where the browser has none", () => {
    clickDiet()

    expect(navigate).toHaveBeenCalledWith({ to: "/diet", replace: undefined })
  })

  it("holds the transition until the new screen has rendered", async () => {
    let finishNavigation = () => {}
    navigate.mockReturnValue(
      new Promise<void>(resolve => {
        finishNavigation = resolve
      }),
    )
    let finishTransition = () => {}
    const finished = new Promise<void>(resolve => {
      finishTransition = resolve
    })
    let updated = false
    document.startViewTransition = ((update: () => Promise<void>) => {
      void update().then(() => {
        updated = true
      })
      return { finished }
    }) as unknown as typeof document.startViewTransition

    clickDiet()
    await settle()

    expect(navigate).toHaveBeenCalledWith({ to: "/diet", replace: undefined })
    expect(updated).toBe(false)
    expect(document.documentElement.dataset.navDirection).toBe("forward")

    finishNavigation()
    await settle()
    expect(updated).toBe(true)
    expect(document.documentElement.dataset.navDirection).toBe("forward")

    finishTransition()
    await settle()
    expect(document.documentElement.dataset.navDirection).toBeUndefined()
  })

  it("morphs the header card only when both screens have one", async () => {
    const root = document.documentElement
    const transitionTo = async (newScreenHasCard: boolean) => {
      const card = document.createElement("div")
      card.dataset.tabHeader = ""
      document.body.append(card)
      navigate.mockImplementation(() => {
        if (!newScreenHasCard) card.remove()
        return Promise.resolve()
      })
      document.startViewTransition = ((update: () => Promise<void>) => {
        void update()
        return { finished: new Promise<void>(() => {}) }
      }) as unknown as typeof document.startViewTransition

      clickDiet()
      await settle()
      card.remove()
      cleanup()
    }

    await transitionTo(false)
    expect(root.dataset.tabHeaderMorph).toBeUndefined()

    await transitionTo(true)
    expect(root.dataset.tabHeaderMorph).toBe("")
  })
})
