"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Phone, Mail, ClipboardList, MoreHorizontal, UserPlus } from "lucide-react"

const MOCK_CLIENTS = [
  { id: "1", name: "João Silva",      phone: "(63) 98765-4321", email: "joao@email.com",    os_count: 3, last_os: "há 2d",  active: true },
  { id: "2", name: "Maria Santos",    phone: "(63) 97654-3210", email: "maria@email.com",   os_count: 1, last_os: "há 1d",  active: true },
  { id: "3", name: "Pedro Alves",     phone: "(63) 96543-2109", email: "pedro@email.com",   os_count: 5, last_os: "há 4h",  active: true },
  { id: "4", name: "Ana Costa",       phone: "(63) 95432-1098", email: "ana@email.com",     os_count: 2, last_os: "há 1h",  active: true },
  { id: "5", name: "Lucas Ferreira",  phone: "(63) 94321-0987", email: "lucas@email.com",   os_count: 7, last_os: "há 3d",  active: true },
  { id: "6", name: "Camila Rocha",    phone: "(63) 93210-9876", email: "camila@email.com",  os_count: 4, last_os: "há 5d",  active: false },
  { id: "7", name: "Rafael Lima",     phone: "(63) 92109-8765", email: "rafael@email.com",  os_count: 2, last_os: "há 1sem", active: true },
  { id: "8", name: "Beatriz Nunes",   phone: "(63) 91098-7654", email: "bea@email.com",     os_count: 6, last_os: "há 2sem", active: true },
]

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
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
  const [search, setSearch] = useState("")

  const filtered = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Clientes" action={{ label: "Novo Cliente", href: "/clientes/novo" }} />

      {/* Toolbar */}
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

      {/* List */}
      <div className="flex-1 px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]">
              <UserPlus className="h-7 w-7 text-[--muted-foreground]" />
            </div>
            <div>
              <p className="font-semibold text-[--foreground]">Nenhum cliente encontrado</p>
              <p className="mt-1 text-sm text-[--muted-foreground]">
                {search ? "Tente outro termo de busca." : "Cadastre seu primeiro cliente."}
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
                  <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">OS</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden md:table-cell">Última OS</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {filtered.map((client, i) => (
                  <tr key={client.id} className="hover:bg-[--muted]/30 transition-colors cursor-pointer">
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
                        <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-medium text-[--primary]">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {client.os_count}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[--muted-foreground] hidden md:table-cell">
                      {client.last_os}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${client.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>
                        {client.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
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
        )}
      </div>
    </div>
  )
}
