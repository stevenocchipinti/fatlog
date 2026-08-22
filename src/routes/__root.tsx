import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router"
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import VariantSwitcher from "@/components/VariantSwitcher"
import type { AuthContext } from "@/lib/firebase"

interface RouterContext {
  auth: AuthContext
}

const RootComponent = () => {
  // Throwaway UI experiment: floating chips to hop between /nav1…/nav5.
  const pathname = useRouterState({ select: s => s.location.pathname })
  const current = pathname.match(/^\/(nav\d)(\/|$)/)?.[1]

  return (
    <>
      <Outlet />
      <VariantSwitcher current={current} />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})
