"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-transparent p-4", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-2", defaultClassNames.months),
        month: cn("flex flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/40 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/40 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "relative flex h-9 w-full items-center justify-center",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-sm font-semibold text-foreground",
          defaultClassNames.caption_label
        ),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none pb-2 text-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "relative flex-1 select-none p-0.5 text-center",
          defaultClassNames.day
        ),
        today: cn(
          "rounded-xl bg-primary/10 font-semibold text-primary",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/40",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/30",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <Icon className={cn("size-4", className)} {...props} />
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl text-sm font-medium transition-all duration-150",
        "hover:bg-secondary/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isSelected &&
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground",
        modifiers.range_start &&
          "bg-primary text-primary-foreground rounded-xl",
        modifiers.range_end &&
          "bg-primary text-primary-foreground rounded-xl",
        modifiers.range_middle &&
          "bg-accent/60 text-accent-foreground rounded-none",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
