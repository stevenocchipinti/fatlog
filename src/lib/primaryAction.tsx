import { createContext, useContext, useEffect, useState } from "react"

import type { ReactNode } from "react"

/**
 * The bottom navigation's center primary action is mode-specific: on Metrics it
 * opens the metrics recording drawer, on Diet it opens the Diet drawer. Rather
 * than the shared nav (which lives in the authenticated layout) knowing about
 * every route's drawer, each active route registers a handler and accessible
 * label here. The nav simply invokes whatever the current route registered.
 */
type PrimaryAction = {
  label: string
  onTrigger: () => void
}

type PrimaryActionContextValue = {
  primaryAction: PrimaryAction | null
  setPrimaryAction: (action: PrimaryAction | null) => void
}

const PrimaryActionContext = createContext<PrimaryActionContextValue | null>(
  null,
)

export const PrimaryActionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [primaryAction, setPrimaryAction] = useState<PrimaryAction | null>(null)
  return (
    <PrimaryActionContext.Provider value={{ primaryAction, setPrimaryAction }}>
      {children}
    </PrimaryActionContext.Provider>
  )
}

export const usePrimaryActionSlot = () => {
  const context = useContext(PrimaryActionContext)
  if (!context)
    throw new Error(
      "usePrimaryActionSlot must be used within a PrimaryActionProvider",
    )
  return context
}

/**
 * Register the current route's primary action with the bottom navigation for
 * as long as the route is mounted. Clears the registration on unmount so a
 * route never leaves a stale handler behind when the user navigates away.
 */
export const useRegisterPrimaryAction = (
  label: string,
  onTrigger: () => void,
) => {
  const { setPrimaryAction } = usePrimaryActionSlot()
  useEffect(() => {
    setPrimaryAction({ label, onTrigger })
    return () => setPrimaryAction(null)
  }, [label, onTrigger, setPrimaryAction])
}
