"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, AlertTriangle, Package, MoreHorizontal } from "lucide-react"

const CATEGORIES = ["Todos", "Telas", "Baterias", "Películas", "Capas", "Conectores", "Outros"]

const MOCK_PARTS = [
  { id: "1", name: "Tela iPhone 14 Pro OLED",         sku: "TL-IP14P",  category: "Telas",      price: 420,  cost: 280,  stock: 3,  min: 2, supplier: "Moisés Imperosa" },
  { id: "2", name: "Tela Samsung Galaxy S23",          sku: "TL-SS23",   category: "Telas",      price: 310,  cost: 190,  stock: 2,  min: 2, supplier: "Moisés Imperosa" },
  { id: "3", name: "Bateria iPhone 13",                sku: "BT-IP13",   category: "Baterias",   price: 120,  cost: 65,   stock: 8,  min: 5, supplier: "Moisés Imperosa" },
  { id: "4", name: "Bateria Samsung A54",              sku: "BT-SSA54",  category: "Baterias",   price: 85,   cost: 40,   stock: 1,  min: 3, supplier: "TechParts SP"    },
  { id: "5", name: "Película iPhone 14 Series",        sku: "PL-IP14",   category: "Películas",  price: 35,   cost: 12,   stock: 20, min: 10, supplier: "PeliMax"       },
  { id: "6", name: "Película Samsung S23 Ultra",       sku: "PL-SS23U",  category: "Películas",  price: 40,   cost: 14,   stock: 15, min: 10, supplier: "PeliMax"       },
  { id: "7", name: "Conector Carga USB-C Universal",   sku: "CN-USBC",   category: "Conectores", price: 45,   cost: 18,   stock: 12, min: 5, supplier: "ElecParts"      },
  { id: "8", name: "Capa Silicone iPhone 14",          sku: "CP-IP14",   category: "Capas",      price: 25,   cost: 8,    stock: 0,  min: 5, supplier: "AcessórioBR"    },
]

function StockBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#ef4444]/10 px-2 py-0.5 text-[11px] font-semibold text-[#ef4444]"><AlertTriangle className="h-3 w-3" />Sem estoque</span>
  if (stock <= min)
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[11px] font-semibold text-[#f59e0b]"><AlertTriangle className="h-3 w-3" />{stock} un.</span>
  return <span className="inline-flex rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10b981]">{stock} un.</span>
}

export default function EstoquePage() {
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState("Todos")

  const filtered = MOCK_PARTS.filter(
    (p) =>
      (cat === "Todos" || p.category === cat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const lowStock = MOCK_PARTS.filter((p) => p.stock <= p.min).length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Estoque" action={{ label: "Nova Peça", href: "/estoque/nova" }} />

      {lowStock > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b] shrink-0" />
          <p className="text-sm text-[--foreground]">
            <span className="font-semibold">{lowStock} {lowStock === 1 ? "item" : "itens"}</span> com estoque baixo ou zerado.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3 mt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar peça ou SKU..." className="pl-8 h-8 text-sm bg-[--muted] border-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-lg px-3 h-8 text-xs font-medium transition-colors ${cat === c ? "bg-[--primary] text-white" : "border border-[--border] text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--muted]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        <div className="rounded-xl border border-[--border] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[--muted]/50 border-b border-[--border]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Peça</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden sm:table-cell">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Custo</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Venda</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Estoque</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden lg:table-cell">Fornecedor</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {filtered.map((part) => (
                <tr key={part.id} className="hover:bg-[--muted]/30 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--muted]">
                        <Package className="h-3.5 w-3.5 text-[--muted-foreground]" />
                      </div>
                      <span className="font-medium text-[--foreground]">{part.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-[--muted-foreground] hidden sm:table-cell">{part.sku}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="rounded-md bg-[--muted] px-2 py-0.5 text-xs text-[--muted-foreground]">{part.category}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-[--muted-foreground]">R$ {part.cost.toFixed(2).replace(".", ",")}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[--foreground]">R$ {part.price.toFixed(2).replace(".", ",")}</td>
                  <td className="py-3 px-4 text-center"><StockBadge stock={part.stock} min={part.min} /></td>
                  <td className="py-3 px-4 text-xs text-[--muted-foreground] hidden lg:table-cell">{part.supplier}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[--muted-foreground] hover:text-[--foreground] transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
