import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/fasting")({
  component: App,
})

function App() {
  return <p>Coming soon</p>
}
