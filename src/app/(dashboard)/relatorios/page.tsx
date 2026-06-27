"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ClipboardList, Clock, CheckCircle2, Package } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchServiceOrders, type ServiceOrder } from "@/lib/data/service-orders"
import { watchSales, type Sale } from "@/lib/data/sales"
import { watchTransactions, isThisMonth, type Transaction } from "@/lib/data/finance"
import { STATUS_META, KANBAN_ORDER } from "@/lib/os-status"
import type { Timestamp } from "firebase/firestore"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function monthKey(ts?: Timestamp | null): string | null {
  if (!ts?.toDate) return null
  const d = ts.toDate()
  return `${d.getFullYear()}-${d.getMonth()}`
}

export default function RelatoriosPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])

  useEffect(() => {
    if (!tenantId) return
    const u1 = watchServiceOrders(tenantId, setOrders, () => {})
    const u2 = watchSales(tenantId, setSales, () => {})
    const u3 = watchTransactions(tenantId, setTxs, () => {})
    return () => { u1(); u2(); u3() }
  }, [tenantId])

  // Últimos 6 meses
  const months = useMemo(() => {
    const arr: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      arr.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] })
    }
    return arr
  }, [])

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sales) { const k = monthKey(s.createdAt); if (k) map[k] = (map[k] || 0) + s.total }
    for (const t of txs) { if (t.type === "income") { const k = monthKey(t.createdAt); if (k) map[k] = (map[k] || 0) + t.amount } }
    return months.map((m) => map[m.key] || 0)
  }, [sales, txs, months])

  const maxRevenue = Math.max(1, ...revenueByMonth)

  const osByStatus = useMemo(() => {
    return KANBAN_ORDER.map((st) => ({ status: st, count: orders.filter((o) => o.status === st).length }))
  }, [orders])
  const maxOs = Math.max(1, ...osByStatus.map((s) => s.count))

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sales) for (const it of s.items) map[it.name] = (map[it.name] || 0) + it.quantity
    const arr = Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5)
    const max = Math.max(1, ...arr.map((a) => a.qty))
    return { arr, max }
  }, [sales])

  const kpis = useMemo(() => {
    const osMonth = orders.filter((o) => isThisMonth(o.createdAt)).length
    const salesMonth = sales.filter((s) => isThisMonth(s.createdAt))
    const revenueMonth = salesMonth.reduce((s, x) => s + x.total, 0) +
      txs.filter((t) => t.type === "income" && isThisMonth(t.createdAt)).reduce((s, x) => s + x.amount, 0)
    const ticket = salesMonth.length ? revenueMonth / salesMonth.length : 0
    const concluded = orders.filter((o) => o.status === "delivered").length
    const taxa = orders.length ? Math.round((concluded / orders.length) * 100) : 0
    return { osMonth, revenueMonth, ticket, taxa }
  }, [orders, sales, txs])

  const KPIS = [
    { label: "OS este mês", value: String(kpis.osMonth), icon: ClipboardList, color: "text-[--primary]", bg: "bg-[--primary]/8" },
    { label: "Receita do mês", value: brl(kpis.revenueMonth), icon: TrendingUp, color: "text-[#10b981]", bg: "bg-[#10b981]/8" },
    { label: "Ticket médio (venda)", value: brl(kpis.ticket), icon: Clock, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/8" },
    { label: "Taxa de conclusão", value: `${kpis.taxa}%`, icon: CheckCircle2, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/8" },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Relatórios" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="border-[--border] shadow-none">
              <CardContent className="flex items-center gap-3 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.bg}`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
                <div><p className="text-2xl font-bold text-[--foreground]">{k.value}</p><p className="text-xs text-[--muted-foreground]">{k.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Faturamento mensal */}
          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-semibold">Faturamento (últimos 6 meses)</CardTitle></CardHeader>
            <CardContent>
              <div className="mt-2 flex h-32 items-end gap-2">
                {revenueByMonth.map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full justify-center" title={brl(val)}>
                      <div className="w-full rounded-t-md bg-[--primary] transition-all duration-500" style={{ height: `${(val / maxRevenue) * 110}px`, minHeight: val > 0 ? 4 : 0 }} />
                    </div>
                    <span className="text-[10px] text-[--muted-foreground]">{months[i].label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* OS por status */}
          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-semibold">Ordens de Serviço por status</CardTitle></CardHeader>
            <CardContent>
              <div className="mt-2 space-y-2.5">
                {osByStatus.map((s) => {
                  const cfg = STATUS_META[s.status]
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <span className={`w-28 truncate text-xs ${cfg.color}`}>{cfg.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--muted]">
                        <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${(s.count / maxOs) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-semibold text-[--foreground]">{s.count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mais vendidos */}
        <Card className="border-[--border] shadow-none">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-[--primary]" />Produtos mais vendidos (PDV)</CardTitle></CardHeader>
          <CardContent>
            {topProducts.arr.length === 0 ? (
              <p className="py-6 text-center text-xs text-[--muted-foreground]">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {topProducts.arr.map((p) => (
                  <div key={p.name} className="flex items-center gap-4">
                    <p className="w-40 truncate text-sm text-[--foreground]">{p.name}</p>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--muted]"><div className="h-full rounded-full bg-[--primary]" style={{ width: `${(p.qty / topProducts.max) * 100}%` }} /></div>
                    <span className="w-8 text-right text-xs font-semibold text-[--foreground]">{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
