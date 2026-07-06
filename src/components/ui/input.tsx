import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-sm text-[#111827] dark:text-[#f8fafc] ring-offset-[--background] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9ca3af] dark:placeholder:text-[#64748b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
