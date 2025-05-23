import { useRef } from "react"
import { motion } from "framer-motion"

import type { KeyboardEvent } from "react"
import type { TimeScaleOption } from "../types"

import { cn } from "@/lib/utils"

interface TimePeriodSwitcherProps {
  value: TimeScaleOption
  onChange?: (value: TimeScaleOption) => void
  className?: string
}

export default function TimePeriodSwitcher({
  value,
  onChange,
  className,
}: TimePeriodSwitcherProps) {
  const selected = value
  const containerRef = useRef<HTMLDivElement>(null)

  const options: TimeScaleOption[] = ["1M", "3M", "6M", "1Y", "ALL"]
  const friendlyOptions: Record<TimeScaleOption, string> = {
    "1M": "1 month",
    "3M": "3 months",
    "6M": "6 months",
    "1Y": "1 year",
    ALL: "all time",
  }

  const handleSelect = (option: TimeScaleOption) => {
    if (option !== selected) onChange?.(option)
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      const nextIndex = (index + 1) % options.length
      handleSelect(options[nextIndex])
      const buttons = containerRef.current?.querySelectorAll('[role="radio"]')
      ;(buttons?.[nextIndex] as HTMLElement).focus()
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      const prevIndex = (index - 1 + options.length) % options.length
      handleSelect(options[prevIndex])
      const buttons = containerRef.current?.querySelectorAll('[role="radio"]')
      ;(buttons?.[prevIndex] as HTMLElement).focus()
    }
  }

  return (
    <div
      className={cn("flex items-center justify-center p-4", className)}
      role="radiogroup"
      aria-label="Time period selection"
      ref={containerRef}
    >
      <div className="relative flex rounded-full bg-gray-200 p-1 shadow-inner dark:bg-gray-900">
        {options.map((option, index) => (
          <button
            key={option}
            role="radio"
            aria-checked={selected === option}
            tabIndex={selected === option ? 0 : -1}
            onClick={() => handleSelect(option)}
            onKeyDown={e => handleKeyDown(e, index)}
            className={cn(
              "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              selected === option
                ? "text-gray-800 dark:text-gray-200"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {option}
            {selected === option && (
              <motion.div
                layoutId="switcher-pill"
                className="bg-card absolute inset-0 rounded-full border shadow-sm"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                style={{ zIndex: -1 }}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">{friendlyOptions[option]} selected</span>
          </button>
        ))}
      </div>
    </div>
  )
}
