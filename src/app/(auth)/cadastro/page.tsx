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
import { useAuth } from "@/lib/firebase/auth-context"
import { authErrorMessage } from "@/lib/firebase/auth-errors"
import { logger } from "@/lib/logger"

const schema = z.object({
  name: z.string().min(1, "Informe seu nome").min(2, "Nome muito curto"),
  store: z.string().min(1, "Informe o nome da loja"),
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Crie uma senha").min(6, "A senha deve ter ao menos 6 caracteres"),
})
type Form = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [state, setState] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string }>({ status: "idle" })

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setState({ status: "loading" })
    try {
      // Cria a conta + a loja (tenant) no Firestore.
      await signup(data.name, data.email, data.password, data.store)
      logger.info("auth", "conta criada — enviando para o onboarding")
      setState({ status: "success" })
      // Conta nova sempre passa pelo onboarding antes do dashboard.
      router.replace("/onboarding")
    } catch (err) {
      logger.error("auth", "falha no cadastro", err)
      setState({ status: "error", message: authErrorMessage(err) })
    }
  }

  const isLoading = state.status === "loading" || state.status === "success"

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
          <p className="mt-1 text-sm text-[--muted-foreground]">14 dias grátis — cartão exigido, cobrado só após o teste.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar sua conta</CardTitle>
            <CardDescription>Comece a organizar sua assistência hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            {state.status === "error" && (
              <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {state.message}
              </div>
            )}
            {state.status === "success" && (
              <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-2.5 text-sm text-[#10b981]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Conta criada! Entrando...
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" placeholder="João da Silva" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
                {errors.name && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3 shrink-0" />{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Nome da loja</Label>
                <Input id="store" placeholder="Assistência Connect" aria-invalid={!!errors.store} {...register("store")} />
                {errors.store && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3 shrink-0" />{errors.store.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
                {errors.email && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3 shrink-0" />{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
                {errors.password && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3 shrink-0" />{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Criando...</>) : "Criar conta grátis"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-[--muted-foreground]">
          Já tem conta?{" "}
          <Link href="/login" className="text-[--primary] hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
