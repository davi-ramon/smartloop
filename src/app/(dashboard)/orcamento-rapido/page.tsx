"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Zap, Smartphone, Search, Plus, Minus, Trash2,
  FileText, CheckCircle2, Loader2, AlertCircle, Wrench,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchCustomers, type Customer } from "@/lib/data/customers"
import { watchParts, type Part } from "@/lib/data/parts"
import {
  createQuote, watchQuotes, deleteQuote, summarizeItems,
  generateApprovalToken, type Quote, type QuoteItem,
} from "@/lib/data/quotes"
import { logger } from "@/lib/logger"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

const QUOTE_STATUS = {
  pending: { label: "Pendente", cls: "bg-[#f59e0b]/10 text-[#f59e0b]" },
  approved: { label: "Aprovado", cls: "bg-[#10b981]/10 text-[#10b981]" },
  rejected: { label: "Recusado", cls: "bg-[#ef4444]/10 text-[#ef4444]" },
  expired: { label: "Expirado", cls: "bg-[--muted] text-[--muted-foreground]" },
}

export default function OrcamentoRapidoPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId

  const [customers, setCustomers] = useState<Customer[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])

  const [customerId, setCustomerId] = useState("")
  const [device, setDevice] = useState("")
  const [imei, setImei] = useState("")
  const [items, setItems] = useState<QuoteItem[]>([])
  const [search, setSearch] = useState("")
  const [laborDesc, setLaborDesc] = useState("")
  const [laborPrice, setLaborPrice] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    const u1 = watchCustomers(tenantId, setCustomers, () => setCustomers([]))
    const u2 = watchParts(tenantId, setParts, () => setParts([]))
    const u3 = watchQuotes(tenantId, setQuotes, () => setQuotes([]))
    return () => { u1(); u2(); u3() }
  }, [tenantId])

  const filteredParts = parts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const { totalParts, totalLabor, total } = useMemo(() => summarizeItems(items), [items])

  function addPart(part: Part) {
    setItems((prev) => {
      const ex = prev.find((i) => i.partId === part.id)
      if (ex) return prev.map((i) => i.partId === part.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { description: part.name, quantity: 1, unitPrice: part.price, type: "part", partId: part.id }]
    })
  }

  function addLabor() {
    const price = Number(laborPrice)
    if (!laborDesc.trim() || !price) return
    setItems((prev) => [...prev, { description: laborDesc.trim(), quantity: 1, unitPrice: price, type: "labor" }])
    setLaborDesc("")
    setLaborPrice("")
  }

  function changeQty(idx: number, delta: number) {
    setItems((prev) => prev.map((i, n) => n === idx ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, n) => n !== idx))
  }

  async function handleSave() {
    if (!tenantId) { setError("Sessão ainda carregando."); return }
    if (items.length === 0) { setError("Adicione ao menos um item ao orçamento."); return }
    setSaving(true)
    setError(null)
    try {
      const customer = customers.find((c) => c.id === customerId)
      await createQuote(tenantId, {
        customerId: customerId || undefined,
        customerName: customer?.name || undefined,
        deviceLabel: device || undefined,
        imei: imei || undefined,
        items,
        totalParts,
        totalLabor,
        total,
        status: "pending",
        approvalToken: generateApprovalToken(),
      })
      setSaved(true)
      setItems([])
      setDevice("")
      setImei("")
      setCustomerId("")
      setTimeout(() => setSaved(false), 4000)
    } catch {
      logger.error("orcamento", "falha ao salvar orçamento rápido")
      setError("Não foi possível salvar o orçamento.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteQuote(id: string) {
    if (!tenantId) return
    try { await deleteQuote(tenantId, id) } catch { /* logado na camada */ }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Orçamento Rápido" />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Aparelho + cliente */}
        <Card className="border-[--border] shadow-none">
          <CardContent className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[--foreground]">
              <Smartphone className="h-4 w-4 text-[--primary]" /> Dados do orçamento
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente (opcional)</Label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
                  <option value="">Sem cliente</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo / aparelho</Label>
                <Input placeholder="ex: iPhone 14 Pro" value={device} onChange={(e) => setDevice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IMEI (opcional)</Label>
                <Input placeholder="XX XXXXXX XXXXXX X" value={imei} onChange={(e) => setImei(e.target.value)} maxLength={19} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Catálogo */}
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[--foreground]">
                <Search className="h-4 w-4 text-[--primary]" /> Adicionar peças
              </h2>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
                <Input placeholder="Buscar peça do catálogo..." className="border-transparent bg-[--muted] pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-52 space-y-1.5 overflow-y-auto">
                {filteredParts.map((part) => (
                  <button key={part.id} onClick={() => addPart(part)} className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[--muted]">
                    <div>
                      <p className="text-sm font-medium text-[--foreground]">{part.name}</p>
                      <span className="text-[10px] text-[--muted-foreground]">{part.category || "Peça"} · {part.stock} em estoque</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[--primary]">{brl(part.price)}</span>
                      <Plus className="h-4 w-4 text-[--muted-foreground] transition-colors group-hover:text-[--primary]" />
                    </div>
                  </button>
                ))}
                {filteredParts.length === 0 && (
                  <p className="py-6 text-center text-xs text-[--muted-foreground]">
                    {parts.length === 0 ? "Cadastre peças no Estoque para usá-las aqui." : "Nenhuma peça encontrada."}
                  </p>
                )}
              </div>

              {/* Mão de obra */}
              <div className="mt-4 border-t border-[--border] pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[--foreground]"><Wrench className="h-3.5 w-3.5 text-[--accent]" /> Mão de obra / serviço</p>
                <div className="flex gap-2">
                  <Input placeholder="Descrição" className="flex-1 text-sm" value={laborDesc} onChange={(e) => setLaborDesc(e.target.value)} />
                  <Input placeholder="R$" type="number" min="0" step="0.01" className="w-24 text-sm" value={laborPrice} onChange={(e) => setLaborPrice(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" onClick={addLabor} disabled={!laborDesc.trim() || !Number(laborPrice)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[--foreground]">
                <FileText className="h-4 w-4 text-[--primary]" /> Resumo do orçamento
              </h2>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[--border] py-10 text-center">
                  <Zap className="h-8 w-8 text-[--muted-foreground]/40" />
                  <p className="text-sm text-[--muted-foreground]">Adicione peças ou mão de obra</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-[--border] p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-[--foreground]">{item.description}</p>
                          <p className="text-xs text-[--muted-foreground]">{brl(item.unitPrice)} × {item.quantity} = {brl(item.unitPrice * item.quantity)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => changeQty(idx, -1)} className="flex h-5 w-5 items-center justify-center rounded-md border border-[--border]"><Minus className="h-3 w-3" /></button>
                          <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => changeQty(idx, 1)} className="flex h-5 w-5 items-center justify-center rounded-md border border-[--border]"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => removeItem(idx)} className="ml-1 text-[--muted-foreground] hover:text-[#ef4444]"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-[--border] pt-3 text-sm">
                    <div className="flex justify-between text-[--muted-foreground]"><span>Peças</span><span>{brl(totalParts)}</span></div>
                    <div className="flex justify-between text-[--muted-foreground]"><span>Mão de obra</span><span>{brl(totalLabor)}</span></div>
                    <div className="flex justify-between border-t border-[--border] pt-2 text-base font-bold text-[--foreground]"><span>Total</span><span className="text-[--primary]">{brl(total)}</span></div>
                  </div>
                </>
              )}

              {error && (
                <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-xs text-[--destructive]">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}
              {saved && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#10b981]/10 px-3 py-2.5 text-xs font-medium text-[#10b981]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Orçamento salvo! Aparece na lista abaixo.
                </div>
              )}

              <Button className="mt-4 w-full" onClick={handleSave} loading={saving} disabled={saving || items.length === 0}>
                Salvar orçamento
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Orçamentos salvos */}
        <Card className="border-[--border] shadow-none">
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-[--foreground]">Orçamentos salvos</h2>
            {quotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-[--muted-foreground]">Nenhum orçamento salvo ainda.</p>
            ) : (
              <div className="space-y-2">
                {quotes.map((q) => {
                  const st = QUOTE_STATUS[q.status]
                  return (
                    <div key={q.id} className="flex items-center gap-4 rounded-lg border border-[--border] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[--foreground]">{q.customerName || "Sem cliente"} {q.deviceLabel ? `· ${q.deviceLabel}` : ""}</p>
                        <p className="text-xs text-[--muted-foreground]">{q.items.length} {q.items.length === 1 ? "item" : "itens"}</p>
                      </div>
                      <span className="text-sm font-bold text-[--primary]">{brl(q.total)}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                      <button onClick={() => handleDeleteQuote(q.id)} aria-label="Remover orçamento" className="text-[--muted-foreground] transition-colors hover:text-[--destructive]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
