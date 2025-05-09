import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
} from "@tanstack/react-router"
import { LogIn, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.state === "LOGGED_OUT") {
      throw redirect({
        to: "/",
      })
    }
  },
  component: () => <AuthComponent />,
})

const AuthComponent = () => {
  const { user, login, logout } = useAuth()
  const router = useRouter()
  const navigate = Route.useNavigate()

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout().then(() => {
        router.invalidate().finally(() => {
          navigate({ to: "/" })
        })
      })
    }
  }

  return (
    <div className="flex h-dvh flex-col gap-4">
      <header className="grid grid-cols-[4rem_1fr_4rem] place-items-center">
        <span />
        <h1 className="m-4 text-center text-3xl font-extrabold text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          <Link
            to="/"
            className="bg-linear-to-tl from-blue-600 to-violet-600 bg-clip-text text-transparent"
          >
            Fatlog
          </Link>
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <Avatar>
                {user?.photoURL && <AvatarImage src={user.photoURL} />}
                {user?.displayName && (
                  <AvatarFallback>{user.displayName[0] || "✅"}</AvatarFallback>
                )}
                {!user && <AvatarFallback>⨯</AvatarFallback>}
              </Avatar>
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2">{user ? user.displayName : "Logged out"}</div>
            {user ? (
              <DropdownMenuItem
                onClick={() => handleLogout()}
                className="flex cursor-pointer items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => login()}
                className="flex cursor-pointer items-center"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Login</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <Outlet />
    </div>
  )
}
