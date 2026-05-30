import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2, Clock } from "lucide-react"

const TRANSACTIONS = [
  { id: "1", desc: "OS #3 — Motorola G84",        type: "income",  amount: 180,  status: "received", date: "Hoje, 14:30"   },
  { id: "2", desc: "OS #1 — iPhone 14 Pro",        type: "income",  amount: 470,  status: "pending",  date: "Ontem, 10:15"  },
  { id: "3", desc: "Compra Telas — Moisés",        type: "expense", amount: 840,  status: "paid",     date: "28/05, 09:00"  },
  { id: "4", desc: "Película iPhone 14 (PDV)",     type: "income",  amount: 35,   status: "received", date: "28/05, 16:45"  },
  { id: "5", desc: "OS #2 — Samsung Galaxy S23",   type: "income",  amount: 310,  status: "pending",  date: "27/05, 11:30"  },
  { id: "6", desc: "Compra Baterias — TechParts",  type: "expense", amount: 325,  status: "paid",     date: "26/05, 08:00"  },
]

const STATS = [
  { label: "Receita do mês",    value: "R$ 4.890", trend: "+12%", up: true,  icon: TrendingUp,   color: "text-[#10b981]", bg: "bg-[#10b981]/8"  },
  { label: "Despesas do mês",   value: "R$ 1.165", trend: "-5%",  up: false, icon: TrendingDown, color: "text-[#ef4444]", bg: "bg-[#ef4444]/8"  },
  { label: "A receber",         value: "R$ 780",   trend: "2 OS", up: true,  icon: Clock,        color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/8"  },
  { label: "Resultado líquido", value: "R$ 3.725", trend: "+18%", up: true,  icon: DollarSign,   color: "text-[--primary]", bg: "bg-[--primary]/8" },
]

export default function FinanceiroPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Financeiro" />
      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-[--border] shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[--muted-foreground]">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-[--foreground]">{stat.value}</p>
                    <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${stat.up ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.trend}
                    </p>
                  </div>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions */}
        <Card className="border-[--border] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Lançamentos recentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {TRANSACTIONS.map((t) => (
                <div key={t.id} className="flex items-center gap-4 rounded-lg px-3 py-3 hover:bg-[--muted]/40 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-[#10b981]/10" : "bg-[#ef4444]/10"}`}>
                    {t.type === "income"
                      ? <TrendingUp className="h-4 w-4 text-[#10b981]" />
                      : <TrendingDown className="h-4 w-4 text-[#ef4444]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--foreground] truncate">{t.desc}</p>
                    <p className="text-xs text-[--muted-foreground]">{t.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-sm font-bold ${t.type === "income" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {t.type === "income" ? "+" : "-"} R$ {t.amount.toFixed(2).replace(".", ",")}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      t.status === "received" || t.status === "paid"
                        ? "bg-[#10b981]/10 text-[#10b981]"
                        : "bg-[#f59e0b]/10 text-[#f59e0b]"
                    }`}>
                      {t.status === "received" || t.status === "paid"
                        ? <><CheckCircle2 className="h-3 w-3" /> {t.status === "received" ? "Recebido" : "Pago"}</>
                        : <><Clock className="h-3 w-3" /> Pendente</>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
