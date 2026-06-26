"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Plus,
  Loader2, Trash2, AlertCircle, ShoppingBag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Timestamp } from "firebase/firestore"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchSales, type Sale } from "@/lib/data/sales"
import {
  watchTransactions, createTransaction, deleteTransaction, isThisMonth,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, type Transaction, type TxType,
} from "@/lib/data/finance"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

function fmtDate(ts?: Timestamp | null) {
  if (!ts?.toDate) return "—"
  return ts.toDate().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
}

interface Movement {
  key: string
  kind: TxType
  description: string
  amount: number
  date?: Timestamp | null
  source: "venda" | "manual"
  txId?: string
}

export default function FinanceiroPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [sales, setSales] = useState<Sale[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Drawer novo lançamento
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TxType>("income")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(INCOME_CATEGORIES[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    let a = false, b = false
    const done = () => { if (a && b) setLoading(false) }
    const u1 = watchSales(tenantId, (s) => { setSales(s); a = true; done() }, () => { a = true; done() })
    const u2 = watchTransactions(tenantId, (t) => { setTxs(t); b = true; done() }, () => { b = true; done() })
    return () => { u1(); u2() }
  }, [tenantId])

  const movements = useMemo<Movement[]>(() => {
    const fromSales: Movement[] = sales.map((s) => ({
      key: `sale-${s.id}`,
      kind: "income",
      description: s.customerName ? `Venda · ${s.customerName}` : "Venda no PDV",
      amount: s.total,
      date: s.createdAt,
      source: "venda",
    }))
    const fromTxs: Movement[] = txs.map((t) => ({
      key: `tx-${t.id}`,
      kind: t.type,
      description: t.description || (t.type === "income" ? "Receita" : "Despesa"),
      amount: t.amount,
      date: t.createdAt,
      source: "manual",
      txId: t.id,
    }))
    return [...fromSales, ...fromTxs].sort((x, y) => (y.date?.toMillis?.() ?? 0) - (x.date?.toMillis?.() ?? 0))
  }, [sales, txs])

  const kpis = useMemo(() => {
    const salesMonth = sales.filter((s) => isThisMonth(s.createdAt))
    const salesTotal = salesMonth.reduce((sum, s) => sum + s.total, 0)
    const incomeManual = txs.filter((t) => t.type === "income" && isThisMonth(t.createdAt)).reduce((sum, t) => sum + t.amount, 0)
    const expense = txs.filter((t) => t.type === "expense" && isThisMonth(t.createdAt)).reduce((sum, t) => sum + t.amount, 0)
    const receita = salesTotal + incomeManual
    return { receita, expense, resultado: receita - expense, vendas: salesTotal, vendasCount: salesMonth.length }
  }, [sales, txs])

  function openNew(t: TxType) {
    setType(t)
    setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
    setDescription("")
    setAmount("")
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    if (!tenantId) return
    if (!description.trim()) { setError("Informe uma descrição."); return }
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError("Informe um valor válido."); return }
    setSaving(true); setError(null)
    try {
      await createTransaction(tenantId, { type, description, amount: amt, category })
      setOpen(false)
    } catch {
      setError("Não foi possível salvar o lançamento.")
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try { await deleteTransaction(tenantId, confirmDel); setConfirmDel(null) }
    catch { /* logado */ }
    finally { setDeleting(false) }
  }

  const STATS = [
    { label: "Receita do mês", value: brl(kpis.receita), icon: TrendingUp, color: "text-[#10b981]", bg: "bg-[#10b981]/8" },
    { label: "Despesas do mês", value: brl(kpis.expense), icon: TrendingDown, color: "text-[#ef4444]", bg: "bg-[#ef4444]/8" },
    { label: "Resultado", value: brl(kpis.resultado), icon: DollarSign, color: kpis.resultado >= 0 ? "text-[--primary]" : "text-[#ef4444]", bg: "bg-[--primary]/8" },
    { label: "Vendas (PDV) no mês", value: `${kpis.vendasCount}`, sub: brl(kpis.vendas), icon: ShoppingCart, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/8" },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Financeiro" />

      <div className="flex-1 space-y-6 p-6">
        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openNew("income")}><Plus className="h-4 w-4" />Nova receita</Button>
          <Button size="sm" variant="outline" onClick={() => openNew("expense")}><Plus className="h-4 w-4" />Nova despesa</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label} className="border-[--border] shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[--muted-foreground]">{s.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-[--foreground]">{s.value}</p>
                    {s.sub && <p className="mt-1 text-xs text-[--muted-foreground]">{s.sub}</p>}
                  </div>
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Movimentos */}
        <Card className="border-[--border] shadow-none">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Movimentações recentes</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-[--muted-foreground]">
                <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <DollarSign className="h-9 w-9 text-[--muted-foreground]/40" />
                <p className="text-sm text-[--muted-foreground]">Nenhuma movimentação ainda. Vendas no PDV e lançamentos aparecem aqui.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {movements.map((m) => (
                  <div key={m.key} className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[--muted]/40">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.kind === "income" ? "bg-[#10b981]/10" : "bg-[#ef4444]/10")}>
                      {m.source === "venda" ? <ShoppingBag className="h-4 w-4 text-[#10b981]" />
                        : m.kind === "income" ? <TrendingUp className="h-4 w-4 text-[#10b981]" />
                        : <TrendingDown className="h-4 w-4 text-[#ef4444]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[--foreground]">{m.description}</p>
                      <p className="text-xs text-[--muted-foreground]">{fmtDate(m.date)} · {m.source === "venda" ? "PDV" : "Manual"}</p>
                    </div>
                    <span className={cn("text-sm font-bold", m.kind === "income" ? "text-[#10b981]" : "text-[#ef4444]")}>
                      {m.kind === "income" ? "+" : "-"} {brl(m.amount)}
                    </span>
                    {m.txId && (
                      <button onClick={() => setConfirmDel(m.txId!)} aria-label="Remover lançamento" className="text-[--muted-foreground] opacity-0 transition-opacity hover:text-[--destructive] group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer novo lançamento */}
      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={type === "income" ? "Nova receita" : "Nova despesa"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving}>Salvar</Button>
          </div>
        }
      >
        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setType("income"); setCategory(INCOME_CATEGORIES[0]) }} className={cn("rounded-lg border py-2.5 text-sm font-medium transition-colors", type === "income" ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]" : "border-[--border] text-[--muted-foreground]")}>Receita</button>
            <button onClick={() => { setType("expense"); setCategory(EXPENSE_CATEGORIES[0]) }} className={cn("rounded-lg border py-2.5 text-sm font-medium transition-colors", type === "expense" ? "border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]" : "border-[--border] text-[--muted-foreground]")}>Despesa</button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Descrição *</Label>
            <Input id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "income" ? "Reparo de tela — João" : "Compra de peças"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-amt">Valor (R$) *</Label>
              <Input id="t-amt" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-cat">Categoria</Label>
              <select id="t-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
                {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </SideDrawer>

      <ConfirmDialog
        open={confirmDel !== null}
        title="Remover lançamento?"
        description="Esta movimentação será removida do financeiro."
        confirmLabel="Remover"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
