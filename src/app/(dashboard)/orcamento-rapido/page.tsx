"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Zap, Smartphone, Search, Plus, Minus, Trash2,
  FileText, Send, CheckCircle2, ClipboardList,
} from "lucide-react"

const PARTS_CATALOG = [
  { id: "1", name: "Tela iPhone 14 Pro OLED",   price: 420 },
  { id: "2", name: "Bateria iPhone 14",           price: 130 },
  { id: "3", name: "Tela Samsung S23",            price: 310 },
  { id: "4", name: "Bateria Samsung A54",         price: 85  },
  { id: "5", name: "Tela Motorola G84",           price: 180 },
  { id: "6", name: "Conector Carga USB-C",        price: 45  },
]

const LABOR_OPTIONS = [
  { id: "l1", name: "Troca de tela",          price: 50  },
  { id: "l2", name: "Troca de bateria",       price: 30  },
  { id: "l3", name: "Manutenção geral",       price: 80  },
  { id: "l4", name: "Reparo por infiltração", price: 100 },
]

interface QuoteItem { id: string; name: string; price: number; qty: number; type: "part" | "labor" }

export default function OrcamentoRapidoPage() {
  const [device, setDevice] = useState("")
  const [imei, setImei] = useState("")
  const [items, setItems] = useState<QuoteItem[]>([])
  const [search, setSearch] = useState("")
  const [sent, setSent] = useState(false)

  const allItems = [...PARTS_CATALOG.map(p => ({ ...p, type: "part" as const })), ...LABOR_OPTIONS.map(l => ({ ...l, type: "labor" as const }))]
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  function addItem(item: typeof allItems[0]) {
    setItems(prev => {
      const ex = prev.find(i => i.id === item.id)
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`

  return (
    <div className="flex flex-col flex-1">
      <Header title="Orçamento Rápido" />
      <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
        {/* Device + IMEI */}
        <Card className="border-[--border] shadow-none">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-[--foreground] mb-4 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[--primary]" />
              Aparelho
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="device" className="text-xs">Modelo / descrição</Label>
                <Input id="device" placeholder="ex: iPhone 14 Pro, Samsung S23..." value={device} onChange={e => setDevice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imei" className="text-xs">IMEI (opcional)</Label>
                <Input id="imei" placeholder="XX XXXXXX XXXXXX X" value={imei} onChange={e => setImei(e.target.value)} maxLength={19} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Catalog */}
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-[--foreground] mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-[--primary]" />
                Adicionar itens
              </h2>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
                <Input placeholder="Buscar peça ou serviço..." className="pl-8 bg-[--muted] border-transparent text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {filtered.map(item => (
                  <button key={item.id} onClick={() => addItem(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 hover:bg-[--muted] transition-colors text-left group">
                    <div>
                      <p className="text-sm font-medium text-[--foreground]">{item.name}</p>
                      <span className="text-[10px] text-[--muted-foreground]">{item.type === "part" ? "Peça" : "Serviço"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[--primary]">{fmt(item.price)}</span>
                      <Plus className="h-4 w-4 text-[--muted-foreground] group-hover:text-[--primary] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quote summary */}
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-[--foreground] mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[--primary]" />
                Resumo do orçamento
              </h2>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center rounded-lg border border-dashed border-[--border]">
                  <Zap className="h-8 w-8 text-[--muted-foreground]/40" />
                  <p className="text-sm text-[--muted-foreground]">Adicione itens ao orçamento</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 rounded-lg border border-[--border] p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[--foreground] truncate">{item.name}</p>
                          <p className="text-xs text-[--muted-foreground]">{fmt(item.price)} × {item.qty} = {fmt(item.price * item.qty)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => changeQty(item.id, -1)} className="flex h-5 w-5 items-center justify-center rounded-md border border-[--border]"><Minus className="h-3 w-3" /></button>
                          <span className="w-4 text-center text-xs font-bold">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="flex h-5 w-5 items-center justify-center rounded-md border border-[--border]"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => removeItem(item.id)} className="ml-1 text-[--muted-foreground] hover:text-[#ef4444]"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[--border] pt-3">
                    <span className="text-sm font-semibold text-[--foreground]">Total</span>
                    <span className="text-xl font-bold text-[--primary]">{fmt(total)}</span>
                  </div>
                </>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" size="sm" disabled={items.length === 0} className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Gerar PDF
                </Button>
                <Button variant="outline" size="sm" disabled={items.length === 0} className="gap-1.5" onClick={() => setSent(true)}>
                  <Send className="h-3.5 w-3.5" />
                  Enviar link
                </Button>
                <Button size="sm" disabled={items.length === 0} className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Criar OS
                </Button>
              </div>

              {sent && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#10b981]/10 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10b981] shrink-0" />
                  <p className="text-xs text-[#10b981] font-medium">Link enviado via WhatsApp! Aguardando aprovação.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
