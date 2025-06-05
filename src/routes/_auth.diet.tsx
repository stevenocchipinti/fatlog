import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_auth/diet")({
  component: App,
})

// TODO: Make this feature
function App() {
  return <p>Coming soon</p>
}
