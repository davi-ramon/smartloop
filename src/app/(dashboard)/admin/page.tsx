"use client"

import * as React from "react"
import { getFunctions, httpsCallable } from "firebase/functions"
import { motion } from "motion/react"
import {
  ShieldAlert, Loader2, AlertCircle,
  UserPlus, UserCheck, UserMinus, TrendingDown,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { useAuth } from "@/lib/firebase/auth-context"
import { isAdmin } from "@/lib/admins"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import app from "@/lib/firebase/config"

const functions = getFunctions(app, "southamerica-east1")

interface AdminSubscriptionStats {
  totalTenants: number
  active: number
  trialing: number
  past_due: number
  canceled: number
  unpaid: number
  incomplete: number
  newLast7: number
  newLast30: number
  churnLast30: number
}

export default function AdminPainelPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.email)
  const [stats, setStats] = React.useState<AdminSubscriptionStats | null>(null)
  const [error, setError] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const loadStats = React.useCallback(() => {
    startTransition(async () => {
      try {
        const fn = httpsCallable(functions, "getAdminSubscriptionStats")
        const res = await fn()
        setStats(res.data as AdminSubscriptionStats)
        setError(false)
        logger.info("admin", "stats carregados", {})
      } catch (err) {
        logger.error("admin", "falha ao carregar stats", err)
        setError(true)
      }
    })
  }, [])

  React.useEffect(() => {
    if (!admin) return
    loadStats()
  }, [admin, loadStats])

  const loading = isPending && !stats

  if (!admin) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Painel" description="Visão geral dos assinantes do SmartLoop" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <ShieldAlert className="h-10 w-10 text-[--muted-foreground]" />
          <p className="text-sm font-medium text-[--foreground]">Acesso restrito</p>
          <p className="max-w-xs text-xs text-[--muted-foreground]">
            Esta área é exclusiva para administradores e desenvolvedores do SmartLoop.
          </p>
        </div>
      </div>
    )
  }

  const ativosTotal = (stats?.active ?? 0) + (stats?.trialing ?? 0)
  const churnPct = stats && stats.totalTenants > 0
    ? ((stats.churnLast30 / stats.totalTenants) * 100).toFixed(1)
    : "0,0"

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Painel"
        description="Visão geral dos assinantes do SmartLoop"
        action={{ label: "Atualizar", onClick: loadStats }}
      />

      <div className="flex-1 space-y-6 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444]">
            <AlertCircle className="h-4 w-4" />
            Falha ao carregar os indicadores. Tente atualizar.
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<UserPlus className="h-5 w-5" />}
                color="#2563eb"
                label="Novos (7 dias)"
                value={stats.newLast7}
                hint={`${stats.newLast30} nos últimos 30 dias`}
              />
              <StatCard
                icon={<UserCheck className="h-5 w-5" />}
                color="#10b981"
                label="Ativos + trial"
                value={ativosTotal}
                hint={`${stats.active} ativos · ${stats.trialing} em trial`}
              />
              <StatCard
                icon={<UserMinus className="h-5 w-5" />}
                color="#f59e0b"
                label="Cancelados (30d)"
                value={stats.churnLast30}
                hint={`${stats.canceled} cancelados totais`}
              />
              <StatCard
                icon={<TrendingDown className="h-5 w-5" />}
                color="#ef4444"
                label="Churn (30d)"
                value={`${churnPct}%`}
                hint={`${stats.churnLast30} de ${stats.totalTenants} lojas`}
              />
            </div>

            <div className="rounded-xl border border-[--border] bg-[--card] p-4">
              <h3 className="text-sm font-semibold text-[--foreground]">Resumo da carteira</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Mini label="Ativos" value={stats.active} />
                <Mini label="Em trial" value={stats.trialing} />
                <Mini label="Inadimplentes" value={stats.past_due} />
                <Mini label="Incompletos" value={stats.incomplete} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  color: string
  label: string
  value: number | string
  hint?: string
}
function StatCard({ icon, color, label, value, hint }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-[--border] bg-[--card] p-4"
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-[--muted-foreground]">
          {label}
        </p>
      </div>
      <p className="mt-2 text-2xl font-bold text-[--foreground]">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[--muted-foreground]">{hint}</p>}
    </motion.div>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] text-[--muted-foreground]">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-[--foreground]">{value}</p>
    </div>
  )
}