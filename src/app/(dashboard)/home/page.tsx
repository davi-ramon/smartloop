"use client"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/firebase/auth-context"
import {
  ClipboardList, Users, TrendingUp, CheckCircle2, ShoppingCart,
  Zap, ArrowRight, Clock, Settings,
} from "lucide-react"

const STATS = [
  { label: "OS abertas", value: "0", sub: "nenhuma hoje", icon: ClipboardList, color: "text-[--primary]", bg: "bg-[--primary]/8" },
  { label: "Clientes ativos", value: "0", sub: "cadastre o primeiro", icon: Users, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/8" },
  { label: "Faturamento do mês", value: "R$ 0,00", sub: "sem vendas ainda", icon: TrendingUp, color: "text-[--accent]", bg: "bg-[--accent]/8" },
  { label: "OS concluídas", value: "0", sub: "neste mês", icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#10b981]/8" },
]

const QUICK_ACTIONS = [
  { label: "Nova OS", description: "Abrir nova ordem de serviço", href: "/os/nova", icon: ClipboardList, color: "bg-[--primary]" },
  { label: "Nova Venda", description: "Registrar venda no PDV", href: "/pdv", icon: ShoppingCart, color: "bg-[#10b981]" },
  { label: "Orçamento Rápido", description: "Criar orçamento sem OS", href: "/orcamento-rapido", icon: Zap, color: "bg-[--accent]" },
  { label: "Novo Cliente", description: "Cadastrar cliente", href: "/clientes/novo", icon: Users, color: "bg-[#8b5cf6]" },
]

export default function HomePage() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(" ")[0]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Início" description={firstName ? `Bem-vindo de volta, ${firstName}` : "Bem-vindo de volta"} />

      <div className="flex-1 space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-[--border] shadow-none transition-shadow hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[--muted-foreground]">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold leading-none text-[--foreground]">{stat.value}</p>
                    <p className="mt-1.5 truncate text-xs text-[--muted-foreground]">{stat.sub}</p>
                  </div>
                  <div className={`ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
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
                  className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[--muted]"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[--foreground]">{action.label}</p>
                    <p className="truncate text-xs text-[--muted-foreground]">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[--muted-foreground] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* OS recentes — estado vazio */}
          <Card className="border-[--border] shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[--foreground]">Ordens de Serviço recentes</CardTitle>
                <Link href="/os" className="text-xs font-medium text-[--primary] hover:underline">Ver todas</Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[--border] py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[--muted]">
                  <Clock className="h-5 w-5 text-[--muted-foreground]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[--foreground]">Nenhuma OS por aqui ainda</p>
                  <p className="mt-0.5 text-xs text-[--muted-foreground]">Abra sua primeira ordem de serviço para começar.</p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/os/nova">Abrir primeira OS</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA de configuração */}
        <Card className="border-dashed border-[--border] bg-gradient-to-br from-[--primary]/5 to-[--accent]/5 shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[--primary]">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[--foreground]">Configure sua loja</p>
              <p className="mt-0.5 text-sm text-[--muted-foreground]">Adicione logo, formas de pagamento e personalize sua experiência.</p>
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
