"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search, Phone, Mail, MessageCircle, UserPlus,
  Loader2, AlertCircle, Trash2, Pencil,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchCustomers, deleteCustomer, type Customer } from "@/lib/data/customers"
import { ClientEditDialog } from "@/components/clientes/client-edit-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ViewModeToggle, type ViewMode } from "@/components/shared/view-mode-toggle"
import { AnimatedCard } from "@/components/shared/animated-card"

function getInitials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

const AVATAR_COLORS = [
  "from-[#2563eb] to-[#1d4ed8]",
  "from-[#8b5cf6] to-[#7c3aed]",
  "from-[#10b981] to-[#059669]",
  "from-[#f97316] to-[#ea580c]",
  "from-[#ef4444] to-[#dc2626]",
  "from-[#06b6d4] to-[#0891b2]",
]

interface RowActions {
  onEdit: (c: Customer) => void
  onDelete: (c: Customer) => void
}

function Avatar({ name, i, size = "h-9 w-9" }: { name: string; i: number; size?: string }) {
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-xs font-bold text-white`}>
      {getInitials(name)}
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>
      {active ? "Ativo" : "Inativo"}
    </span>
  )
}

function Contacts({ c }: { c: Customer }) {
  if (!c.whatsapp && !c.phone && !c.email) return <span className="text-xs text-[--muted-foreground]">—</span>
  return (
    <div className="space-y-0.5">
      {c.whatsapp && <div className="flex items-center gap-1.5 text-xs font-medium text-[#10b981]"><MessageCircle className="h-3 w-3" />{c.whatsapp}</div>}
      {c.phone && <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Phone className="h-3 w-3" />{c.phone}</div>}
      {c.email && <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Mail className="h-3 w-3" />{c.email}</div>}
    </div>
  )
}

function ActionButtons({ c, onEdit, onDelete }: { c: Customer } & RowActions) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onEdit(c)} aria-label={`Editar ${c.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--primary]">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onDelete(c)} aria-label={`Remover ${c.name}`} className="flex h-7 w-7 items-center justify-center rounded-md text-[--muted-foreground] transition-colors hover:bg-[--destructive]/10 hover:text-[--destructive]">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ── Grade ── */
function GridView({ customers, ...actions }: { customers: Customer[] } & RowActions) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {customers.map((c, i) => (
        <AnimatedCard key={c.id} className="rounded-xl border border-[--border] bg-[--card] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} i={i} size="h-11 w-11" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[--foreground]">{c.name}</p>
                <div className="mt-0.5"><StatusBadge active={c.active} /></div>
              </div>
            </div>
            <ActionButtons c={c} {...actions} />
          </div>
          <div className="mt-4">
            <Contacts c={c} />
          </div>
        </AnimatedCard>
      ))}
    </div>
  )
}

/* ── Lista ── */
function ListView({ customers, ...actions }: { customers: Customer[] } & RowActions) {
  return (
    <div className="space-y-2">
      {customers.map((c, i) => (
        <div key={c.id} className="flex items-center gap-4 rounded-xl border border-[--border] bg-[--card] px-4 py-3 transition-colors hover:bg-[--muted]/30">
          <Avatar name={c.name} i={i} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[--foreground]">{c.name}</p>
            {c.whatsapp && <p className="flex items-center gap-1.5 text-xs text-[#10b981]"><MessageCircle className="h-3 w-3" />{c.whatsapp}</p>}
          </div>
          <StatusBadge active={c.active} />
          <ActionButtons c={c} {...actions} />
        </div>
      ))}
    </div>
  )
}

/* ── Tabela ── */
function TableView({ customers, ...actions }: { customers: Customer[] } & RowActions) {
  return (
    <div className="overflow-hidden rounded-xl border border-[--border]">
      <table className="w-full text-sm">
        <thead className="border-b border-[--border] bg-[--muted]/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Cliente</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[--muted-foreground] sm:table-cell">Contato</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[--muted-foreground]">Status</th>
            <th className="w-20 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[--border]">
          {customers.map((c, i) => (
            <tr key={c.id} className="transition-colors hover:bg-[--muted]/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3"><Avatar name={c.name} i={i} size="h-8 w-8" /><span className="font-medium text-[--foreground]">{c.name}</span></div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell"><Contacts c={c} /></td>
              <td className="px-4 py-3 text-center"><StatusBadge active={c.active} /></td>
              <td className="px-4 py-3"><div className="flex justify-end"><ActionButtons c={c} {...actions} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ClientesPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState<ViewMode>("grid")
  const [editing, setEditing] = useState<Customer | null>(null)
  const [confirmDel, setConfirmDel] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchCustomers(
      tenantId,
      (list) => { setCustomers(list); setError(null); setLoading(false) },
      () => { setError("Não foi possível carregar os clientes."); setLoading(false) }
    )
    return () => unsub()
  }, [tenantId])

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try {
      await deleteCustomer(tenantId, confirmDel.id)
      setConfirmDel(null)
    } catch {
      setError("Não foi possível remover o cliente.")
    } finally {
      setDeleting(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.whatsapp ?? "").includes(search) ||
      (c.phone ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const actions: RowActions = { onEdit: setEditing, onDelete: setConfirmDel }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Clientes" action={{ label: "Novo Cliente", href: "/clientes/novo" }} />

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar por nome, WhatsApp ou e-mail..." className="h-8 border-transparent bg-[--muted] pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ViewModeToggle value={mode} onChange={setMode} />
        <span className="ml-auto text-xs text-[--muted-foreground]">{filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}</span>
      </div>

      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><UserPlus className="h-7 w-7 text-[--muted-foreground]" /></div>
            <div>
              <p className="font-semibold text-[--foreground]">{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">{search ? "Tente outro termo de busca." : "Cadastre seu primeiro cliente para começar."}</p>
            </div>
            {!search && <Button asChild><a href="/clientes/novo">Cadastrar cliente</a></Button>}
          </div>
        ) : mode === "grid" ? (
          <GridView customers={filtered} {...actions} />
        ) : mode === "list" ? (
          <ListView customers={filtered} {...actions} />
        ) : (
          <TableView customers={filtered} {...actions} />
        )}
      </div>

      <ClientEditDialog customer={editing} open={editing !== null} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={confirmDel !== null}
        title="Remover cliente?"
        description={confirmDel ? `${confirmDel.name} será removido permanentemente.` : ""}
        confirmLabel="Remover"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
