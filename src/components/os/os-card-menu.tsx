"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface MenuItem {
  label: string
  icon: React.ElementType
  onClick: () => void
  danger?: boolean
  separatorBefore?: boolean
}

interface OsCardMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

const MENU_W = 200

export function OsCardMenu({ x, y, items, onClose }: OsCardMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function handlePointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  if (!mounted) return null

  // Evita que o menu saia da tela.
  const left = Math.min(x, window.innerWidth - MENU_W - 8)
  const top = Math.min(y, window.innerHeight - (items.length * 40 + 16))

  return createPortal(
    <div
      ref={ref}
      style={{ top: Math.max(8, top), left: Math.max(8, left), width: MENU_W }}
      className="fixed z-[110] animate-rise rounded-lg border border-[--border] bg-[--popover] p-1 shadow-xl"
      role="menu"
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separatorBefore && <div className="my-1 h-px bg-[--border]" />}
          <button
            role="menuitem"
            onClick={() => { item.onClick(); onClose() }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              item.danger
                ? "text-[--destructive] hover:bg-[--destructive]/10"
                : "text-[--foreground] hover:bg-[--muted]"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
