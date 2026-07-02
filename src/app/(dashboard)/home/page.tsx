"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/firebase/auth-context"
import { useWorkspace } from "@/lib/firebase/workspace-context"
import { PeriodFilter } from "@/components/home/period-filter"
import { AreaChart, BarChart, Donut } from "@/components/charts/mini-charts"
import { relativeTime } from "@/lib/data/service-orders"
import { STATUS_META, KANBAN_ORDER } from "@/lib/os-status"
import { rangeFor, isWithin, bucketByDay, type PeriodKey } from "@/lib/period"
import { logger } from "@/lib/logger"
import {
  ClipboardList, Users, TrendingUp, CheckCircle2, ShoppingCart, Zap, ArrowRight,
  Clock, Settings, UserCog, Truck, Package, AlertTriangle, PackageCheck, PauseCircle,
  Receipt, Boxes, type LucideIcon,
} from "lucide-react"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

const STATUS_HEX: Record<string, string> = {
  received: "#6366f1", analyzing: "#f59e0b", waiting_part: "#ef4444", ready: "#10b981", delivered: "#64748b",
}

const QUICK_ACTIONS: { label: string; description: string; href: string; icon: LucideIcon; color: string }[] = [
  { label: "Nova OS", description: "Abrir ordem de serviço", href: "/os/nova", icon: ClipboardList, color: "#2563eb" },
  { label: "Nova Venda", description: "Registrar venda no PDV", href: "/pdv", icon: ShoppingCart, color: "#10b981" },
  { label: "Orçamento Rápido", description: "Criar orçamento sem OS", href: "/orcamento-rapido", icon: Zap, color: "#ea580c" },
  { label: "Novo Cliente", description: "Cadastrar cliente", href: "/clientes/novo", icon: Users, color: "#8b5cf6" },
  { label: "Novo Técnico", description: "Cadastrar técnico", href: "/tecnicos", icon: UserCog, color: "#0ea5e9" },
  { label: "Novo Fornecedor", description: "Cadastrar fornecedor", href: "/fornecedores", icon: Truck, color: "#f59e0b" },
  { label: "Abrir PDV", description: "Ponto de venda", href: "/pdv", icon: Receipt, color: "#14b8a6" },
  { label: "Estoque", description: "Peças e produtos", href: "/estoque", icon: Package, color: "#6366f1" },
]

export default function HomePage() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(" ")[0]
  const { orders, customers, sales, transactions, parts, loading, errors } = useWorkspace()

  const [period, setPeriod] = useState<PeriodKey>("30d")
  const [custom, setCustom] = useState({ start: "", end: "" })

  const range = useMemo(() => rangeFor(period, custom), [period, custom])

  const stats = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- leitura intencional do relógio para "OS paradas"
    const now = Date.now()
    const open = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    const abertas = open.length
    const waitingPart = orders.filter((o) => o.status === "waiting_part").length
    const ready = orders.filter((o) => o.status === "ready").length
    const concluidas = orders.filter((o) => o.status === "delivered" && isWithin(o.updatedAt, range)).length
    const criadasPeriodo = orders.filter((o) => isWithin(o.createdAt, range)).length

    const paradas = open.filter((o) => {
      const ms = o.updatedAt?.toDate?.().getTime()
      return ms != null && now - ms > 7 * 86_400_000
    }).length

    const vendasPeriodo = sales.filter((s) => isWithin(s.createdAt, range))
    const salesTotal = vendasPeriodo.reduce((sum, s) => sum + s.total, 0)
    const incomeTotal = transactions
      .filter((t) => t.type === "income" && isWithin(t.createdAt, range))
      .reduce((sum, t) => sum + t.amount, 0)
    const faturamento = salesTotal + incomeTotal
    const ticketMedio = vendasPeriodo.length ? salesTotal / vendasPeriodo.length : 0

    const clientesAtivos = customers.filter((c) => c.active !== false).length
    const novosClientes = customers.filter((c) => isWithin(c.createdAt, range)).length

    const estoqueBaixo = parts.filter((p) => p.stock <= (p.minStock ?? 0) || p.stock === 0).length
    const valorEstoque = parts.reduce((sum, p) => sum + (p.cost ?? 0) * (p.stock ?? 0), 0)

    return {
      abertas, waitingPart, ready, concluidas, criadasPeriodo, paradas,
      faturamento, ticketMedio, vendasCount: vendasPeriodo.length,
      clientesAtivos, novosClientes, estoqueBaixo, valorEstoque,
    }
  }, [orders, customers, sales, transactions, parts, range])

  // Séries dos gráficos
  const osPorDia = useMemo(() => bucketByDay(orders, (o) => o.createdAt, () => 1, range), [orders, range])
  const faturamentoPorDia = useMemo(() => {
    const entries = [
      ...sales.map((s) => ({ ts: s.createdAt, amount: s.total })),
      ...transactions.filter((t) => t.type === "income").map((t) => ({ ts: t.createdAt, amount: t.amount })),
    ]
    return bucketByDay(entries, (e) => e.ts, (e) => e.amount, range)
  }, [sales, transactions, range])

  const statusSegments = useMemo(
    () => KANBAN_ORDER.map((s) => ({
      label: STATUS_META[s].label,
      value: orders.filter((o) => o.status === s).length,
      color: STATUS_HEX[s],
    })),
    [orders],
  )

  const recentOS = useMemo(() => orders.slice(0, 6), [orders])

  const primary = [
    { label: "OS abertas", value: String(stats.abertas), sub: `${stats.criadasPeriodo} novas no período`, icon: ClipboardList, color: "#2563eb" },
    { label: "Faturamento no período", value: brl(stats.faturamento), sub: `${stats.vendasCount} vendas`, icon: TrendingUp, color: "#ea580c" },
    { label: "Concluídas no período", value: String(stats.concluidas), sub: "OS entregues", icon: CheckCircle2, color: "#10b981" },
    { label: "Clientes ativos", value: String(stats.clientesAtivos), sub: `+${stats.novosClientes} novos`, icon: Users, color: "#8b5cf6" },
  ]

  const secondary = [
    { label: "Aguardando peça", value: String(stats.waitingPart), icon: AlertTriangle, color: "#ef4444" },
    { label: "Prontas p/ entrega", value: String(stats.ready), icon: PackageCheck, color: "#10b981" },
    { label: "OS paradas (7d+)", value: String(stats.paradas), icon: PauseCircle, color: "#64748b" },
    { label: "Ticket médio", value: brl(stats.ticketMedio), icon: Receipt, color: "#14b8a6" },
    { label: "Estoque baixo", value: String(stats.estoqueBaixo), icon: Boxes, color: "#f59e0b" },
    { label: "Valor em estoque", value: brl(stats.valorEstoque), icon: Package, color: "#6366f1" },
  ]

  const initialLoading = loading && orders.length === 0 && customers.length === 0

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Início" description={firstName ? `Bem-vindo de volta, ${firstName}` : "Bem-vindo de volta"} />

      <div className="flex-1 space-y-6 p-6">
        {/* Filtro de período */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[--foreground]">Visão geral</h2>
            <p className="text-xs text-[--muted-foreground]">Indicadores e gráficos do período selecionado.</p>
          </div>
          <PeriodFilter value={period} onChange={(k) => { setPeriod(k); logger.info("dashboard", "período alterado", { period: k }) }} custom={custom} onCustomChange={setCustom} />
        </div>

        {errors.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Falha ao carregar: {errors.join(", ")}. Os demais dados continuam atualizando.
          </div>
        )}

        {/* KPIs principais */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {primary.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-[--border] bg-[--card] p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[--muted-foreground]">{s.label}</p>
                  {initialLoading ? (
                    <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[--muted]" />
                  ) : (
                    <p className="mt-1.5 text-2xl font-bold leading-none text-[--foreground]">{s.value}</p>
                  )}
                  <p className="mt-1.5 truncate text-[11px] text-[--muted-foreground]">{s.sub}</p>
                </div>
                <div className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.color + "18" }}>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* KPIs secundários */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {secondary.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-2.5 rounded-lg border border-[--border] bg-[--card] p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: s.color + "18" }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-[--muted-foreground]">{s.label}</p>
                <p className="truncate text-sm font-bold text-[--foreground]">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-[--border] shadow-none lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[--foreground]">Movimentação de OS</CardTitle></CardHeader>
            <CardContent className="pt-2"><BarChart data={osPorDia} color="#2563eb" height={140} /></CardContent>
          </Card>

          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[--foreground]">Status das OS</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4 pt-2">
              <Donut segments={statusSegments} size={130} />
              <ul className="flex-1 space-y-1.5">
                {statusSegments.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="flex-1 truncate text-[--muted-foreground]">{s.label}</span>
                    <span className="font-semibold text-[--foreground]">{s.value}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[--border] shadow-none lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[--foreground]">Faturamento no período</CardTitle></CardHeader>
            <CardContent className="pt-2"><AreaChart data={faturamentoPorDia} color="#ea580c" height={140} format={brl} /></CardContent>
          </Card>

          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-[--foreground]">Estoque</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-2">
              <Row label="Itens cadastrados" value={String(parts.length)} />
              <Row label="Estoque baixo" value={String(stats.estoqueBaixo)} tone={stats.estoqueBaixo > 0 ? "#f59e0b" : undefined} />
              <Row label="Valor imobilizado" value={brl(stats.valorEstoque)} />
              <Link href="/estoque" className="mt-1 flex items-center gap-1 text-xs font-medium text-[--primary] hover:underline">
                Abrir estoque <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas + OS recentes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-[--border] shadow-none lg:col-span-1">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[--foreground]">Ações rápidas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-1.5 pt-0">
              {QUICK_ACTIONS.map((a) => (
                <motion.div key={a.label} whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                  <Link href={a.href} className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[--muted]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: a.color }}>
                      <a.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[--foreground]">{a.label}</p>
                      <p className="truncate text-[11px] text-[--muted-foreground]">{a.description}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[--muted-foreground] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[--border] shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[--foreground]">Ordens de Serviço recentes</CardTitle>
                <Link href="/os" className="text-xs font-medium text-[--primary] hover:underline">Ver todas</Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOS.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[--border] py-12 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[--muted]"><Clock className="h-5 w-5 text-[--muted-foreground]" /></div>
                  <div>
                    <p className="text-sm font-medium text-[--foreground]">Nenhuma OS por aqui ainda</p>
                    <p className="mt-0.5 text-xs text-[--muted-foreground]">Abra sua primeira ordem de serviço para começar.</p>
                  </div>
                  <Button size="sm" asChild><Link href="/os/nova">Abrir primeira OS</Link></Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {recentOS.map((os) => {
                      const cfg = STATUS_META[os.status]
                      return (
                        <motion.div
                          key={os.id} layout
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, x: -12, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Link href="/os" className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[--muted]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--muted] text-xs font-bold text-[--muted-foreground]">#{os.number}</div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[--foreground]">{os.customerName}</p>
                              <p className="truncate text-xs text-[--muted-foreground]">{[os.deviceBrand, os.deviceModel].filter(Boolean).join(" ") || "—"}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-[--muted-foreground]"><Clock className="h-3 w-3" />{relativeTime(os.createdAt)}</span>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed border-[--border] bg-gradient-to-br from-[#2563eb]/5 to-[#ea580c]/5 shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#2563eb" }}><Settings className="h-6 w-6 text-white" /></div>
            <div className="flex-1">
              <p className="font-semibold text-[--foreground]">Configurações da loja</p>
              <p className="mt-0.5 text-sm text-[--muted-foreground]">Logo, formas de pagamento e dados que aparecem nos documentos.</p>
            </div>
            <Button variant="outline" asChild><Link href="/configuracoes">Abrir configurações<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[--muted-foreground]">{label}</span>
      <span className="font-semibold" style={{ color: tone ?? "var(--foreground)" }}>{value}</span>
    </div>
  )
}
