import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ClipboardList, Users, Package, BarChart3, Clock, CheckCircle2, Wrench } from "lucide-react"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"]
const REVENUE = [1200, 1850, 2100, 3400, 4100, 4890]
const OS_COUNT = [12, 18, 21, 34, 41, 48]

const MAX_REVENUE = Math.max(...REVENUE)
const MAX_OS = Math.max(...OS_COUNT)

function BarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {data.map((val, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full justify-center">
            <div
              className={`w-full rounded-t-md ${color} transition-all duration-500`}
              style={{ height: `${(val / max) * 100}px` }}
            />
          </div>
          <span className="text-[10px] text-[--muted-foreground]">{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  )
}

const TOP_SERVICES = [
  { name: "Troca de tela",        count: 31, pct: 100 },
  { name: "Troca de bateria",     count: 22, pct: 71  },
  { name: "Reparo por água",      count: 15, pct: 48  },
  { name: "Troca de conector",    count: 10, pct: 32  },
  { name: "Câmera",               count: 7,  pct: 22  },
]

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Relatórios" />
      <div className="flex-1 space-y-6 p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "OS este mês",       value: "18",       icon: ClipboardList,  color: "text-[--primary]",  bg: "bg-[--primary]/8"  },
            { label: "Receita do mês",    value: "R$ 4.890", icon: TrendingUp,     color: "text-[#10b981]",    bg: "bg-[#10b981]/8"    },
            { label: "Tempo médio",       value: "2,4 dias", icon: Clock,          color: "text-[#f59e0b]",    bg: "bg-[#f59e0b]/8"    },
            { label: "Taxa conclusão",    value: "94%",      icon: CheckCircle2,   color: "text-[#8b5cf6]",    bg: "bg-[#8b5cf6]/8"    },
          ].map((k) => (
            <Card key={k.label} className="border-[--border] shadow-none">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[--foreground]">{k.value}</p>
                  <p className="text-xs text-[--muted-foreground]">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue chart */}
          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-semibold">Faturamento mensal (R$)</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={REVENUE} max={MAX_REVENUE} color="bg-[--primary]" />
              <div className="mt-3 flex items-center justify-between text-xs text-[--muted-foreground]">
                <span>Jan — Jun 2026</span>
                <span className="font-semibold text-[#10b981]">↑ 12% vs. mês anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* OS chart */}
          <Card className="border-[--border] shadow-none">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-semibold">Ordens de Serviço abertas</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={OS_COUNT} max={MAX_OS} color="bg-[#8b5cf6]" />
              <div className="mt-3 flex items-center justify-between text-xs text-[--muted-foreground]">
                <span>Jan — Jun 2026</span>
                <span className="font-semibold text-[#10b981]">↑ 17% vs. mês anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top services */}
        <Card className="border-[--border] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[--primary]" />
              Serviços mais realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TOP_SERVICES.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <p className="w-40 truncate text-sm text-[--foreground]">{s.name}</p>
                  <div className="flex-1 h-2 rounded-full bg-[--muted] overflow-hidden">
                    <div className="h-full rounded-full bg-[--primary] transition-all" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-[--foreground]">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
