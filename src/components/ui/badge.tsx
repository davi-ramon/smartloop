import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[--ring] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[--primary] text-[--primary-foreground]",
        secondary:
          "border-transparent bg-[--secondary] text-[--secondary-foreground]",
        destructive:
          "border-transparent bg-[--destructive] text-[--destructive-foreground]",
        outline: "text-[--foreground]",
        accent:
          "border-transparent bg-[--accent] text-[--accent-foreground]",
        // Status das OS
        received:
          "border-transparent bg-[#6366f1]/10 text-[#6366f1]",
        analyzing:
          "border-transparent bg-[#f59e0b]/10 text-[#f59e0b]",
        waiting_part:
          "border-transparent bg-[#ef4444]/10 text-[#ef4444]",
        ready:
          "border-transparent bg-[#22c55e]/10 text-[#22c55e]",
        delivered:
          "border-transparent bg-[#64748b]/10 text-[#64748b]",
        cancelled:
          "border-transparent bg-[#94a3b8]/10 text-[#94a3b8]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
