import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import type { AuthContext } from "@/lib/auth"

interface MyRouterContext {
  auth: AuthContext
}

const RootComponent = () => {
  return (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
