"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Wrench, Loader2, AlertCircle, CheckCircle2, KeyRound, Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { acceptTechnicianInvite } from "@/lib/firebase/technicians"
import { logger } from "@/lib/logger"

/**
 * Pagina de ativacao de convite de tecnico.
 * O tecnico clica no link do email → /ativar-convite?token={uid} →
 * define senha → conta ativada. Redirecionado para /login.
 */

function AtivarConviteInner() {
  const router = useRouter()
  const search = useSearchParams()
  const token = search.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError("Link invalido. Solicite um novo convite ao administrador.")
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (password.length < 8) {
      setError("A senha deve ter no minimo 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas nao coincidem.")
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await acceptTechnicianInvite(token, password)
      logger.info("tecnicos", "conta ativada com sucesso", { email: res.email })
      setSuccess(true)
      setTimeout(() => router.replace("/login"), 2500)
    } catch (err) {
      logger.error("tecnicos", "falha ao ativar conta", err)
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Nao foi possivel ativar a conta."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[--background] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981]/10">
              <CheckCircle2 className="h-6 w-6 text-[#10b981]" />
            </div>
            <CardTitle className="text-[--foreground]">Conta ativada</CardTitle>
            <CardDescription>
              Sua conta foi ativada com sucesso. Voce sera redirecionado para o login em instantes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--background] p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold text-[--foreground]">SmartLoop</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[--foreground]">Ativar conta de tecnico</CardTitle>
            <CardDescription>
              Defina uma senha para acessar o sistema. A senha deve ter ao menos 8 caracteres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pwd" className="text-[--foreground]">Nova senha</Label>
                <Input
                  id="pwd"
                  type="password"
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd2" className="text-[--foreground]">Confirmar senha</Label>
                <Input
                  id="pwd2"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Digite novamente"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading || !token}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading || !token || !password || !confirm}
                style={{ backgroundColor: "var(--primary)" }}
              >
                <KeyRound className="h-4 w-4" /> Ativar minha conta
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-xs text-[--muted-foreground] hover:text-[--primary]">
                Ja tem conta? Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-[10px] text-[--muted-foreground]">
          SmartLoop - gestao para assistencias tecnicas
        </p>
      </div>
    </div>
  )
}

export default function AtivarConvitePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
      </div>
    }>
      <AtivarConviteInner />
    </Suspense>
  )
}