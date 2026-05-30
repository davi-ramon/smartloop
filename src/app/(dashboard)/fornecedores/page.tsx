import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Truck, Phone, Mail, Package, MoreHorizontal } from "lucide-react"

const MOCK_SUPPLIERS = [
  { id: "1", name: "Moisés Imperosa",   city: "Fortaleza, CE",  phone: "(85) 99000-0001", email: "vendas@imperosa.com.br",  products: 42, active: true  },
  { id: "2", name: "TechParts SP",      city: "São Paulo, SP",  phone: "(11) 99000-0002", email: "contato@techparts.com.br", products: 18, active: true  },
  { id: "3", name: "PeliMax Filmes",    city: "Curitiba, PR",   phone: "(41) 99000-0003", email: "pedidos@pelimax.com.br",   products: 87, active: true  },
  { id: "4", name: "ElecParts Brasil",  city: "Manaus, AM",     phone: "(92) 99000-0004", email: "vendas@elecparts.com.br",  products: 35, active: false },
]

export default function FornecedoresPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Fornecedores" action={{ label: "Novo Fornecedor", href: "/fornecedores/novo" }} />
      <div className="flex-1 px-6 py-4">
        <div className="rounded-xl border border-[--border] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[--muted]/50 border-b border-[--border]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Fornecedor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden sm:table-cell">Localização</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden md:table-cell">Contato</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Produtos</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {MOCK_SUPPLIERS.map((s) => (
                <tr key={s.id} className="hover:bg-[--muted]/30 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--muted]">
                        <Truck className="h-4 w-4 text-[--muted-foreground]" />
                      </div>
                      <span className="font-medium text-[--foreground]">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-[--muted-foreground] hidden sm:table-cell">{s.city}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Phone className="h-3 w-3" />{s.phone}</div>
                      <div className="flex items-center gap-1.5 text-xs text-[--muted-foreground]"><Mail className="h-3 w-3" />{s.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-[--primary]"><Package className="h-3.5 w-3.5" />{s.products}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.active ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[--muted] text-[--muted-foreground]"}`}>
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[--muted-foreground] hover:text-[--foreground]"><MoreHorizontal className="h-4 w-4" /></button>
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
