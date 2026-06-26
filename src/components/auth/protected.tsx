"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Wrench } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { logger } from "@/lib/logger"

function Splash() {
  return (
    <div className="flex h-screen items-center justify-center bg-[--background]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[--primary] border-t-transparent" />
      </div>
    </div>
  )
}

/**
 * Guard de rota client-side (app é static export, sem middleware/SSR).
 * Envolve TODO o grupo (dashboard), então protege todas as rotas internas
 * (/os, /clientes, /pdv, /configuracoes, etc.).
 * - Sem sessão → /login.
 * - Sessão sem onboarding concluído → /onboarding.
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, tenant, loading } = useAuth()
  const router = useRouter()
  const lastAction = useRef<string>("")

  const needsOnboarding = !!tenant && tenant.onboardingDone !== true

  useEffect(() => {
    if (loading) return

    if (!user) {
      if (lastAction.current !== "login") {
        logger.info("guard", "sem sessão — redirecionando para /login")
        lastAction.current = "login"
      }
      router.replace("/login")
      return
    }

    if (needsOnboarding) {
      if (lastAction.current !== "onboarding") {
        logger.info("guard", "onboarding pendente — bloqueando rota interna e indo para /onboarding", {
          onboardingDone: tenant?.onboardingDone ?? null,
        })
        lastAction.current = "onboarding"
      }
      router.replace("/onboarding")
      return
    }

    if (lastAction.current !== "ok") {
      logger.success("guard", "acesso liberado ao dashboard", { tenantId: tenant?.id })
      lastAction.current = "ok"
    }
  }, [loading, user, needsOnboarding, tenant?.id, tenant?.onboardingDone, router])

  // Enquanto carrega, sem usuário, OU onboarding pendente → não renderiza o conteúdo interno.
  if (loading || !user || needsOnboarding) {
    return <Splash />
  }

  return <>{children}</>
}
