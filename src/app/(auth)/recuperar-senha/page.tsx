"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Wrench, Loader2, AlertCircle, CheckCircle2, ArrowLeft,
  Mail, KeyRound, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requestResetCode, confirmResetCode, callableErrorMessage } from "@/lib/firebase/password-reset"
import { logger } from "@/lib/logger"

type Step = "email" | "code" | "done"

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes("@")) { setError("Informe um e-mail válido."); return }
    setLoading(true); setError(null)
    try {
      await requestResetCode(email.trim())
      setStep("code")
    } catch (err) {
      logger.error("auth", "falha ao solicitar código", err)
      setError(callableErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().length !== 6) { setError("O código tem 6 dígitos."); return }
    if (password.length < 6) { setError("A nova senha deve ter ao menos 6 caracteres."); return }
    if (password !== confirm) { setError("As senhas não coincidem."); return }
    setLoading(true); setError(null)
    try {
      await confirmResetCode(email.trim(), code.trim(), password)
      setStep("done")
    } catch (err) {
      logger.error("auth", "falha ao confirmar código", err)
      setError(callableErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setLoading(true); setError(null)
    try { await requestResetCode(email.trim()) }
    catch (err) { setError(callableErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--muted] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Smart<span className="text-[--primary]">Loop</span></h1>
        </div>

        <Card>
          {step === "done" ? (
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/10">
                <ShieldCheck className="h-7 w-7 text-[#10b981]" />
              </div>
              <div>
                <h2 className="font-semibold text-[--foreground]">Senha redefinida!</h2>
                <p className="mt-1.5 text-sm text-[--muted-foreground]">Já pode entrar com a nova senha.</p>
              </div>
              <Button className="w-full" onClick={() => router.push("/login")}>Ir para o login</Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {step === "email" ? <Mail className="h-4 w-4 text-[--primary]" /> : <KeyRound className="h-4 w-4 text-[--primary]" />}
                  {step === "email" ? "Recuperar senha" : "Digite o código"}
                </CardTitle>
                <CardDescription>
                  {step === "email"
                    ? "Informe seu e-mail e enviaremos um código de 6 dígitos."
                    : `Enviamos um código para ${email}. Ele expira em 5 minutos.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                {step === "email" ? (
                  <form onSubmit={handleRequest} noValidate className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" loading={loading} disabled={loading}>Enviar código</Button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirm} noValidate className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código de 6 dígitos</Label>
                      <Input id="code" inputMode="numeric" maxLength={6} placeholder="000000" className="text-center text-lg font-bold tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pass">Nova senha</Label>
                      <Input id="new-pass" type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass">Confirmar nova senha</Label>
                      <Input id="confirm-pass" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                      <CheckCircle2 className="h-4 w-4" /> Redefinir senha
                    </Button>
                    <button type="button" onClick={handleResend} disabled={loading} className="w-full text-center text-xs text-[--primary] hover:underline disabled:opacity-50">
                      Não recebeu? Reenviar código
                    </button>
                  </form>
                )}
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-[--muted-foreground]">
          <Link href="/login" className="inline-flex items-center gap-1 text-[--primary] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
