"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,box-shadow,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[--primary] text-[--primary-foreground] shadow-sm hover:bg-[--primary]/90 hover:shadow-md",
        destructive:
          "bg-[--destructive] text-[--destructive-foreground] shadow-sm hover:bg-[--destructive]/90 hover:shadow-md",
        outline:
          "border border-[--border] bg-[--background] hover:bg-[--secondary] hover:text-[--secondary-foreground] hover:border-[--ring]/40",
        secondary:
          "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--secondary]/80",
        ghost:
          "hover:bg-[--secondary] hover:text-[--secondary-foreground]",
        link:
          "text-[--primary] underline-offset-4 hover:underline",
        accent:
          "bg-[--accent] text-[--accent-foreground] shadow-sm hover:bg-[--accent]/90 hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Mostra spinner e desabilita — para operações longas (>1-2s). */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, onClick, children, ...props },
    ref
  ) => {
    const [filling, setFilling] = React.useState(false)

    // asChild (ex.: Link) não recebe o efeito de preenchimento/spinner.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {children}
        </Slot>
      )
    }

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      if (disabled || loading) return
      // Feedback instantâneo de clique (preenchimento verde rápido).
      setFilling(false)
      requestAnimationFrame(() => setFilling(true))
      window.setTimeout(() => setFilling(false), 560)
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...props}
      >
        {/* Camada de preenchimento no clique */}
        {filling && (
          <span
            aria-hidden
            className="animate-button-fill pointer-events-none absolute inset-0 z-0 bg-[#10b981]/40"
          />
        )}
        {loading && <Loader2 className="relative z-10 animate-spin" />}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
