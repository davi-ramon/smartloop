"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  X, User, Smartphone, Scan, FileText, Wrench, Clock,
  Trash2, FileSignature, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { STATUS_META, ALL_STATUSES } from "@/lib/os-status"
import type { ServiceOrder } from "@/lib/data/service-orders"
import type { ServiceOrderStatus } from "@/types/database"
import type { Timestamp } from "firebase/firestore"

function fmtDate(ts?: Timestamp | null): string {
  if (!ts?.toDate) return "—"
  return ts.toDate().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--muted]">
        <Icon className="h-4 w-4 text-[--muted-foreground]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[--muted-foreground]">{label}</p>
        <p className="text-sm text-[--foreground] break-words">{value || "—"}</p>
      </div>
    </div>
  )
}

interface OsDrawerProps {
  os: ServiceOrder | null
  open: boolean
  onClose: () => void
  onChangeStatus: (status: ServiceOrderStatus) => Promise<void>
  onDelete: () => void
}

export function OsDrawer({ os, open, onClose, onChangeStatus, onDelete }: OsDrawerProps) {
  const [changing, setChanging] = useState<ServiceOrderStatus | null>(null)

  async function handleStatus(s: ServiceOrderStatus) {
    if (!os || s === os.status) return
    setChanging(s)
    try {
      await onChangeStatus(s)
    } finally {
      setChanging(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col border-l border-[--border] bg-[--background] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {!os ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[--muted-foreground]">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Carregando OS...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[--muted-foreground]">OS #{os.number}</span>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_META[os.status].bg, STATUS_META[os.status].color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[os.status].dot)} />
                      {STATUS_META[os.status].label}
                    </span>
                  </div>
                  <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  <Field icon={User} label="Cliente" value={os.customerName} />
                  <Field icon={Smartphone} label="Aparelho" value={[os.deviceBrand, os.deviceModel, os.color].filter(Boolean).join(" ")} />
                  {(os.imei || os.imei2) && (
                    <Field icon={Scan} label="IMEI" value={[os.imei, os.imei2].filter(Boolean).join("  /  ")} />
                  )}
                  <Field icon={FileText} label="Defeito relatado" value={os.problem} />
                  {os.conditionNotes && <Field icon={FileText} label="Condição na entrada" value={os.conditionNotes} />}
                  <Field icon={Wrench} label="Técnico responsável" value={os.technicianName} />

                  {/* Orçamento — placeholder até a Sprint de orçamento */}
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--muted]">
                      <FileSignature className="h-4 w-4 text-[--muted-foreground]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[--muted-foreground]">Orçamento</p>
                      <p className="text-sm text-[--muted-foreground]">Nenhum orçamento vinculado.</p>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="rounded-lg border border-[--border] bg-[--muted]/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-[--muted-foreground]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Aberta em {fmtDate(os.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[--muted-foreground]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Atualizada em {fmtDate(os.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Mover etapa */}
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[--muted-foreground]">Mover para etapa</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_STATUSES.map((s) => {
                        const meta = STATUS_META[s]
                        const active = s === os.status
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatus(s)}
                            disabled={active || changing !== null}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
                              active
                                ? cn(meta.bg, meta.color, "border-transparent")
                                : "border-[--border] text-[--muted-foreground] hover:bg-[--muted]"
                            )}
                          >
                            {changing === s ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
                            {meta.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[--border] p-4">
                  <Button variant="outline" onClick={onDelete} className="w-full text-[--destructive] hover:bg-[--destructive]/10 hover:text-[--destructive]">
                    <Trash2 className="h-4 w-4" />
                    Excluir OS
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
