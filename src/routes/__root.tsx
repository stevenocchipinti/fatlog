import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import type { AuthContext } from "@/lib/auth"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

interface MyRouterContext {
  auth: AuthContext
}

const RootComponent = () => {
  const { user, login, logout } = useAuth()
  console.log(user)
  return (
    <>
      <div className="border-b">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-4 text-lg">
          {user ? (
            <>
              <Button onClick={() => logout()} variant="outline">
                Sign out
              </Button>
              <span>{user.displayName}</span>
            </>
          ) : (
            <Button onClick={() => login()} variant="outline">
              Sign In
            </Button>
          )}
        </div>
      </div>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
