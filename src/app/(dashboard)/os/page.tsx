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
  Eye, CheckCircle2, XCircle, Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceOrderStatus } from "@/types/database"
import { useAuth } from "@/lib/firebase/auth-context"
import {
  watchServiceOrders, updateServiceOrderStatus, deleteServiceOrder,
  relativeTime, type ServiceOrder,
} from "@/lib/data/service-orders"
import { STATUS_META, KANBAN_ORDER } from "@/lib/os-status"
import { OsCardMenu, type MenuItem } from "@/components/os/os-card-menu"
import { OsDrawer } from "@/components/os/os-drawer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

type ViewMode = "kanban" | "list"

interface OSView {
  id: string
  number: number
  customer: string
  device: string
  problem: string
  status: ServiceOrderStatus
  technician: string
  elapsed: string
}

function toView(o: ServiceOrder): OSView {
  return {
    id: o.id,
    number: o.number,
    customer: o.customerName,
    device: [o.deviceBrand, o.deviceModel].filter(Boolean).join(" ") || "Aparelho não informado",
    problem: o.problem || "Sem descrição",
    status: o.status,
    technician: o.technicianName || "—",
    elapsed: relativeTime(o.createdAt),
  }
}

interface CardHandlers {
  onOpen: (id: string) => void
  onMenu: (os: OSView, x: number, y: number) => void
}

function OSCard({ os, index = 0, onOpen, onMenu }: { os: OSView; index?: number } & CardHandlers) {
  const cfg = STATUS_META[os.status]
  return (
    <Card
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => onOpen(os.id)}
      onContextMenu={(e) => { e.preventDefault(); onMenu(os, e.clientX, e.clientY) }}
      className={cn(
        "animate-rise cursor-pointer border-[--border] shadow-none transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md group",
        cfg.tint
      )}
    >
      <CardContent className="p-3.5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[--muted-foreground]">#{os.number}</span>
            <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
          </div>
          <button
            aria-label="Ações da OS"
            onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenu(os, r.left, r.bottom + 4) }}
            className="text-[--muted-foreground] opacity-0 transition-opacity hover:text-[--foreground] group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-semibold leading-snug text-[--foreground]">{os.customer}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[--muted-foreground]">
          <Smartphone className="h-3 w-3 shrink-0" />
          <span className="truncate">{os.device}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[--muted-foreground]">{os.problem}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[--muted-foreground]"><User className="h-3 w-3" /><span>{os.technician}</span></div>
          <div className="flex items-center gap-1 text-[10px] text-[--muted-foreground]"><Clock className="h-3 w-3" /><span>{os.elapsed}</span></div>
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanView({ os, ...handlers }: { os: OSView[] } & CardHandlers) {
  return (
    <div className="flex gap-4 overflow-x-auto px-6 pb-4">
      {KANBAN_ORDER.map((status) => {
        const items = os.filter((o) => o.status === status)
        const cfg = STATUS_META[status]
        return (
          <div key={status} className="flex w-[260px] shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
              </div>
              <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold", cfg.bg, cfg.color)}>{items.length}</span>
            </div>
            <div className="flex min-h-[60px] flex-col gap-2">
              {items.map((o, i) => <OSCard key={o.id} os={o} index={i} {...handlers} />)}
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

function ListView({ os, onOpen, onMenu }: { os: OSView[] } & CardHandlers) {
  return (
    <div className="px-6">
      <div className="overflow-hidden rounded-xl border border-[--border]">
        <table className="w-full text-sm">
          <thead className="border-b border-[--border] bg-[--muted]/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">OS</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Cliente</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] md:table-cell">Aparelho</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] sm:table-cell">Técnico</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Aberta</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border]">
            {os.map((o) => {
              const cfg = STATUS_META[o.status]
              return (
                <tr
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  onContextMenu={(e) => { e.preventDefault(); onMenu(o, e.clientX, e.clientY) }}
                  className="cursor-pointer transition-colors hover:bg-[--muted]/30"
                >
                  <td className="px-4 py-3"><span className="text-xs font-bold text-[--muted-foreground]">#{o.number}</span></td>
                  <td className="px-4 py-3 font-medium text-[--foreground]">{o.customer}</td>
                  <td className="hidden px-4 py-3 text-[--muted-foreground] md:table-cell">{o.device}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.bg, cfg.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[--muted-foreground] sm:table-cell">{o.technician}</td>
                  <td className="px-4 py-3 text-right text-xs text-[--muted-foreground]">{o.elapsed}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      aria-label="Ações da OS"
                      onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenu(o, r.left, r.bottom + 4) }}
                      className="text-[--muted-foreground] hover:text-[--foreground]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
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

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ os: OSView; x: number; y: number } | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    () => views.filter((os) =>
      os.customer.toLowerCase().includes(search.toLowerCase()) ||
      os.device.toLowerCase().includes(search.toLowerCase()) ||
      os.problem.toLowerCase().includes(search.toLowerCase())
    ),
    [views, search]
  )

  const selectedOs = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId])

  async function changeStatus(id: string, status: ServiceOrderStatus) {
    if (!tenantId) return
    try {
      await updateServiceOrderStatus(tenantId, id, status)
    } catch {
      setError("Não foi possível mudar o status da OS.")
    }
  }

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try {
      await deleteServiceOrder(tenantId, confirmDel.id)
      if (selectedId === confirmDel.id) setSelectedId(null)
      setConfirmDel(null)
    } catch {
      setError("Não foi possível excluir a OS.")
    } finally {
      setDeleting(false)
    }
  }

  function buildMenu(os: OSView): MenuItem[] {
    const items: MenuItem[] = [
      { label: "Ver detalhes", icon: Eye, onClick: () => setSelectedId(os.id) },
    ]
    if (os.status !== "ready" && os.status !== "delivered" && os.status !== "cancelled") {
      items.push({ label: "Marcar como pronto", icon: CheckCircle2, onClick: () => changeStatus(os.id, "ready") })
    }
    if (os.status !== "cancelled") {
      items.push({ label: "Cancelar OS", icon: XCircle, onClick: () => changeStatus(os.id, "cancelled") })
    }
    items.push({ label: "Excluir", icon: Trash2, danger: true, separatorBefore: true, onClick: () => setConfirmDel({ id: os.id, label: `OS #${os.number} — ${os.customer}` }) })
    return items
  }

  const handlers: CardHandlers = {
    onOpen: (id) => setSelectedId(id),
    onMenu: (os, x, y) => setMenu({ os, x, y }),
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Ordens de Serviço" action={{ label: "Nova OS", href: "/os/nova" }} />

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar por cliente, aparelho..." className="h-8 border-transparent bg-[--muted] pl-8 text-sm focus-visible:border-[--ring]" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[--border] px-3 text-xs text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground]">
          <Filter className="h-3.5 w-3.5" />
          Filtrar
        </button>
        <div className="flex items-center overflow-hidden rounded-lg border border-[--border]" role="group" aria-label="Modo de visualização">
          <button type="button" onClick={() => setView("kanban")} aria-label="Visualização em Kanban" aria-pressed={view === "kanban"} title="Kanban" className={cn("flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors", view === "kanban" ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:bg-[--muted]")}>
            <LayoutGrid className="h-3.5 w-3.5" /><span className="hidden sm:inline">Kanban</span>
          </button>
          <button type="button" onClick={() => setView("list")} aria-label="Visualização em lista" aria-pressed={view === "list"} title="Lista" className={cn("flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors", view === "list" ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:bg-[--muted]")}>
            <List className="h-3.5 w-3.5" /><span className="hidden sm:inline">Lista</span>
          </button>
        </div>
        <span className="ml-auto text-xs text-[--muted-foreground]">{filtered.length} {filtered.length === 1 ? "ordem" : "ordens"}</span>
      </div>

      <div className="flex-1 overflow-x-auto pb-6 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando ordens de serviço...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : views.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><ClipboardList className="h-7 w-7 text-[--muted-foreground]" /></div>
            <div>
              <p className="font-semibold text-[--foreground]">Nenhuma ordem de serviço ainda</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">Abra sua primeira OS para começar a acompanhar os reparos.</p>
            </div>
            <Button asChild><Link href="/os/nova">Abrir primeira OS</Link></Button>
          </div>
        ) : view === "kanban" ? (
          <KanbanView os={filtered} {...handlers} />
        ) : (
          <ListView os={filtered} {...handlers} />
        )}
      </div>

      {/* Menu flutuante (3-pontos + clique direito) */}
      {menu && (
        <OsCardMenu x={menu.x} y={menu.y} items={buildMenu(menu.os)} onClose={() => setMenu(null)} />
      )}

      {/* Drawer de detalhes */}
      <OsDrawer
        os={selectedOs}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onChangeStatus={(s) => changeStatus(selectedId!, s)}
        onDelete={() => selectedOs && setConfirmDel({ id: selectedOs.id, label: `OS #${selectedOs.number} — ${selectedOs.customerName}` })}
      />

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDel !== null}
        title="Excluir ordem de serviço?"
        description={confirmDel ? `${confirmDel.label} será removida permanentemente. Esta ação não pode ser desfeita.` : ""}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
