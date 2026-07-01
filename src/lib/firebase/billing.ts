import { getFunctions, httpsCallable } from "firebase/functions"
import app from "./config"
import { logger } from "@/lib/logger"
import type { Tenant } from "@/lib/data/tenant"

const functions = getFunctions(app, "southamerica-east1")

export type PlanKey = "basic" | "pro" | "premium"

export const PLANS: { key: PlanKey; name: string; price: string; features: string[]; highlight?: boolean }[] = [
  { key: "basic", name: "Básico", price: "69,90", features: ["Até 100 OS/mês", "2 usuários", "Clientes, OS e estoque"] },
  { key: "pro", name: "Pro", price: "89,90", highlight: true, features: ["OS ilimitadas", "PDV + financeiro", "Relatórios", "Orçamento por link + WhatsApp"] },
  { key: "premium", name: "Premium", price: "149,90", features: ["Tudo do Pro", "Usuários ilimitados", "Multi-filial", "Suporte prioritário"] },
]

/** Inicia o checkout de assinatura e redireciona para o Stripe. */
export async function startCheckout(plan: PlanKey) {
  logger.info("billing", "iniciando checkout", { plan })
  const fn = httpsCallable(functions, "createCheckoutSession")
  const res = await fn({ plan })
  const url = (res.data as { url?: string })?.url
  if (!url) throw new Error("Não foi possível iniciar a assinatura.")
  window.location.href = url
}

/** Abre o portal de gestão da assinatura no Stripe. */
export async function openPortal() {
  logger.info("billing", "abrindo portal")
  const fn = httpsCallable(functions, "createPortalSession")
  const res = await fn({})
  const url = (res.data as { url?: string })?.url
  if (!url) throw new Error("Não foi possível abrir o portal.")
  window.location.href = url
}

export type AccessState = "ok" | "trial" | "past_due" | "blocked"

/** Decide o acesso do tenant com base na assinatura + trial. */
export function accessState(tenant: Tenant | null): { state: AccessState; trialDaysLeft: number } {
  if (!tenant) return { state: "ok", trialDaysLeft: 0 }
  const sub = tenant.subscriptionStatus
  const trialMs = tenant.trialEndsAt?.toMillis?.() ?? 0
  const trialDaysLeft = trialMs > Date.now() ? Math.ceil((trialMs - Date.now()) / 86400000) : 0

  if (sub === "active" || sub === "trialing") return { state: "ok", trialDaysLeft }
  if (sub === "past_due") return { state: "past_due", trialDaysLeft } // cobrança falhando, ainda com acesso
  if (!sub && trialMs > Date.now()) return { state: "trial", trialDaysLeft } // trial grátis vigente
  // trial expirado sem assinatura, ou unpaid/canceled/incomplete
  return { state: "blocked", trialDaysLeft: 0 }
}
