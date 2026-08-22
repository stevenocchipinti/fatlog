import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

// Import the generated route tree
import { routeTree } from "./routeTree.gen"
import { FirebaseProvider, useAuth } from "./lib/firebase"
import { parseNavPrefix } from "./lib/navVariant"

import reportWebVitals from "./reportWebVitals.ts"
import "./styles.css"

// Throwaway UI experiment: /nav1…/nav5 URL prefixes each render the app with a
// different experimental bottom navigation. The prefix is stripped from the
// pathname and set as the router basepath, so every route works unchanged
// underneath (e.g. /nav2/diet renders the diet route with variant nav2).
const parsed = parseNavPrefix(window.location.pathname)
export const activeNavVariant = parsed.id
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  ...(activeNavVariant ? { basepath: `/${activeNavVariant}` } : {}),
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

function App() {
  return (
    <FirebaseProvider>
      <InnerApp />
    </FirebaseProvider>
  )
}

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
