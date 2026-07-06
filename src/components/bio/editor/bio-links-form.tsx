"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Icons from "lucide-react"
import {
  Plus, GripVertical, ChevronUp, ChevronDown, Edit3, Trash2,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BioLink } from "@/lib/data/bio"
import { BioLinkDialog } from "./bio-link-dialog"

export interface BioLinksFormProps {
  links: BioLink[]
  onChange: (next: BioLink[]) => void
}

export function BioLinksForm({ links, onChange }: BioLinksFormProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [open, setOpen] = React.useState(false)

  const sorted = React.useMemo(
    () => [...links].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [links],
  )

  function openNew() {
    setEditingIndex(null)
    setOpen(true)
  }
  function openEdit(i: number) {
    setEditingIndex(i)
    setOpen(true)
  }

  function handleSave(data: Omit<BioLink, "id" | "createdAt" | "updatedAt" | "ordem">) {
    if (editingIndex === null) {
      // novo link: ordem provisória (será resolvida no save final)
      const ordem = (sorted[sorted.length - 1]?.ordem ?? 0) + 1
      const next: BioLink = {
        id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...data,
        ativo: data.ativo ?? true,
        ordem,
      }
      onChange([...sorted, next])
    } else {
      const target = sorted[editingIndex]
      const next: BioLink = { ...target, ...data }
      const clone = [...sorted]
      clone[editingIndex] = next
      onChange(clone)
    }
  }

  function handleDelete(i: number) {
    const clone = sorted.filter((_, idx) => idx !== i)
    onChange(clone)
  }

  function handleAtivo(i: number, ativo: boolean) {
    const clone = [...sorted]
    clone[i] = { ...clone[i], ativo }
    onChange(clone)
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= sorted.length) return
    const clone = [...sorted]
    ;[clone[i], clone[j]] = [clone[j], clone[i]]
    onChange(clone)
  }

  const editing = editingIndex !== null ? sorted[editingIndex] : undefined

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--border] py-12 text-center text-xs text-[--muted-foreground]">
          Nenhum link. Clique em &ldquo;Novo link&rdquo; abaixo para começar.
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((link, i) => {
              const Ico = ((Icons as unknown) as Record<string, React.ElementType | undefined>)[link.icone] || Icons.Link
              return (
                <motion.li
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-[--border] bg-[--card] px-3 py-2.5",
                    link.ativo === false && "opacity-60",
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-[--muted-foreground]" />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
                    <Ico className="h-4 w-4 text-[--foreground]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[--foreground]">{link.titulo || "(sem titulo)"}</p>
                    <p className="truncate text-[11px] text-[--muted-foreground]">
                      {tamanhoLabel(link.tamanho)}{link.subtitulo ? ` · ${link.subtitulo}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={link.ativo !== false}
                      onCheckedChange={(v) => handleAtivo(i, !!v)}
                      aria-label={`Ativar ${link.titulo}`}
                    />
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      className="rounded-md p-1.5 text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground] disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === sorted.length - 1}
                      aria-label="Mover para baixo"
                      className="rounded-md p-1.5 text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground] disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(i)}
                      aria-label="Editar link"
                      className="rounded-md p-1.5 text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      aria-label="Remover link"
                      className="rounded-md p-1.5 text-[--muted-foreground] hover:bg-[#ef4444]/10 hover:text-[#ef4444]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <Button
        type="button"
        onClick={openNew}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4" /> Novo link
      </Button>

      <BioLinkDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  )
}

function tamanhoLabel(t: BioLink["tamanho"]) {
  return t === "curto" ? "Curto" : t === "medio" ? "Médio" : "Grande"
}