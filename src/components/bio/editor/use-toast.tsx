"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Toast minimalista para o editor /admin/bio.
 * Provider + hook. Auto-dismiss: 4s (success/info), 6s (error).
 * Posição: top-right.
 *
 * API:
 *   const { toast } = useToast()
 *   toast({ title: "Salvo", variant: "success" })
 *   toast({ title: "Erro", description: "...", variant: "error" })
 */

type Variant = "success" | "error" | "info"
interface ToastItem {
  id: number
  title: string
  description?: string
  variant: Variant
}
interface ToastInput {
  title: string
  description?: string
  variant?: Variant
}
interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const Ctx = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const idRef = React.useRef(0)

  function push(input: ToastInput) {
    const id = ++idRef.current
    const item: ToastItem = {
      id, title: input.title, description: input.description,
      variant: input.variant ?? "info",
    }
    setItems((prev) => [...prev, item])
    const ttl = item.variant === "error" ? 6000 : 4000
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id))
    }, ttl)
  }

  function dismiss(id: number) {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <Ctx.Provider value={{ toast: push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border border-[--border] bg-[--card] p-3 shadow-lg",
              )}
            >
              <div className="mt-0.5">
                {t.variant === "success" && <CheckCircle2 className="h-5 w-5" style={{ color: "#10b981" }} />}
                {t.variant === "error" && <AlertCircle className="h-5 w-5" style={{ color: "#ef4444" }} />}
                {t.variant === "info" && <Info className="h-5 w-5 text-[--primary]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[--foreground]">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs text-[--muted-foreground]">{t.description}</p>}
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>")
  return ctx
}