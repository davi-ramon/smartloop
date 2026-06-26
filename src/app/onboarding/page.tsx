"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  Wrench, Upload, Loader2, AlertCircle, ArrowRight, ArrowLeft,
  Check, Sparkles, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/firebase/auth-context"
import { updateTenant, uploadLogo } from "@/lib/data/tenant"
import { logger } from "@/lib/logger"

const PAYMENT_METHODS = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX"]

type FieldKey = "name" | "fantasyName" | "cnpj" | "whatsapp" | "city" | "email"
type StepType = "intro" | "text" | "logo" | "payments" | "finish"

interface Step {
  type: StepType
  key?: FieldKey
  question: string
  hint?: string
  placeholder?: string
  required?: boolean
  inputType?: string
}

const STEPS: Step[] = [
  { type: "intro", question: "Bem-vindo ao SmartLoop", hint: "Vamos configurar sua assistência em menos de 1 minuto. Esses dados aparecem nas OS, orçamentos e documentos." },
  { type: "text", key: "name", question: "Qual o nome da sua empresa?", hint: "Razão social ou nome principal da assistência.", placeholder: "Assistência Connect", required: true },
  { type: "text", key: "fantasyName", question: "Tem um nome fantasia?", hint: "Como os clientes conhecem a loja (opcional).", placeholder: "Connect Cell" },
  { type: "text", key: "cnpj", question: "Qual o CNPJ?", hint: "Opcional — aparece nos documentos fiscais.", placeholder: "00.000.000/0001-00" },
  { type: "text", key: "whatsapp", question: "Seu WhatsApp principal", hint: "Usado para falar com os clientes.", placeholder: "(00) 00000-0000" },
  { type: "text", key: "city", question: "Em qual cidade você atende?", hint: "Cidade e estado.", placeholder: "Araguaína, TO" },
  { type: "text", key: "email", question: "E-mail da loja", hint: "Já preenchemos com o e-mail da sua conta.", placeholder: "contato@loja.com.br", inputType: "email" },
  { type: "logo", question: "Adicione a logo da sua loja", hint: "PNG ou JPG, até 5MB. Você pode pular e adicionar depois." },
  { type: "payments", question: "Quais formas de pagamento você aceita?", hint: "Selecione todas que se aplicam." },
  { type: "finish", question: "Tudo pronto!", hint: "Você está no teste grátis de 14 dias do plano Pro — sem cartão agora." },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, tenant, loading } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [stepIndex, setStepIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [form, setForm] = useState<Record<FieldKey, string>>({
    name: "", fantasyName: "", cnpj: "", whatsapp: "", city: "", email: "",
  })
  const [methods, setMethods] = useState<string[]>(["Dinheiro", "PIX", "Cartão de Crédito"])
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prefilled = useRef(false)

  const step = STEPS[stepIndex]
  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100)

  // Guard de acesso.
  useEffect(() => {
    if (loading) return
    if (!user) {
      logger.info("onboarding", "sem sessão — indo para /login")
      router.replace("/login")
    } else if (tenant?.onboardingDone === true) {
      logger.info("onboarding", "onboarding já concluído — indo para /home")
      router.replace("/home")
    }
  }, [loading, user, tenant?.onboardingDone, router])

  // Pré-preenche uma vez.
  useEffect(() => {
    if (prefilled.current || !tenant) return
    prefilled.current = true
    setForm({
      name: tenant.name ?? "",
      fantasyName: tenant.fantasyName ?? "",
      cnpj: tenant.cnpj ?? "",
      whatsapp: tenant.whatsapp ?? "",
      city: tenant.city ?? "",
      email: tenant.email ?? user?.email ?? "",
    })
    if (tenant.logoUrl) setLogoUrl(tenant.logoUrl)
    if (tenant.paymentMethods?.length) setMethods(tenant.paymentMethods)
  }, [tenant, user?.email])

  function setField(key: FieldKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }
  function toggleMethod(m: string) {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  function goNext() {
    setError(null)
    if (step.type === "text" && step.required && !form[step.key!].trim()) {
      setError("Esse campo é obrigatório para continuar.")
      return
    }
    if (stepIndex < STEPS.length - 1) {
      setDir(1)
      setStepIndex((i) => i + 1)
    }
  }
  function goBack() {
    setError(null)
    if (stepIndex > 0) {
      setDir(-1)
      setStepIndex((i) => i - 1)
    }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.tenantId) return
    setUploadingLogo(true); setError(null)
    try {
      setLogoUrl(await uploadLogo(profile.tenantId, file))
    } catch {
      setError("Não foi possível enviar a logo. Você pode adicionar depois nas Configurações.")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleFinish() {
    if (!profile?.tenantId) return
    if (!form.name.trim()) {
      setError("Informe ao menos o nome da empresa.")
      setDir(-1); setStepIndex(1)
      return
    }
    setSaving(true); setError(null)
    logger.info("onboarding", "salvando dados e concluindo", { tenantId: profile.tenantId })
    try {
      await updateTenant(profile.tenantId, {
        name: form.name,
        fantasyName: form.fantasyName,
        cnpj: form.cnpj,
        whatsapp: form.whatsapp,
        city: form.city,
        email: form.email || user?.email || "",
        logoUrl: logoUrl || "",
        paymentMethods: methods,
        onboardingDone: true,
      })
      logger.success("onboarding", "onboarding concluído — liberando dashboard", { tenantId: profile.tenantId })
      router.replace("/home")
    } catch {
      logger.error("onboarding", "falha ao salvar onboarding")
      setError("Não foi possível salvar. Tente novamente.")
      setSaving(false)
    }
  }

  if (loading || !user || tenant?.onboardingDone === true) {
    return (
      <div className="flex h-screen items-center justify-center bg-[--background]">
        <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
      </div>
    )
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  }

  return (
    <div className="flex min-h-screen flex-col bg-[--background]">
      {/* Topo: marca + progresso */}
      <div className="shrink-0 px-5 pt-5">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[--foreground]">SmartLoop</span>
          <span className="ml-auto text-xs text-[--muted-foreground]">{stepIndex + 1} de {STEPS.length}</span>
        </div>
        <div className="mx-auto mt-3 h-1 max-w-lg overflow-hidden rounded-full bg-[--muted]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[--primary] to-[#7c3aed]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Conteúdo da etapa */}
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={stepIndex}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Pergunta */}
              <div className="mb-6">
                {step.type === "intro" && (
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-bold leading-tight text-[--foreground] sm:text-3xl">{step.question}</h1>
                {step.hint && <p className="mt-2 text-sm text-[--muted-foreground]">{step.hint}</p>}
              </div>

              {/* Campo conforme o tipo */}
              {step.type === "text" && (
                <Input
                  autoFocus
                  type={step.inputType || "text"}
                  placeholder={step.placeholder}
                  value={form[step.key!]}
                  onChange={(e) => setField(step.key!, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goNext() }}
                  className="h-12 text-base"
                />
              )}

              {step.type === "logo" && (
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[--border] bg-[--muted] transition-colors hover:border-[--primary]"
                  >
                    {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[--muted-foreground]" />
                      : logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      : <Upload className="h-6 w-6 text-[--muted-foreground]" />}
                  </div>
                  <div>
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                      {logoUrl ? "Trocar logo" : "Enviar logo"}
                    </Button>
                    <p className="mt-2 text-xs text-[--muted-foreground]">Opcional</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  </div>
                </div>
              )}

              {step.type === "payments" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[--border] p-3.5 transition-colors hover:bg-[--muted] has-[:checked]:border-[--primary] has-[:checked]:bg-[--primary]/5">
                      <input type="checkbox" checked={methods.includes(m)} onChange={() => toggleMethod(m)} className="h-4 w-4 accent-[--primary]" />
                      <span className="text-sm text-[--foreground]">{m}</span>
                    </label>
                  ))}
                </div>
              )}

              {step.type === "finish" && (
                <div className="flex items-center gap-3 rounded-xl border border-[--primary]/20 bg-[--primary]/5 p-4">
                  <CreditCard className="h-5 w-5 shrink-0 text-[--primary]" />
                  <p className="text-sm text-[--foreground]">
                    Teste grátis de <strong>14 dias</strong> do plano Pro. Sem cartão agora — você configura a assinatura quando quiser.
                  </p>
                </div>
              )}

              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Rodapé: navegação */}
      <div className="shrink-0 border-t border-[--border] px-5 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>

          {step.type === "finish" ? (
            <Button onClick={handleFinish} loading={saving} disabled={saving || uploadingLogo}>
              <Check className="h-4 w-4" /> Concluir e acessar
            </Button>
          ) : (
            <Button onClick={goNext} disabled={uploadingLogo}>
              {step.type === "intro" ? "Começar" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
