"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchServiceOrders, type ServiceOrder } from "@/lib/data/service-orders"

const DAY = 24 * 60 * 60 * 1000

interface WarrantyRow {
  id: string
  number: number
  customer: string
  device: string
  service: string
  technician: string
  endDate: Date
  daysLeft: number
  status: "active" | "expiring" | "expired"
}

const STATUS_CFG = {
  active: { label: "Ativa", color: "text-[#10b981]", bg: "bg-[#10b981]/10", icon: CheckCircle2 },
  expiring: { label: "Vencendo", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", icon: AlertTriangle },
  expired: { label: "Expirada", color: "text-[#9ca3af]", bg: "bg-[--muted]", icon: Clock },
}

export default function GarantiaPage() {
  const { profile, tenant } = useAuth()
  const tenantId = profile?.tenantId
  const warrantyDays = tenant?.warrantyDays ?? 90
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchServiceOrders(tenantId, (list) => { setOrders(list); setLoading(false) }, () => setLoading(false))
    return () => unsub()
  }, [tenantId])

  const rows = useMemo<WarrantyRow[]>(() => {
    const now = Date.now()
    return orders
      .filter((o) => o.status === "delivered" && o.updatedAt?.toDate)
      .map((o) => {
        const delivered = o.updatedAt!.toDate().getTime()
        const end = delivered + warrantyDays * DAY
        const daysLeft = Math.ceil((end - now) / DAY)
        const status: WarrantyRow["status"] = daysLeft < 0 ? "expired" : daysLeft <= 7 ? "expiring" : "active"
        return {
          id: o.id,
          number: o.number,
          customer: o.customerName,
          device: [o.deviceBrand, o.deviceModel].filter(Boolean).join(" ") || "—",
          service: o.problem || "Reparo",
          technician: o.technicianName || "—",
          endDate: new Date(end),
          daysLeft,
          status,
        }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [orders, warrantyDays])

  const active = rows.filter((r) => r.status === "active").length
  const expiring = rows.filter((r) => r.status === "expiring").length

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Garantia" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { v: active, l: "Garantias ativas", icon: Shield, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
            { v: expiring, l: "Vencendo (≤7 dias)", icon: AlertTriangle, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
            { v: warrantyDays, l: "Dias de garantia padrão", icon: Clock, color: "text-[--muted-foreground]", bg: "bg-[--muted]" },
          ].map((s) => (
            <Card key={s.l} className="border-[--border] shadow-none">
              <CardContent className="flex items-center gap-3 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-2xl font-bold text-[--foreground]">{s.v}</p><p className="text-xs text-[--muted-foreground]">{s.l}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-[--muted-foreground]"><Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando...</p></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--muted]"><Shield className="h-7 w-7 text-[--muted-foreground]" /></div>
            <p className="text-sm text-[--muted-foreground]">As garantias aparecem aqui quando você marca uma OS como <strong>entregue</strong>.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[--border]">
            <table className="w-full text-sm">
              <thead className="border-b border-[--border] bg-[--muted]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">OS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Cliente</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] md:table-cell">Aparelho</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] lg:table-cell">Serviço</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Vencimento</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {rows.map((r) => {
                  const cfg = STATUS_CFG[r.status]
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-[--muted]/30">
                      <td className="px-4 py-3 text-xs font-bold text-[--muted-foreground]">#{r.number}</td>
                      <td className="px-4 py-3 font-medium text-[--foreground]">{r.customer}</td>
                      <td className="hidden px-4 py-3 text-[--muted-foreground] md:table-cell">{r.device}</td>
                      <td className="hidden max-w-[200px] truncate px-4 py-3 text-[--muted-foreground] lg:table-cell">{r.service}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[--foreground]">{r.endDate.toLocaleDateString("pt-BR")}</p>
                        <p className={`text-xs ${r.daysLeft > 7 ? "text-[--muted-foreground]" : r.daysLeft >= 0 ? "font-medium text-[#f59e0b]" : "text-[#9ca3af]"}`}>
                          {r.daysLeft >= 0 ? `${r.daysLeft} dias restantes` : `Expirou há ${Math.abs(r.daysLeft)} dias`}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
