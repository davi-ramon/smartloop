"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-context"
import { createCustomer } from "@/lib/data/customers"
import { logger } from "@/lib/logger"

const schema = z.object({
  name: z.string().min(1, "Informe o nome do cliente").min(2, "Nome muito curto"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
})
type Form = z.infer<typeof schema>

export default function NovoClientePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    if (!tenantId) {
      setError("Sessão ainda carregando. Aguarde um instante e tente novamente.")
      logger.warn("customers", "tentativa de criar cliente sem tenantId")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createCustomer(tenantId, {
        name: data.name,
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        cpf: data.cpf || "",
        active: true,
      })
      router.push("/clientes")
    } catch {
      setError("Não foi possível salvar o cliente. Tente novamente.")
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Novo Cliente" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-xl">
          <Link href="/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[--muted-foreground] hover:text-[--foreground]">
            <ArrowLeft className="h-4 w-4" />
            Voltar para clientes
          </Link>

          <Card className="border-[--border] shadow-none">
            <CardContent className="p-6">
              {error && (
                <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" placeholder="Nome completo" aria-invalid={!!errors.name} {...register("name")} />
                  {errors.name && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3" />{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" placeholder="(00) 00000-0000" {...register("whatsapp")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="cliente@email.com" aria-invalid={!!errors.email} {...register("email")} />
                    {errors.email && <p role="alert" className="flex items-center gap-1.5 text-xs text-[--destructive]"><AlertCircle className="h-3 w-3" />{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cpf">CPF/CNPJ</Label>
                    <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/clientes">Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (<><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>) : "Salvar cliente"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
