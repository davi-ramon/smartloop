"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wrench } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"

/**
 * Guard de rota client-side. Necessário porque o app é static export
 * (sem middleware/SSR). Redireciona para /login se não houver sessão.
 */
export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
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

  return <>{children}</>
}
