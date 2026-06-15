"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Wrench, Loader2, AlertCircle, CheckCircle2, ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/firebase/auth-context"
import { authErrorMessage } from "@/lib/firebase/auth-errors"
import { logger } from "@/lib/logger"

const schema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
})
type Form = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const { resetPassword } = useAuth()
  const [state, setState] = useState<{ status: "idle" | "loading" | "sent" | "error"; message?: string; email?: string }>({ status: "idle" })

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setState({ status: "loading" })
    try {
      await resetPassword(data.email)
      setState({ status: "sent", email: data.email })
    } catch (err) {
      logger.error("auth", "falha ao enviar reset", err)
      setState({ status: "error", message: authErrorMessage(err) })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--muted] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            Smart<span className="text-[--primary]">Loop</span>
          </h1>
        </div>

        <Card>
          {state.status === "sent" ? (
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981]/10">
                <MailCheck className="h-7 w-7 text-[#10b981]" />
              </div>
              <div>
                <h2 className="font-semibold text-[--foreground]">Verifique seu e-mail</h2>
                <p className="mt-1.5 text-sm text-[--muted-foreground]">
                  Enviamos um link de redefinição para{" "}
                  <span className="font-medium text-[--foreground]">{state.email}</span>.
                  Confira também a caixa de spam.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Recuperar senha</CardTitle>
                <CardDescription>
                  Informe seu e-mail e enviaremos um link para criar uma nova senha.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {state.status === "error" && (
                  <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {state.message}
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={state.status === "loading"}>
                    {state.status === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link de recuperação"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-[--muted-foreground]">
          Lembrou a senha?{" "}
          <Link href="/login" className="text-[--primary] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
