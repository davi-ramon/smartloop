import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, ClipboardList, CheckCircle } from "lucide-react"

const stats = [
  {
    label: "OS abertas hoje",
    value: "0",
    icon: ClipboardList,
    color: "text-[--primary]",
    bg: "bg-[--primary]/10",
  },
  {
    label: "OS concluídas no mês",
    value: "0",
    icon: CheckCircle,
    color: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
  },
  {
    label: "Faturamento do mês",
    value: "R$ 0,00",
    icon: TrendingUp,
    color: "text-[--accent]",
    bg: "bg-[--accent]/10",
  },
  {
    label: "Ticket médio",
    value: "R$ 0,00",
    icon: BarChart3,
    color: "text-[#6366f1]",
    bg: "bg-[#6366f1]/10",
  },
]

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col">
      <Header title="Relatórios" />
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[--muted-foreground]">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-[--foreground]">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-dashed border-[--border] p-12 text-center">
          <p className="text-sm text-[--muted-foreground]">
            Gráficos e relatórios detalhados disponíveis na Fase 2 (Semana 6)
          </p>
        </div>
      </div>
    </div>
  )
}
