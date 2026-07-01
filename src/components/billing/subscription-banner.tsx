"use client"

import Link from "next/link"
import { Sparkles, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { accessState } from "@/lib/firebase/billing"

/** Faixa no topo do app: trial em contagem regressiva ou cobrança falhando. */
export function SubscriptionBanner() {
  const { tenant } = useAuth()
  const { state, trialDaysLeft } = accessState(tenant)

  if (state === "trial") {
    return (
      <Link href="/configuracoes" className="flex items-center justify-center gap-2 bg-[--primary]/10 px-4 py-2 text-xs font-medium text-[--primary] transition-colors hover:bg-[--primary]/15">
        <Sparkles className="h-3.5 w-3.5" />
        Teste grátis · {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
        <span className="underline">Assinar agora</span>
      </Link>
    )
  }

  if (state === "past_due") {
    return (
      <Link href="/configuracoes" className="flex items-center justify-center gap-2 bg-[#f59e0b]/10 px-4 py-2 text-xs font-medium text-[#f59e0b] transition-colors hover:bg-[#f59e0b]/15">
        <AlertTriangle className="h-3.5 w-3.5" />
        Falha na cobrança da assinatura. <span className="underline">Atualize o pagamento</span> para não perder o acesso.
      </Link>
    )
  }

  return null
}
