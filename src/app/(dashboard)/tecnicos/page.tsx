"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { UserCog, ClipboardList, Star, MoreHorizontal } from "lucide-react"

const MOCK_TECHNICIANS = [
  { id: "1", name: "Carlos Eduardo",  role: "Técnico Sênior", os_open: 2, os_month: 14, rating: 4.9, active: true  },
  { id: "2", name: "André Luís",       role: "Técnico",        os_open: 1, os_month: 9,  rating: 4.7, active: true  },
  { id: "3", name: "Fernanda Matos",   role: "Atendente",      os_open: 0, os_month: 0,  rating: 5.0, active: true  },
  { id: "4", name: "Roberto Neves",    role: "Técnico",        os_open: 0, os_month: 5,  rating: 4.5, active: false },
]

const COLORS = ["from-[--primary] to-[#1d4ed8]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#10b981] to-[#059669]", "from-[#f97316] to-[#ea580c]"]

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

export default function TecnicosPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Técnicos" action={{ label: "Novo Técnico", href: "/tecnicos/novo" }} />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK_TECHNICIANS.map((tech, i) => (
            <div key={tech.id} className="rounded-xl border border-[--border] bg-[--card] p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${COLORS[i % COLORS.length]} text-sm font-bold text-white`}>
                    {getInitials(tech.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-[--foreground] text-sm">{tech.name}</p>
                    <p className="text-xs text-[--muted-foreground]">{tech.role}</p>
                  </div>
                </div>
                <button className="text-[--muted-foreground] hover:text-[--foreground]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[--muted] p-2">
                  <p className="text-base font-bold text-[--foreground]">{tech.os_open}</p>
                  <p className="text-[10px] text-[--muted-foreground]">abertas</p>
                </div>
                <div className="rounded-lg bg-[--muted] p-2">
                  <p className="text-base font-bold text-[--foreground]">{tech.os_month}</p>
                  <p className="text-[10px] text-[--muted-foreground]">este mês</p>
                </div>
                <div className="rounded-lg bg-[--muted] p-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 text-[#f59e0b] fill-[#f59e0b]" />
                    <p className="text-base font-bold text-[--foreground]">{tech.rating}</p>
                  </div>
                  <p className="text-[10px] text-[--muted-foreground]">avaliação</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tech.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>
                  {tech.active ? "Ativo" : "Inativo"}
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <ClipboardList className="h-3 w-3" />
                  Ver OS
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
