"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Wrench, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logger } from "@/lib/logger"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(1, "Informe sua senha")
    .min(6, "A senha deve ter ao menos 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; message: string }

export default function LoginPage() {
  const router = useRouter()
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  })

  async function onSubmit(data: LoginForm) {
    logger.info("auth", "submit de login iniciado", { email: data.email })
    setSubmitState({ status: "loading" })

    try {
      // TODO(Semana 4): integrar Firebase Auth real. Hoje é modo demonstração.
      await new Promise((r) => setTimeout(r, 600))

      logger.success("auth", "login (modo demo) — redirecionando para /os", { email: data.email })
      setSubmitState({ status: "success", message: "Entrando..." })
      router.push("/os")
    } catch (err) {
      logger.error("auth", "falha no login", err)
      setSubmitState({
        status: "error",
        message: "Não foi possível entrar. Tente novamente.",
      })
    }
  }

  function onInvalid(formErrors: typeof errors) {
    logger.warn("auth", "submit bloqueado por validação", {
      campos: Object.keys(formErrors),
    })
  }

  async function handleGoogle() {
    logger.info("auth", "login com Google (modo demo)")
    setSubmitState({ status: "loading" })
    await new Promise((r) => setTimeout(r, 500))
    logger.success("auth", "google (modo demo) — redirecionando para /os")
    router.push("/os")
  }

  const isLoading = submitState.status === "loading" || submitState.status === "success"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--muted] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            Smart<span className="text-[--primary]">Loop</span>
          </h1>
          <p className="mt-1 text-sm text-[--muted-foreground]">
            A OS que resolve. O sistema que escala.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Use seu e-mail e senha para acessar o painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Feedback global de submit */}
            {submitState.status === "error" && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitState.message}
              </div>
            )}
            {submitState.status === "success" && (
              <div
                role="status"
                className="mb-4 flex items-center gap-2 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-2.5 text-sm text-[#10b981]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {submitState.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-[--primary] hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                {errors.password && (
                  <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[--border]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[--card] px-2 text-[--muted-foreground]">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </Button>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-[--muted-foreground]">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-[--primary] hover:underline">
            Teste grátis por 14 dias
          </Link>
        </p>
      </div>
    </div>
  )
}
