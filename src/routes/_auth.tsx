import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
  useRouter,
} from "@tanstack/react-router"
import { Check, LogIn, LogOut, Users } from "lucide-react"
import { useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import BottomNavigation from "@/components/BottomNavigation"
import ProfileAvatar from "@/components/ProfileAvatar"
import { cn } from "@/lib/utils"
import { PrimaryActionProvider } from "@/lib/primaryAction"
import { useAuth, useProfiles } from "@/lib/firebase"
import { trackerRedirect } from "@/lib/profiles"
import { AVAILABLE_TRACKERS, trackerForPath } from "@/lib/trackers"

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
  const { profiles, activeProfile, setActiveProfileId } = useProfiles()

  const router = useRouter()
  const navigate = Route.useNavigate()
  const { pathname } = useLocation()
  const tracker = trackerForPath(pathname)

  // Trackers that are both built and enabled for the active profile.
  const visibleTrackers = activeProfile
    ? AVAILABLE_TRACKERS.filter(({ id }) =>
        activeProfile.enabledTrackers.includes(id),
      )
    : AVAILABLE_TRACKERS

  // A profile that has this tracker turned off can't be on its screen.
  const redirectTo = activeProfile
    ? trackerRedirect(
        pathname,
        visibleTrackers.map(({ id }) => id),
      )
    : undefined
  useEffect(() => {
    if (redirectTo) void navigate({ to: redirectTo, replace: true })
  }, [redirectTo, navigate])

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      void logout().then(() =>
        router.invalidate().finally(() => navigate({ to: "/" })),
      )
    }
  }

  return (
    <PrimaryActionProvider>
      <div className="flex h-dvh flex-col gap-2">
        <header className="flex items-center justify-between gap-4 pt-5 pl-6">
          <h1
            className="text-3xl font-extrabold text-gray-900 dark:text-white"
            style={{ viewTransitionName: "tracker-title" }}
          >
            {tracker?.title ?? (pathname === "/profiles" ? "Profiles" : "")}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                {/*
                  The ring is drawn behind the avatar so it doesn't affect
                  layout. Construction stripes mark the beta build.
                */}
                <span
                  className={cn(
                    "relative flex rounded-full before:absolute before:-inset-[3px] before:rounded-full",
                    import.meta.env.MODE === "beta"
                      ? "before:bg-[repeating-conic-gradient(var(--color-yellow-400)_0_9deg,var(--color-neutral-900)_9deg_18deg)]"
                      : "before:bg-gray-200",
                  )}
                >
                  <ProfileAvatar
                    profile={activeProfile}
                    photoURL={
                      activeProfile?.id === user?.uid ? user?.photoURL : null
                    }
                  />
                </span>
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuLabel>Profiles</DropdownMenuLabel>
                  {profiles
                    .filter(profile => !profile.archived)
                    .map(profile => (
                      <DropdownMenuItem
                        key={profile.id}
                        onClick={() => setActiveProfileId(profile.id)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <ProfileAvatar
                          profile={profile}
                          photoURL={
                            profile.id === user.uid ? user.photoURL : null
                          }
                          className="size-6 text-xs"
                        />
                        <span className="flex-1 truncate">{profile.name}</span>
                        {profile.id === activeProfile?.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/profiles" })}
                    className="flex cursor-pointer items-center"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Manage profiles</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <div className="p-2">Logged out</div>
              )}
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
        {/*
          The bottom bar sits in its own row below this scroll container, so
          page content is never hidden behind it.
        */}
        <main
          className="relative flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto"
          style={{ viewTransitionName: "app-screen" }}
        >
          <Outlet />
        </main>
        <BottomNavigation trackers={visibleTrackers} />
      </div>
    </PrimaryActionProvider>
  )
}
