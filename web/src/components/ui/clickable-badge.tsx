import * as React from "react"
import { cn } from "@/lib/utils"

function ClickableBadge({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="clickable-badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-3xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        "transition-all duration-150 ease-out",
        "hover:shadow-sm hover:brightness-[0.97] dark:hover:brightness-[1.15]",
        "active:brightness-[0.93] dark:active:brightness-[1.25]",
        "motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        "[&>svg]:pointer-events-none [&>svg]:size-3!",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { ClickableBadge }
