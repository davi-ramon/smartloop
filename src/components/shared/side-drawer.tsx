"use client"

import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * Painel lateral genérico que desliza da direita e DESFOCA o fundo
 * (sem escurecer demais), dando foco ao conteúdo do drawer.
 */
export function SideDrawer({ open, onClose, title, description, children, footer }: SideDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[105] flex w-full max-w-md flex-col border-l border-[--border] shadow-2xl"
            style={{ backgroundColor: "var(--background)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-[--border] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[--foreground]">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-[--muted-foreground]">{description}</p>}
              </div>
              <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <div className="border-t border-[--border] p-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
