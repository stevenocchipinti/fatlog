import { flushSync } from "react-dom"
import { useLocation, useNavigate } from "@tanstack/react-router"
import React from "react"

export type NavigationDirection = "metrics" | "diet"

export interface TransitionNavigationOptions {
  direction?: NavigationDirection
  replace?: boolean
}

const shouldHandleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
  return (
    event.button === 0 &&
    (!event.currentTarget.target || event.currentTarget.target === "_self") &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  )
}

export const useNavigateWithTransition = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return React.useCallback(
    (to: string, options?: TransitionNavigationOptions) => {
      if (pathname === to) return

      const replace = options?.replace
      const direction = options?.direction
      const navigateOptions = { to, replace } as const

      if (typeof document.startViewTransition !== "function") {
        navigate(navigateOptions)
        return
      }

      const root = document.documentElement

      if (direction) {
        root.dataset.navDirection = direction
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          navigate(navigateOptions)
        })
      })

      transition.finished.finally(() => {
        delete root.dataset.navDirection
      })
    },
    [navigate, pathname],
  )
}

interface TransitionLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
  className?: string
  direction?: NavigationDirection
  replace?: boolean
  to: string
}

export const TransitionLink = ({
  children,
  className,
  direction,
  onClick,
  replace,
  to,
  ...rest
}: TransitionLinkProps) => {
  const navigateWithTransition = useNavigateWithTransition()

  return (
    <a
      {...rest}
      className={className}
      href={to}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || !shouldHandleLinkClick(event)) return

        event.preventDefault()
        navigateWithTransition(to, { direction, replace })
      }}
    >
      {children}
    </a>
  )
}
