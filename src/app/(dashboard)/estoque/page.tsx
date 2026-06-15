"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search, AlertTriangle, Package, Pencil, Trash2,
  Loader2, AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchParts, deletePart, PART_CATEGORIES, type Part } from "@/lib/data/parts"
import { PartEditDialog } from "@/components/estoque/part-edit-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

const FILTERS = ["Todos", ...PART_CATEGORIES] as const

function brl(n: number) {
  return `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`
}

function StockBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#ef4444]/10 px-2 py-0.5 text-[11px] font-semibold text-[#ef4444]"><AlertTriangle className="h-3 w-3" />Sem estoque</span>
  if (stock <= min)
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[11px] font-semibold text-[#f59e0b]"><AlertTriangle className="h-3 w-3" />{stock} un.</span>
  return <span className="inline-flex rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10b981]">{stock} un.</span>
}

export default function EstoquePage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState<string>("Todos")
  const [editing, setEditing] = useState<Part | null>(null)
  const [confirmDel, setConfirmDel] = useState<Part | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchParts(
      tenantId,
      (list) => { setParts(list); setError(null); setLoading(false) },
      () => { setError("Não foi possível carregar o estoque."); setLoading(false) }
    )
    return () => unsub()
  }, [tenantId])

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try {
      await deletePart(tenantId, confirmDel.id)
      setConfirmDel(null)
    } catch {
      setError("Não foi possível remover a peça.")
    } finally {
      setDeleting(false)
    }
  }

  const filtered = parts.filter(
    (p) =>
      (cat === "Todos" || p.category === cat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
  )
  const lowStock = parts.filter((p) => p.stock <= p.minStock).length

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Estoque" action={{ label: "Nova Peça", href: "/estoque/nova" }} />

      {lowStock > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#f59e0b]" />
          <p className="text-sm text-[--foreground]">
            <span className="font-semibold">{lowStock} {lowStock === 1 ? "item" : "itens"}</span> com estoque baixo ou zerado.
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar peça ou SKU..." className="h-8 border-transparent bg-[--muted] pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${cat === c ? "bg-[--primary] text-white" : "border border-[--border] text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando estoque...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><Package className="h-7 w-7 text-[--muted-foreground]" /></div>
            <div>
              <p className="font-semibold text-[--foreground]">{search || cat !== "Todos" ? "Nenhuma peça encontrada" : "Catálogo de peças vazio"}</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">{search || cat !== "Todos" ? "Ajuste a busca ou o filtro." : "Cadastre as peças que você usa nos reparos."}</p>
            </div>
            {!search && cat === "Todos" && <Button asChild><a href="/estoque/nova">Cadastrar peça</a></Button>}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[--border]">
            <table className="w-full text-sm">
              <thead className="border-b border-[--border] bg-[--muted]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Peça</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] sm:table-cell">SKU</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] md:table-cell">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Venda</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Estoque</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] lg:table-cell">Fornecedor</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {filtered.map((part) => (
                  <tr key={part.id} className="transition-colors hover:bg-[--muted]/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--muted]"><Package className="h-3.5 w-3.5 text-[--muted-foreground]" /></div>
                        <span className="font-medium text-[--foreground]">{part.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-[--muted-foreground] sm:table-cell">{part.sku || "—"}</td>
                    <td className="hidden px-4 py-3 md:table-cell"><span className="rounded-md bg-[--muted] px-2 py-0.5 text-xs text-[--muted-foreground]">{part.category || "—"}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-[--foreground]">{brl(part.price)}</td>
                    <td className="px-4 py-3 text-center"><StockBadge stock={part.stock} min={part.minStock} /></td>
                    <td className="hidden px-4 py-3 text-xs text-[--muted-foreground] lg:table-cell">{part.supplier || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(part)} aria-label={`Editar ${part.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--primary]"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setConfirmDel(part)} aria-label={`Remover ${part.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] transition-colors hover:bg-[--destructive]/10 hover:text-[--destructive]"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartEditDialog part={editing} open={editing !== null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={confirmDel !== null}
        title="Remover peça?"
        description={confirmDel ? `${confirmDel.name} será removida do catálogo.` : ""}
        confirmLabel="Remover"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
