"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

/**
 * Tabs (Radix wrapper) — pílulas com estilo do SmartLoop (card/border/primary).
 * O estado ativo é aplicado via `style` inline (`data-state` observado) para
 * garantir o render da cor sólida var(--primary), evitando a limitação do
 * Tailwind v4 com `bg-[--var]` em fills opacos.
 */
export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[--border] bg-[--card] p-1",
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [active, setActive] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setActive(el.getAttribute("data-state") === "active")
    update()
    const obs = new MutationObserver(update)
    obs.observe(el, { attributes: true, attributeFilter: ["data-state"] })
    return () => obs.disconnect()
  }, [])

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        active ? "text-white shadow-sm" : "text-[--muted-foreground] hover:text-[--foreground]",
        className,
      )}
      style={active ? { backgroundColor: "var(--primary)" } : undefined}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  )
}