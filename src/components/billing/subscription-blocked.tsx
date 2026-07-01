"use client"

import { useState } from "react"
import { Wrench, Check, Star, LogOut, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/firebase/auth-context"
import { PLANS, startCheckout, type PlanKey } from "@/lib/firebase/billing"

/** Tela cheia exibida quando o trial venceu sem assinatura ativa. */
export function SubscriptionBlocked() {
  const { logout } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function assinar(plan: PlanKey) {
    setLoadingPlan(plan); setError(null)
    try {
      await startCheckout(plan) // redireciona para o Stripe
    } catch {
      setError("Não foi possível iniciar a assinatura. Tente novamente.")
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[--muted] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[--foreground]">Seu acesso está pausado</h1>
          <p className="mt-2 max-w-md text-sm text-[--muted-foreground]">
            O período de teste terminou (ou o pagamento não foi concluído). Escolha um plano para continuar usando o SmartLoop — seus dados estão salvos.
          </p>
        </div>

        {error && (
          <div role="alert" className="mx-auto mb-6 flex max-w-md items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.key} className={`relative flex flex-col rounded-2xl border bg-[--card] p-6 ${p.highlight ? "border-[--primary] shadow-lg ring-1 ring-[--primary]/30" : "border-[--border]"}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-[--primary] to-[#7c3aed] px-3 py-0.5 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-white" />Mais escolhido
                </span>
              )}
              <p className="text-sm font-semibold text-[--primary]">{p.name}</p>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-black text-[--foreground]">R$ {p.price}</span>
                <span className="mb-1 text-xs text-[--muted-foreground]">/mês</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[--foreground]"><Check className="h-4 w-4 shrink-0 text-[#10b981]" />{f}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={p.highlight ? "default" : "outline"} loading={loadingPlan === p.key} disabled={loadingPlan !== null} onClick={() => assinar(p.key)}>
                Assinar {p.name}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[--muted-foreground]">
          Pagamento seguro via Stripe · Cancele quando quiser
        </p>
        <div className="mt-4 flex justify-center">
          <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm text-[--muted-foreground] hover:text-[--foreground]">
            <LogOut className="h-4 w-4" />Sair
          </button>
        </div>
      </div>
    </div>
  )
}
