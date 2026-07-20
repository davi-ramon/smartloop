"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-context"
import { logger } from "@/lib/logger"
import { Loader2 } from "lucide-react"

/**
 * Guard que libera a renderizacao apenas para owners (role === 'owner' no
 * profile). Tecnicos sao redirecionados para /home com logger.warn.
 *
 * Usar em volta do conteudo de paginas restritas: /financeiro, /relatorios,
 * /admin, /configuracoes.
 */
export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const role = profile?.role ?? "technician"

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (role !== "owner") {
      logger.warn("guard", "tecnico tentou acessar rota restrita, redirecionando para /home", {
        role,
        path: window.location.pathname,
      })
      router.replace("/home")
    }
  }, [loading, user, role, router])

  if (loading || role !== "owner") {
    return (
      <div className="flex h-screen items-center justify-center bg-[--background]">
        <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
      </div>
    )
  }

  return <>{children}</>
}