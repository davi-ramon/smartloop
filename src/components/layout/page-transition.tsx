"use client"

import { motion } from "motion/react"
import { usePathname } from "next/navigation"

/**
 * Anima a entrada do conteúdo a cada troca de rota (surge de baixo para cima,
 * suave). Re-monta via key = pathname, então a animação roda em toda navegação.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}
