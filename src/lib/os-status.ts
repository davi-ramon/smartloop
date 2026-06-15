import type { ServiceOrderStatus } from "@/types/database"

export interface StatusMeta {
  label: string
  color: string
  bg: string
  dot: string
  /** Tonalidade suave aplicada ao fundo do card naquela etapa. */
  tint: string
}

export const STATUS_META: Record<ServiceOrderStatus, StatusMeta> = {
  received:     { label: "Recebido",        color: "text-[#6366f1]", bg: "bg-[#6366f1]/10", dot: "bg-[#6366f1]", tint: "bg-[#6366f1]/[0.04]" },
  analyzing:    { label: "Em análise",      color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]", tint: "bg-[#f59e0b]/[0.05]" },
  waiting_part: { label: "Aguardando peça", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", dot: "bg-[#ef4444]", tint: "bg-[#ef4444]/[0.05]" },
  ready:        { label: "Pronto",          color: "text-[#10b981]", bg: "bg-[#10b981]/10", dot: "bg-[#10b981]", tint: "bg-[#10b981]/[0.05]" },
  delivered:    { label: "Entregue",        color: "text-[#64748b]", bg: "bg-[#64748b]/10", dot: "bg-[#64748b]", tint: "bg-transparent" },
  cancelled:    { label: "Cancelado",       color: "text-[#9ca3af]", bg: "bg-[#9ca3af]/10", dot: "bg-[#9ca3af]", tint: "bg-transparent" },
}

/** Colunas do Kanban (sem "cancelado", que é estado terminal lateral). */
export const KANBAN_ORDER: ServiceOrderStatus[] = [
  "received", "analyzing", "waiting_part", "ready", "delivered",
]

/** Todos os status disponíveis para troca manual. */
export const ALL_STATUSES: ServiceOrderStatus[] = [
  ...KANBAN_ORDER, "cancelled",
]
