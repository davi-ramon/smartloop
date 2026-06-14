"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  User,
  Smartphone,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceOrderStatus } from "@/types/database"

type ViewMode = "kanban" | "list"

const STATUS_CONFIG: Record<ServiceOrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  received:     { label: "Recebido",         color: "text-[#6366f1]", bg: "bg-[#6366f1]/10", dot: "bg-[#6366f1]" },
  analyzing:    { label: "Em análise",       color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]" },
  waiting_part: { label: "Aguardando peça",  color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", dot: "bg-[#ef4444]" },
  ready:        { label: "Pronto",           color: "text-[#10b981]", bg: "bg-[#10b981]/10", dot: "bg-[#10b981]" },
  delivered:    { label: "Entregue",         color: "text-[#64748b]", bg: "bg-[#64748b]/10", dot: "bg-[#64748b]" },
  cancelled:    { label: "Cancelado",        color: "text-[#9ca3af]", bg: "bg-[#9ca3af]/10", dot: "bg-[#9ca3af]" },
}

const MOCK_OS = [
  { id: "1", number: 1, customer: "João Silva",    device: "iPhone 14 Pro",       imei: "35 619108 765010 8", problem: "Tela quebrada — cliente relata queda de cerca de 1,5m",  status: "analyzing"    as ServiceOrderStatus, technician: "Carlos", elapsed: "2d" },
  { id: "2", number: 2, customer: "Maria Santos",  device: "Samsung Galaxy S23",  imei: "35 619108 765020 5", problem: "Não liga após contato com água",                           status: "waiting_part" as ServiceOrderStatus, technician: "André",  elapsed: "1d" },
  { id: "3", number: 3, customer: "Pedro Alves",   device: "Motorola G84",        imei: "35 619108 765030 2", problem: "Bateria não carrega, fica em 0%",                          status: "ready"        as ServiceOrderStatus, technician: "Carlos", elapsed: "4h" },
  { id: "4", number: 4, customer: "Ana Costa",     device: "Xiaomi Redmi Note 12", imei: "86 091403 287050 1", problem: "Tela com listras roxas após queda",                       status: "received"     as ServiceOrderStatus, technician: "—",      elapsed: "1h" },
  { id: "5", number: 5, customer: "Lucas Ferreira", device: "iPhone 13",          imei: "35 619108 765050 3", problem: "Câmera traseira com manchas e foco travado",               status: "analyzing"    as ServiceOrderStatus, technician: "André",  elapsed: "3d" },
  { id: "6", number: 6, customer: "Camila Rocha",  device: "Samsung A54",         imei: "35 619108 765060 0", problem: "Entregue, garantia 90 dias",                               status: "delivered"    as ServiceOrderStatus, technician: "Carlos", elapsed: "5d" },
]

const KANBAN_ORDER: ServiceOrderStatus[] = [
  "received", "analyzing", "waiting_part", "ready", "delivered",
]

function OSCard({ os }: { os: typeof MOCK_OS[0] }) {
  const cfg = STATUS_CONFIG[os.status]
  return (
    <Card className="border-[--border] shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[--muted-foreground]">#{os.number}</span>
            <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[--muted-foreground] hover:text-[--foreground]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-semibold text-[--foreground] leading-snug">{os.customer}</p>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-[--muted-foreground]">
          <Smartphone className="h-3 w-3 shrink-0" />
          <span className="truncate">{os.device}</span>
        </div>

        <p className="mt-2 text-xs text-[--muted-foreground] leading-relaxed line-clamp-2">
          {os.problem}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[--muted-foreground]">
            <User className="h-3 w-3" />
            <span>{os.technician}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[--muted-foreground]">
            <Clock className="h-3 w-3" />
            <span>{os.elapsed}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanView({ os }: { os: typeof MOCK_OS }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-6">
      {KANBAN_ORDER.map((status) => {
        const items = os.filter((o) => o.status === status)
        const cfg = STATUS_CONFIG[status]
        return (
          <div key={status} className="flex w-[260px] shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[60px]">
              {items.map((o) => <OSCard key={o.id} os={o} />)}
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[--border] py-8">
                  <p className="text-xs text-[--muted-foreground]">Nenhuma OS</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ os }: { os: typeof MOCK_OS }) {
  return (
    <div className="px-6">
      <div className="rounded-xl border border-[--border] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[--muted]/50 border-b border-[--border]">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">OS</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden md:table-cell">Aparelho</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden lg:table-cell">Problema</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden sm:table-cell">Técnico</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Aberta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {os.map((o) => {
              const cfg = STATUS_CONFIG[o.status]
              return (
                <tr key={o.id} className="hover:bg-[--muted]/30 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold text-[--muted-foreground]">#{o.number}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[--foreground]">{o.customer}</td>
                  <td className="py-3 px-4 text-[--muted-foreground] hidden md:table-cell">{o.device}</td>
                  <td className="py-3 px-4 text-[--muted-foreground] max-w-[200px] truncate hidden lg:table-cell">{o.problem}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[--muted-foreground] hidden sm:table-cell">{o.technician}</td>
                  <td className="py-3 px-4 text-right text-xs text-[--muted-foreground]">{o.elapsed}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OSPage() {
  const [view, setView] = useState<ViewMode>("kanban")
  const [search, setSearch] = useState("")

  const filtered = MOCK_OS.filter(
    (os) =>
      os.customer.toLowerCase().includes(search.toLowerCase()) ||
      os.device.toLowerCase().includes(search.toLowerCase()) ||
      os.problem.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Ordens de Serviço" action={{ label: "Nova OS", href: "/os/nova" }} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input
            placeholder="Buscar por cliente, aparelho..."
            className="pl-8 h-8 text-sm bg-[--muted] border-transparent focus-visible:border-[--ring]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="flex items-center gap-1.5 rounded-lg border border-[--border] px-3 h-8 text-xs text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--muted] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filtrar
        </button>

        <div className="flex items-center rounded-lg border border-[--border] overflow-hidden" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            onClick={() => setView("kanban")}
            aria-label="Visualização em Kanban"
            aria-pressed={view === "kanban"}
            title="Kanban"
            className={cn(
              "flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors",
              view === "kanban"
                ? "bg-[--primary] text-white"
                : "text-[--muted-foreground] hover:bg-[--muted]"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="Visualização em lista"
            aria-pressed={view === "list"}
            title="Lista"
            className={cn(
              "flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors",
              view === "list"
                ? "bg-[--primary] text-white"
                : "text-[--muted-foreground] hover:bg-[--muted]"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>

        <span className="text-xs text-[--muted-foreground] ml-auto">
          {filtered.length} {filtered.length === 1 ? "ordem" : "ordens"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto pt-4 pb-6">
        {view === "kanban" ? <KanbanView os={filtered} /> : <ListView os={filtered} />}
      </div>
    </div>
  )
}
