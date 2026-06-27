"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Phone, Pencil, Trash2, UserCog, Search, Loader2, AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchTechnicians, deleteTechnician, type Technician } from "@/lib/data/technicians"
import { TechnicianDrawer } from "@/components/tecnicos/technician-drawer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { AnimatedCard } from "@/components/shared/animated-card"

const COLORS = ["from-[--primary] to-[#1d4ed8]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#10b981] to-[#059669]", "from-[#f97316] to-[#ea580c]"]
const getInitials = (n: string) => n.trim().split(" ").slice(0, 2).map((x) => x[0]).join("").toUpperCase()

export default function TecnicosPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Technician | null>(null)
  const [confirmDel, setConfirmDel] = useState<Technician | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchTechnicians(
      tenantId,
      (list) => { setTechs(list); setError(null); setLoading(false) },
      () => { setError("Não foi possível carregar os técnicos."); setLoading(false) }
    )
    return () => unsub()
  }, [tenantId])

  function openNew() { setEditing(null); setDrawerOpen(true) }

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try { await deleteTechnician(tenantId, confirmDel.id); setConfirmDel(null) }
    catch { setError("Não foi possível remover o técnico.") }
    finally { setDeleting(false) }
  }

  const filtered = techs.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.role.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Técnicos" action={{ label: "Novo Técnico", onClick: openNew }} />

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar técnico..." className="h-8 border-transparent bg-[--muted] pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="ml-auto text-xs text-[--muted-foreground]">{filtered.length} {filtered.length === 1 ? "técnico" : "técnicos"}</span>
      </div>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]"><Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando técnicos...</p></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div><p className="text-sm text-[--destructive]">{error}</p></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><UserCog className="h-7 w-7 text-[--muted-foreground]" /></div>
            <div>
              <p className="font-semibold text-[--foreground]">{search ? "Nenhum técnico encontrado" : "Nenhum técnico cadastrado"}</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">{search ? "Tente outro termo." : "Cadastre sua equipe para atribuir às ordens de serviço."}</p>
            </div>
            {!search && <Button onClick={openNew}>Cadastrar técnico</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t, i) => (
              <AnimatedCard key={t.id} className="rounded-xl border border-[--border] bg-[--card] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} text-sm font-bold text-white`}>{getInitials(t.name)}</div>
                    <div>
                      <p className="text-sm font-semibold text-[--foreground]">{t.name}</p>
                      <p className="text-xs text-[--muted-foreground]">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(t); setDrawerOpen(true) }} aria-label="Editar" className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] hover:bg-[--muted] hover:text-[--primary]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setConfirmDel(t)} aria-label="Remover" className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] hover:bg-[--destructive]/10 hover:text-[--destructive]"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>{t.active ? "Ativo" : "Inativo"}</span>
                  {t.phone && <span className="flex items-center gap-1 text-xs text-[--muted-foreground]"><Phone className="h-3 w-3" />{t.phone}</span>}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </div>

      <TechnicianDrawer technician={editing} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ConfirmDialog
        open={confirmDel !== null}
        title="Remover técnico?"
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
