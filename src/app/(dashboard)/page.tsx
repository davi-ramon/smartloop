import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  Users,
  TrendingUp,
  CheckCircle2,
  Plus,
  ShoppingCart,
  Zap,
  ArrowRight,
  Clock,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import type { ServiceOrderStatus } from "@/types/database"

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  received: "Recebido",
  analyzing: "Em análise",
  waiting_part: "Aguardando peça",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const STATUS_BADGE: Record<ServiceOrderStatus, string> = {
  received: "received",
  analyzing: "analyzing",
  waiting_part: "waiting_part",
  ready: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
}

const RECENT_OS = [
  {
    id: "1",
    number: 3,
    customer: "Pedro Alves",
    device: "Motorola G84",
    problem: "Bateria não carrega",
    status: "ready" as ServiceOrderStatus,
    elapsed: "há 2h",
    technician: "Carlos",
  },
  {
    id: "2",
    number: 2,
    customer: "Maria Santos",
    device: "Samsung Galaxy S23",
    problem: "Não liga, entrou água",
    status: "waiting_part" as ServiceOrderStatus,
    elapsed: "há 1d",
    technician: "André",
  },
  {
    id: "3",
    number: 1,
    customer: "João Silva",
    device: "iPhone 14 Pro",
    problem: "Tela quebrada",
    status: "analyzing" as ServiceOrderStatus,
    elapsed: "há 2d",
    technician: "Carlos",
  },
]

const STATS = [
  {
    label: "OS abertas",
    value: "3",
    sub: "+1 hoje",
    trend: "up",
    icon: ClipboardList,
    color: "text-[--primary]",
    bg: "bg-[--primary]/8",
  },
  {
    label: "Clientes ativos",
    value: "127",
    sub: "+4 este mês",
    trend: "up",
    icon: Users,
    color: "text-[#8b5cf6]",
    bg: "bg-[#8b5cf6]/8",
  },
  {
    label: "Faturamento mês",
    value: "R$ 4.890",
    sub: "+12% vs. mês anterior",
    trend: "up",
    icon: TrendingUp,
    color: "text-[--accent]",
    bg: "bg-[--accent]/8",
  },
  {
    label: "OS concluídas",
    value: "18",
    sub: "neste mês",
    trend: "neutral",
    icon: CheckCircle2,
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/8",
  },
]

const QUICK_ACTIONS = [
  {
    label: "Nova OS",
    description: "Abrir nova ordem de serviço",
    href: "/os/nova",
    icon: ClipboardList,
    color: "bg-[--primary]",
  },
  {
    label: "Nova Venda",
    description: "Registrar venda no PDV",
    href: "/pdv",
    icon: ShoppingCart,
    color: "bg-[#10b981]",
  },
  {
    label: "Orçamento Rápido",
    description: "Criar orçamento sem OS",
    href: "/orcamento-rapido",
    icon: Zap,
    color: "bg-[--accent]",
  },
  {
    label: "Novo Cliente",
    description: "Cadastrar cliente",
    href: "/clientes/novo",
    icon: Users,
    color: "bg-[#8b5cf6]",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Início" description="Bem-vindo de volta, Pedro 👋" />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-[--border] shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[--muted-foreground] truncate">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-[--foreground] leading-none">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-xs text-[--muted-foreground] truncate">{stat.sub}</p>
                  </div>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.bg} ml-3`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ações rápidas */}
          <Card className="border-[--border] shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[--foreground]">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-[--muted] transition-colors group"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[--foreground]">{action.label}</p>
                    <p className="text-xs text-[--muted-foreground] truncate">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[--muted-foreground] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* OS Recentes */}
          <Card className="border-[--border] shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[--foreground]">
                  Ordens de Serviço recentes
                </CardTitle>
                <Link href="/os" className="text-xs text-[--primary] hover:underline font-medium">
                  Ver todas →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {RECENT_OS.map((os) => (
                  <Link
                    key={os.id}
                    href={`/os/${os.id}`}
                    className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-[--muted] transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--muted] text-xs font-bold text-[--muted-foreground]">
                      #{os.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[--foreground] truncate">{os.customer}</p>
                        <span className="text-xs text-[--muted-foreground] shrink-0">·</span>
                        <p className="text-xs text-[--muted-foreground] truncate">{os.device}</p>
                      </div>
                      <p className="text-xs text-[--muted-foreground] mt-0.5 truncate">{os.problem}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant={STATUS_BADGE[os.status] as Parameters<typeof Badge>[0]["variant"]}
                        className="text-[10px] h-5"
                      >
                        {STATUS_LABELS[os.status]}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] text-[--muted-foreground]">
                        <Clock className="h-3 w-3" />
                        {os.elapsed}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/os/nova">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nova OS
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding / Getting started */}
        <Card className="border-dashed border-[--border] bg-gradient-to-br from-[--primary]/5 to-[--accent]/5 shadow-none">
          <CardContent className="flex items-center gap-6 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--primary]">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[--foreground]">Configure sua loja</p>
              <p className="text-sm text-[--muted-foreground] mt-0.5">
                Adicione logo, formas de pagamento e personalize sua experiência.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/configuracoes">
                Configurar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
