import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useAuth } from "@/lib/firebase"
import FullScreenLoading from "@/components/FullScreenLoading"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const { user, login, state } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (state === "LOGGED_IN") navigate({ to: "/metrics" })
  }, [navigate, state, user])

  if (state === "LOGGED_IN") {
    return <FullScreenLoading>Loading data...</FullScreenLoading>
  }

  return (
    <div className="relative overflow-hidden before:absolute before:start-1/2 before:top-0 before:-z-1 before:size-full before:-translate-x-1/2 before:transform before:bg-[url('https://preline.co/assets/svg/examples/polygon-bg-element.svg')] before:bg-cover before:bg-top before:bg-no-repeat dark:before:bg-[url('https://preline.co/assets/svg/examples-dark/polygon-bg-element.svg')]">
      <div className="mx-auto max-w-[85rem] px-4 pt-24 pb-10 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <a
            className="card card-foreground inline-flex items-center gap-x-2 rounded-full border border-gray-200 p-1 ps-3 text-sm transition hover:border-gray-300 focus:border-gray-300 focus:outline-hidden"
            href="https://github.com/stevenocchipinti/fatlog"
          >
            Under development
            <span className="inline-flex items-center justify-center gap-x-2 rounded-full bg-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-600">
              <svg
                className="size-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </a>
        </div>

        <div className="mx-auto my-12 max-w-2xl text-center">
          <h1 className="block text-4xl font-bold text-gray-800 md:text-5xl lg:text-6xl">
            <span className="from-brand-1 to-brand-2 bg-linear-to-bl bg-clip-text text-transparent">
              Fatlog
            </span>
          </h1>
        </div>

        <div className="mx-auto mt-5 max-w-3xl text-center">
          <p className="text-lg text-gray-600">
            A simple app to measure{" "}
            <span className="from-brand-1 to-brand-2 bg-linear-to-bl bg-clip-text text-transparent">
              body weight, fat percentage, and waist measurement
            </span>{" "}
            over time.
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="brand"
            size="xl"
            onClick={() => login()}
            disabled={state !== "LOGGED_OUT"}
          >
            {state === "LOADING" ? (
              "Loading..."
            ) : (
              <>
                Login with Google
                <svg
                  className="size-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
