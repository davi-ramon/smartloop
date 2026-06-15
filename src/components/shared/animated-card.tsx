"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  /** Tempo de permanência do mouse (ms) antes de expandir. */
  dwellMs?: number
  /** Fator de expansão (1.1 = +10%). */
  scale?: number
}

/**
 * Card que expande suavemente após o mouse permanecer sobre ele por um tempo
 * (dwell) e recolhe ao sair. Eleva o z-index e a sombra para destacar sobre os
 * vizinhos sem reordenar o layout (usa transform, não reflow).
 */
export function AnimatedCard({
  children,
  className,
  dwellMs = 1800,
  scale = 1.1,
}: AnimatedCardProps) {
  const [expanded, setExpanded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleEnter() {
    timer.current = setTimeout(() => setExpanded(true), dwellMs)
  }
  function handleLeave() {
    if (timer.current) clearTimeout(timer.current)
    setExpanded(false)
  }

  return (
    <motion.div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      animate={{
        scale: expanded ? scale : 1,
        zIndex: expanded ? 20 : 1,
        boxShadow: expanded ? "0 18px 44px rgba(2, 6, 23, 0.16)" : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "relative", borderRadius: "0.75rem" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
