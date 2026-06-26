"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wrench } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

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
 * - Sem sessão → /login.
 * - Sessão sem onboarding concluído → /onboarding.
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, tenant, loading } = useAuth()
  const router = useRouter()

  const needsOnboarding = !!tenant && !tenant.onboardingDone

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
    } else if (needsOnboarding) {
      router.replace("/onboarding")
    }
  }, [loading, user, needsOnboarding, router])

  if (loading || !user || needsOnboarding) {
    return <Splash />
  }

  return <>{children}</>
}
