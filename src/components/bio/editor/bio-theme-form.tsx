"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { BioProfile } from "@/lib/data/bio"

export interface BioThemeFormProps {
  value: BioProfile
  onChange: (patch: Partial<BioProfile>) => void
}

export function BioThemeForm({ value, onChange }: BioThemeFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="primary" className="mb-2 block">Cor primária</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={value.primary}
            onChange={(e) => onChange({ primary: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded-md border border-[--border]"
            aria-label="Seletor de cor"
          />
          <Input
            id="primary"
            value={value.primary}
            onChange={(e) => onChange({ primary: e.target.value })}
            placeholder="#2563eb"
            className="font-mono"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[--muted-foreground]">
          Cor dos botões e destaque de texto. Hex de 6 dígitos.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Estilo do fundo</Label>
        <div className="grid grid-cols-2 gap-3">
          <SwatchOption
            selected={value.bgStyle === "gradient"}
            onClick={() => onChange({ bgStyle: "gradient" })}
            label="Gradiente"
            previewStyle={{ background: `linear-gradient(135deg, ${value.primary}, #7c3aed)` }}
          />
          <SwatchOption
            selected={value.bgStyle === "solid"}
            onClick={() => onChange({ bgStyle: "solid" })}
            label="Sólido"
            previewStyle={{ backgroundColor: value.primary }}
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Estilo do texto</Label>
        <div className="grid grid-cols-2 gap-3">
          <SwatchOption
            selected={value.textStyle === "light"}
            onClick={() => onChange({ textStyle: "light" })}
            label="Claro"
            previewStyle={{ backgroundColor: value.primary, color: "#fff" }}
          />
          <SwatchOption
            selected={value.textStyle === "dark"}
            onClick={() => onChange({ textStyle: "dark" })}
            label="Escuro"
            previewStyle={{ backgroundColor: "#0f172a", color: "#fff" }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[--muted-foreground]">
          Cor dos títulos e descrições. Contraste com o fundo é importante para legibilidade.
        </p>
      </div>
    </div>
  )
}

interface SwatchProps {
  selected: boolean
  onClick: () => void
  label: string
  previewStyle: React.CSSProperties
}
function SwatchOption({ selected, onClick, label, previewStyle }: SwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
        selected ? "border-[--primary]" : "border-[--border] hover:border-[--muted-foreground]",
      )}
      style={selected ? { boxShadow: "0 0 0 2px var(--primary)" } : undefined}
    >
      <div
        className="h-12 w-full rounded-md"
        style={previewStyle}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[--foreground]">{label}</span>
        {selected && <Check className="h-4 w-4 text-[--primary]" />}
      </div>
    </button>
  )
}
