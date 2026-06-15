"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  LayoutGrid, List, Search, Filter, Clock, User, Smartphone,
  MoreHorizontal, Loader2, AlertCircle, ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceOrderStatus } from "@/types/database"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchServiceOrders, relativeTime, type ServiceOrder } from "@/lib/data/service-orders"

type ViewMode = "kanban" | "list"

interface OSView {
  id: string
  number: number
  customer: string
  device: string
  imei?: string
  problem: string
  status: ServiceOrderStatus
  technician: string
  elapsed: string
}

const STATUS_CONFIG: Record<ServiceOrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  received:     { label: "Recebido",         color: "text-[#6366f1]", bg: "bg-[#6366f1]/10", dot: "bg-[#6366f1]" },
  analyzing:    { label: "Em análise",       color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]" },
  waiting_part: { label: "Aguardando peça",  color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", dot: "bg-[#ef4444]" },
  ready:        { label: "Pronto",           color: "text-[#10b981]", bg: "bg-[#10b981]/10", dot: "bg-[#10b981]" },
  delivered:    { label: "Entregue",         color: "text-[#64748b]", bg: "bg-[#64748b]/10", dot: "bg-[#64748b]" },
  cancelled:    { label: "Cancelado",        color: "text-[#9ca3af]", bg: "bg-[#9ca3af]/10", dot: "bg-[#9ca3af]" },
}

const KANBAN_ORDER: ServiceOrderStatus[] = [
  "received", "analyzing", "waiting_part", "ready", "delivered",
]

function toView(o: ServiceOrder): OSView {
  return {
    id: o.id,
    number: o.number,
    customer: o.customerName,
    device: [o.deviceBrand, o.deviceModel].filter(Boolean).join(" ") || "Aparelho não informado",
    imei: o.imei,
    problem: o.problem || "Sem descrição",
    status: o.status,
    technician: o.technicianName || "—",
    elapsed: relativeTime(o.createdAt),
  }
}

function OSCard({ os, index = 0 }: { os: OSView; index?: number }) {
  const cfg = STATUS_CONFIG[os.status]
  return (
    <Card
      style={{ animationDelay: `${index * 60}ms` }}
      className="animate-rise border-[--border] shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group"
    >
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

        <p className="mt-2 text-xs text-[--muted-foreground] leading-relaxed line-clamp-2">{os.problem}</p>

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

function KanbanView({ os }: { os: OSView[] }) {
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
              {items.map((o, i) => <OSCard key={o.id} os={o} index={i} />)}
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

function ListView({ os }: { os: OSView[] }) {
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
                  <td className="py-3 px-4"><span className="text-xs font-bold text-[--muted-foreground]">#{o.number}</span></td>
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
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>("kanban")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchServiceOrders(
      tenantId,
      (list) => { setOrders(list); setError(null); setLoading(false) },
      () => { setError("Não foi possível carregar as ordens de serviço."); setLoading(false) }
    )
    return () => unsub()
  }, [tenantId])

  const views = useMemo(() => orders.map(toView), [orders])
  const filtered = useMemo(
    () =>
      views.filter(
        (os) =>
          os.customer.toLowerCase().includes(search.toLowerCase()) ||
          os.device.toLowerCase().includes(search.toLowerCase()) ||
          os.problem.toLowerCase().includes(search.toLowerCase())
      ),
    [views, search]
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
          <button type="button" onClick={() => setView("kanban")} aria-label="Visualização em Kanban" aria-pressed={view === "kanban"} title="Kanban"
            className={cn("flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors", view === "kanban" ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:bg-[--muted]")}>
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button type="button" onClick={() => setView("list")} aria-label="Visualização em lista" aria-pressed={view === "list"} title="Lista"
            className={cn("flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors", view === "list" ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:bg-[--muted]")}>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Carregando ordens de serviço...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10">
              <AlertCircle className="h-7 w-7 text-[--destructive]" />
            </div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : views.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]">
              <ClipboardList className="h-7 w-7 text-[--muted-foreground]" />
            </div>
            <div>
              <p className="font-semibold text-[--foreground]">Nenhuma ordem de serviço ainda</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">Abra sua primeira OS para começar a acompanhar os reparos.</p>
            </div>
            <Button asChild>
              <Link href="/os/nova">Abrir primeira OS</Link>
            </Button>
          </div>
        ) : view === "kanban" ? (
          <KanbanView os={filtered} />
        ) : (
          <ListView os={filtered} />
        )}
      </div>
    </div>
  )
}
