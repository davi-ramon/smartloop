"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import * as Icons from "lucide-react"
import {
  Plus, GripVertical, ChevronUp, ChevronDown, Edit3, Trash2, EyeOff, Eye,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import type { BioLink } from "@/lib/data/bio"
import { getBrandIcon } from "../brand-icons"
import { BioLinkDialog } from "./bio-link-dialog"

export interface BioLinksFormProps {
  links: BioLink[]
  onChange: (next: BioLink[]) => void
}

export function BioLinksForm({ links, onChange }: BioLinksFormProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [open, setOpen] = React.useState(false)

  // Drag and drop (HTML5 nativo)
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null)

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
      const ordem = (sorted[sorted.length - 1]?.ordem ?? 0) + 1
      const next: BioLink = {
        id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...data,
        ativo: data.ativo ?? true,
        ordem,
      }
      onChange([...sorted, next])
      logger.info("bio", "novo link adicionado ao draft", { titulo: data.titulo })
    } else {
      const target = sorted[editingIndex]
      const next: BioLink = { ...target, ...data }
      const clone = [...sorted]
      clone[editingIndex] = next
      onChange(clone)
      logger.info("bio", "link editado no draft", { id: next.id, titulo: data.titulo })
    }
  }

  function handleDelete(i: number) {
    const removed = sorted[i]
    const clone = sorted.filter((_, idx) => idx !== i)
    onChange(clone)
    logger.info("bio", "link removido do draft", { id: removed?.id, titulo: removed?.titulo })
  }

  function handleAtivo(i: number, ativo: boolean) {
    const clone = [...sorted]
    clone[i] = { ...clone[i], ativo }
    onChange(clone)
    logger.info("bio", `link ${ativo ? "ativado" : "pausado"}`, { id: clone[i].id, ativo })
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= sorted.length) return
    const clone = [...sorted]
    ;[clone[i], clone[j]] = [clone[j], clone[i]]
    onChange(clone)
    logger.info("bio", "link reordenado via seta", { from: i, to: j })
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, i: number) {
    setDraggingIdx(i)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(i))
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault() // necessário pra permitir drop
    e.dataTransfer.dropEffect = "move"
    if (dragOverIdx !== i) setDragOverIdx(i)
  }
  function handleDragLeave(i: number) {
    if (dragOverIdx === i) setDragOverIdx(null)
  }
  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault()
    const from = draggingIdx
    if (from === null || from === i) {
      setDraggingIdx(null)
      setDragOverIdx(null)
      return
    }
    const clone = [...sorted]
    const [moved] = clone.splice(from, 1)
    clone.splice(i, 0, moved)
    onChange(clone)
    logger.info("bio", "link reordenado via DnD", { from, to: i, linkId: moved.id })
    setDraggingIdx(null)
    setDragOverIdx(null)
  }
  function handleDragEnd() {
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  const editing = editingIndex !== null ? sorted[editingIndex] : undefined

  return (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#334155] py-12 text-center text-xs text-[#6b7280] dark:text-[#94a3b8]">
          Nenhum link. Clique em &ldquo;Novo link&rdquo; abaixo para começar.
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sorted.map((link, i) => {
              const isInactive = link.ativo === false
              const isDragging = draggingIdx === i
              const isDragOver = dragOverIdx === i && draggingIdx !== null && draggingIdx !== i

              // Resolve ícone: brand tem prioridade; senão lucide
              const BrandIcon = getBrandIcon(link.icone)
              const LucideIcon = ((Icons as unknown) as Record<string, React.ElementType | undefined>)[link.icone]
              const Ico = BrandIcon ?? LucideIcon ?? Icons.Link

              return (
                <motion.li
                  key={link.id}
                  layout
                  draggable
                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, i)}
                  onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, i)}
                  onDragLeave={() => handleDragLeave(i)}
                  onDrop={(e) => handleDrop(e as unknown as React.DragEvent, i)}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: isDragging ? 0.4 : 1,
                    y: 0,
                    scale: isDragging ? 0.97 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  whileHover={!isDragging ? { y: -1, scale: 1.005 } : undefined}
                  whileTap={!isDragging ? { scale: 0.985 } : undefined}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-shadow dark:bg-[#0f172a]",
                    "hover:shadow-md",
                    isInactive
                      ? "border-dashed border-[#9ca3af] opacity-60 grayscale dark:border-[#475569]"
                      : "border-solid border-[#e5e7eb] shadow-sm dark:border-[#334155]",
                    isDragOver && "ring-2 ring-[#2563eb]/40",
                  )}
                >
                  {/* Drag handle (cursor muda) */}
                  <GripVertical
                    className="h-4 w-4 shrink-0 cursor-grab text-[#9ca3af] active:cursor-grabbing dark:text-[#64748b]"
                  />

                  {/* Ícone (brand: wrapper branco p/ preservar cor oficial; lucide: cor direta) */}
                  {BrandIcon ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white">
                      <BrandIcon className="h-5 w-5" />
                    </span>
                  ) : (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <Ico className="h-4 w-4 text-[#111827] dark:text-[#f8fafc]" />
                    </div>
                  )}

                  {/* Conteúdo: título + status + tamanho */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-[#111827] dark:text-[#f8fafc]">
                        {link.titulo || "(sem titulo)"}
                      </p>
                      {isInactive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium text-[#6b7280] dark:bg-[#1e293b] dark:text-[#94a3b8]">
                          <EyeOff className="h-2.5 w-2.5" /> Pausado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-medium text-[#15803d] dark:bg-[#14532d] dark:text-[#86efac]">
                          <Eye className="h-2.5 w-2.5" /> Ativo
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                      {tamanhoLabel(link.tamanho)}{link.subtitulo ? ` · ${link.subtitulo}` : ""}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={!isInactive}
                      onCheckedChange={(v) => handleAtivo(i, !!v)}
                      aria-label={`${isInactive ? "Ativar" : "Pausar"} ${link.titulo}`}
                    />
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para cima"
                      className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] disabled:opacity-30 dark:text-[#94a3b8] dark:hover:bg-[#1e293b] dark:hover:text-[#f8fafc]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === sorted.length - 1}
                      aria-label="Mover para baixo"
                      className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] disabled:opacity-30 dark:text-[#94a3b8] dark:hover:bg-[#1e293b] dark:hover:text-[#f8fafc]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(i)}
                      aria-label="Editar link"
                      className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:bg-[#1e293b] dark:hover:text-[#f8fafc]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      aria-label="Remover link"
                      className="rounded-md p-1.5 text-[#6b7280] hover:bg-[#fee2e2] hover:text-[#dc2626] dark:text-[#94a3b8] dark:hover:bg-[#7f1d1d]/40 dark:hover:text-[#fca5a5]"
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

      {/* key={editingIndex ?? "new"} força remontagem ao trocar o link,
          garantindo que useForm pegue os novos defaultValues. */}
      <BioLinkDialog
        key={editingIndex === null ? "new" : `edit-${editingIndex}-${sorted[editingIndex]?.id}`}
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