import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

const GUARANTEES = [
  { id: "1", os: 3,  customer: "Pedro Alves",   device: "Motorola G84",        service: "Troca de bateria",    end_date: "28/08/2026", days_left: 91, status: "active"   },
  { id: "2", os: 6,  customer: "Camila Rocha",  device: "Samsung A54",          service: "Troca de tela",       end_date: "25/06/2026", days_left: 27, status: "expiring" },
  { id: "3", os: 8,  customer: "Beatriz Nunes", device: "iPhone 12",            service: "Manutenção geral",    end_date: "01/06/2026", days_left: 3,  status: "expiring" },
  { id: "4", os: 11, customer: "Rafael Lima",   device: "Xiaomi Note 11",       service: "Troca de tela",       end_date: "15/04/2026", days_left: -45, status: "expired"  },
]

const STATUS_CONFIG = {
  active:   { label: "Ativa",          color: "text-[#10b981]", bg: "bg-[#10b981]/10", icon: CheckCircle2 },
  expiring: { label: "Vencendo em breve", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", icon: AlertTriangle },
  expired:  { label: "Expirada",       color: "text-[#9ca3af]", bg: "bg-[--muted]",    icon: Clock },
}

export default function GarantiaPage() {
  const active = GUARANTEES.filter(g => g.status === "active").length
  const expiring = GUARANTEES.filter(g => g.status === "expiring").length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Garantia" />
      <div className="flex-1 space-y-6 p-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10">
                <Shield className="h-5 w-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[--foreground]">{active}</p>
                <p className="text-xs text-[--muted-foreground]">Garantias ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b]/10">
                <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[--foreground]">{expiring}</p>
                <p className="text-xs text-[--muted-foreground]">Vencendo em breve</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[--border] shadow-none">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[--muted]">
                <Clock className="h-5 w-5 text-[--muted-foreground]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[--foreground]">90</p>
                <p className="text-xs text-[--muted-foreground]">Dias padrão de garantia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="rounded-xl border border-[--border] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[--muted]/50 border-b border-[--border]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">OS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden md:table-cell">Aparelho</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden lg:table-cell">Serviço</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Vencimento</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {GUARANTEES.map((g) => {
                const cfg = STATUS_CONFIG[g.status as keyof typeof STATUS_CONFIG]
                return (
                  <tr key={g.id} className="hover:bg-[--muted]/30 transition-colors cursor-pointer">
                    <td className="py-3 px-4 text-xs font-bold text-[--muted-foreground]">#{g.os}</td>
                    <td className="py-3 px-4 font-medium text-[--foreground]">{g.customer}</td>
                    <td className="py-3 px-4 text-[--muted-foreground] hidden md:table-cell">{g.device}</td>
                    <td className="py-3 px-4 text-[--muted-foreground] hidden lg:table-cell">{g.service}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-[--foreground]">{g.end_date}</p>
                      <p className={`text-xs ${g.days_left > 7 ? "text-[--muted-foreground]" : g.days_left >= 0 ? "text-[#f59e0b] font-medium" : "text-[#9ca3af]"}`}>
                        {g.days_left >= 0 ? `${g.days_left} dias restantes` : `Expirou há ${Math.abs(g.days_left)} dias`}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
