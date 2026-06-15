"use client"

import { LayoutGrid, List, Table } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "grid" | "list" | "table"

const MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "grid", label: "Grade", icon: LayoutGrid },
  { id: "list", label: "Lista", icon: List },
  { id: "table", label: "Tabela", icon: Table },
]

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  /** Limita os modos disponíveis (padrão: todos). */
  modes?: ViewMode[]
}

export function ViewModeToggle({ value, onChange, modes }: ViewModeToggleProps) {
  const list = MODES.filter((m) => !modes || modes.includes(m.id))
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-[--border]" role="group" aria-label="Modo de visualização">
      {list.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={value === m.id}
          aria-label={`Visualização em ${m.label}`}
          title={m.label}
          className={cn(
            "flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors",
            value === m.id ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:bg-[--muted]"
          )}
        >
          <m.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
