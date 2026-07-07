"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  ANIMACAO_DEFAULTS,
  type BioAnimacaoEstilo,
  type BioAnimacaoVelocidade,
  type BioProfile,
} from "@/lib/data/bio"

export interface BioThemeFormProps {
  value: BioProfile
  onChange: (patch: Partial<BioProfile>) => void
}

export function BioThemeForm({ value, onChange }: BioThemeFormProps) {
  const anim = value.animacao ?? ANIMACAO_DEFAULTS

  function patchAnim(patch: Partial<typeof anim>) {
    onChange({ animacao: { ...anim, ...patch } })
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="primary" className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Cor primária</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={value.primary}
            onChange={(e) => onChange({ primary: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded-md border border-[#e5e7eb] dark:border-[#334155]"
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
        <p className="mt-1.5 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Cor dos botões e destaque de texto. Hex de 6 dígitos.
        </p>
      </div>

      <div>
        <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Estilo do fundo</Label>
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
        <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Estilo do texto</Label>
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
        <p className="mt-1.5 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Cor dos títulos e descrições. Contraste com o fundo é importante para legibilidade.
        </p>
      </div>

      <hr className="border-[#e5e7eb] dark:border-[#334155]" />

      <div>
        <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Animação de fundo</Label>
        <p className="mb-3 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Procedural via CSS (sem vídeo/GIF). Lenta, sutil, tecnológica.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {(
            [
              { value: "aurora", label: "Aurora" },
              { value: "grade", label: "Grade" },
              { value: "ondas", label: "Ondas" },
              { value: "particulas", label: "Partículas" },
              { value: "desligado", label: "Desligado" },
            ] as { value: BioAnimacaoEstilo; label: string }[]
          ).map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => patchAnim({ estilo: o.value })}
              className={cn(
                "rounded-lg border px-2 py-2 text-[11px] font-medium transition-all",
                anim.estilo === o.value
                  ? "text-white"
                  : "border-[#e5e7eb] text-[#111827] hover:border-[#9ca3af] dark:border-[#334155] dark:text-[#f8fafc]",
              )}
              style={
                anim.estilo === o.value
                  ? { backgroundColor: "var(--primary)", borderColor: "var(--primary)" }
                  : undefined
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {anim.estilo !== "desligado" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ColorPickerField
              label="Cor primária"
              value={anim.corPrimaria ?? "#2563eb"}
              onChange={(v) => patchAnim({ corPrimaria: v })}
            />
            <ColorPickerField
              label="Cor secundária"
              value={anim.corSecundaria ?? "#7c3aed"}
              onChange={(v) => patchAnim({ corSecundaria: v })}
            />
          </div>

          <div>
            <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Velocidade</Label>
            <div className="inline-flex w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-1 dark:border-[#334155] dark:bg-[#0f172a]">
              {(
                [
                  { value: "lenta", label: "Lenta" },
                  { value: "normal", label: "Normal" },
                  { value: "rapida", label: "Rápida" },
                ] as { value: BioAnimacaoVelocidade; label: string }[]
              ).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => patchAnim({ velocidade: o.value })}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    anim.velocidade === o.value
                      ? "text-white shadow-sm"
                      : "text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f8fafc]",
                  )}
                  style={anim.velocidade === o.value ? { backgroundColor: "var(--primary)" } : undefined}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">
              Intensidade <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">({anim.intensidade}%)</span>
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={anim.intensidade}
              onChange={(e) => patchAnim({ intensidade: Number(e.target.value) })}
              className="w-full accent-[--primary]"
            />
          </div>
        </>
      )}
    </div>
  )
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
}
function ColorPickerField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-[#111827] dark:text-[#f8fafc]">{label}</Label>
      <div className="flex gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-md border border-[#e5e7eb] dark:border-[#334155]"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-xs"
        />
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
