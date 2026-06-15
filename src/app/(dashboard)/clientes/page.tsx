"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search, Phone, Mail, MessageCircle, MoreHorizontal, UserPlus,
  Loader2, AlertCircle, Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchCustomers, deleteCustomer, type Customer } from "@/lib/data/customers"
import { logger } from "@/lib/logger"

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

export default function ClientesPage() {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const unsub = watchCustomers(
      tenantId,
      (list) => {
        setCustomers(list)
        setError(null)
        setLoading(false)
      },
      () => {
        setError("Não foi possível carregar os clientes. Tente recarregar a página.")
        setLoading(false)
      }
    )
    return () => unsub()
  }, [tenantId])

  async function handleDelete(c: Customer) {
    if (!tenantId) return
    if (!confirm(`Remover o cliente "${c.name}"?`)) return
    try {
      await deleteCustomer(tenantId, c.id)
    } catch {
      alert("Não foi possível remover o cliente.")
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search) ||
      (c.whatsapp ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Clientes" action={{ label: "Novo Cliente", href: "/clientes/novo" }} />

      <div className="flex items-center gap-3 border-b border-[--border] px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="pl-8 h-8 text-sm bg-[--muted] border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-[--muted-foreground] ml-auto">
          {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      <div className="flex-1 px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Carregando clientes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10">
              <AlertCircle className="h-7 w-7 text-[--destructive]" />
            </div>
            <p className="text-sm text-[--destructive]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]">
              <UserPlus className="h-7 w-7 text-[--muted-foreground]" />
            </div>
            <div>
              <p className="font-semibold text-[--foreground]">
                {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
              <p className="mt-1 text-sm text-[--muted-foreground]">
                {search ? "Tente outro termo de busca." : "Cadastre seu primeiro cliente para começar."}
              </p>
            </div>
            {!search && (
              <Button asChild>
                <a href="/clientes/novo">Cadastrar cliente</a>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[--border] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[--muted]/50 border-b border-[--border]">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Cliente</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden sm:table-cell">Contato</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {filtered.map((client, i) => (
                  <tr key={client.id} className="hover:bg-[--muted]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-xs font-bold text-white`}>
                          {getInitials(client.name)}
                        </div>
                        <span className="font-medium text-[--foreground]">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        {client.whatsapp && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#10b981]">
                            <MessageCircle className="h-3 w-3" />{client.whatsapp}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                            <Phone className="h-3 w-3" />{client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                            <Mail className="h-3 w-3" />{client.email}
                          </div>
                        )}
                        {!client.phone && !client.whatsapp && !client.email && (
                          <span className="text-xs text-[--muted-foreground]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${client.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>
                        {client.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(client)}
                        aria-label={`Remover ${client.name}`}
                        className="text-[--muted-foreground] hover:text-[--destructive] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
