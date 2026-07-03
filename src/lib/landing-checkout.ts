import { logger } from "@/lib/logger"

export type LandingPlanKey = "basic" | "pro" | "premium"

const CHECKOUT_URL =
  "https://southamerica-east1-smartloop-94a06.cloudfunctions.net/createDirectCheckout"

/**
 * Abre o Stripe Checkout do plano escolhido na landing (cobrança imediata).
 * A chave secreta fica só no backend; aqui só chamamos a Cloud Function.
 */
export async function checkoutPlan(plan: LandingPlanKey): Promise<void> {
  logger.info("landing", "checkout direto solicitado", { plan })
  try {
    const res = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
    const data = (await res.json()) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      logger.error("landing", "checkout sem URL", { plan, status: res.status, error: data.error })
      throw new Error("checkout_failed")
    }
    logger.success("landing", "redirecionando ao Stripe Checkout", { plan })
    window.location.href = data.url
  } catch (err) {
    logger.error("landing", "falha ao abrir checkout", err)
    throw err
  }
}
