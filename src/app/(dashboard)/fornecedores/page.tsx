"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Truck, Phone, Mail, MapPin, Pencil, Trash2, Search,
  Loader2, AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchSuppliers, deleteSupplier, type Supplier } from "@/lib/data/suppliers"
import { SupplierDrawer } from "@/components/fornecedores/supplier-drawer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { AnimatedCard } from "@/components/shared/animated-card"

export default function FornecedoresPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [confirmDel, setConfirmDel] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchSuppliers(
      tenantId,
      (list) => { setSuppliers(list); setError(null); setLoading(false) },
      () => { setError("Não foi possível carregar os fornecedores."); setLoading(false) }
    )
    return () => unsub()
  }, [tenantId])

  function openNew() { setEditing(null); setDrawerOpen(true) }
  function openEdit(s: Supplier) { setEditing(s); setDrawerOpen(true) }

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try { await deleteSupplier(tenantId, confirmDel.id); setConfirmDel(null) }
    catch { setError("Não foi possível remover o fornecedor.") }
    finally { setDeleting(false) }
  }

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Fornecedores" action={{ label: "Novo Fornecedor", onClick: openNew }} />

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar por nome, cidade ou e-mail..." className="h-8 border-transparent bg-[--muted] pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="ml-auto text-xs text-[--muted-foreground]">{filtered.length} {filtered.length === 1 ? "fornecedor" : "fornecedores"}</span>
      </div>

      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando fornecedores...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><Truck className="h-7 w-7 text-[--muted-foreground]" /></div>
            <div>
              <p className="font-semibold text-[--foreground]">{search ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">{search ? "Tente outro termo." : "Cadastre os fornecedores das suas peças."}</p>
            </div>
            {!search && <Button onClick={openNew}>Cadastrar fornecedor</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s) => (
              <AnimatedCard key={s.id} className="rounded-xl border border-[--border] bg-[--card] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--muted]"><Truck className="h-5 w-5 text-[--muted-foreground]" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[--foreground]">{s.name}</p>
                      <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>{s.active ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} aria-label={`Editar ${s.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] hover:bg-[--muted] hover:text-[--primary]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setConfirmDel(s)} aria-label={`Remover ${s.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] hover:bg-[--destructive]/10 hover:text-[--destructive]"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {s.city && <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><MapPin className="h-3 w-3" />{s.city}</div>}
                  {s.phone && <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Phone className="h-3 w-3" />{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Mail className="h-3 w-3" />{s.email}</div>}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>

      <SupplierDrawer supplier={editing} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ConfirmDialog
        open={confirmDel !== null}
        title="Remover fornecedor?"
        description={confirmDel ? `${confirmDel.name} será removido.` : ""}
        confirmLabel="Remover"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
