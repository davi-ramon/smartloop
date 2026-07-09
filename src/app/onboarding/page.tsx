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

// Limites do upload de logo (validacao client-side).
// Storage Rules aceitam ate 5MB, mas a UX bloqueia antes pra feedback mais rapido.
const LOGO_MIN_PX = 120
const LOGO_MAX_PX = 1000
const LOGO_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const LOGO_ACCEPT = "image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon"

/* ── Validadores ── */
const onlyDigits = (s: string) => s.replace(/\D/g, "")
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
const isValidPhone = (s: string) => {
  const d = onlyDigits(s)
  return d.length === 10 || d.length === 11
}
function isValidCNPJ(value: string): boolean {
  const c = onlyDigits(value)
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false
  const calc = (len: number) => {
    let sum = 0, pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(c[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(c[12]) && calc(13) === parseInt(c[13])
}
function readImageDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagem inválida")) }
    img.src = url
  })
}

type FieldKey = "name" | "fantasyName" | "cnpj" | "whatsapp" | "city" | "email"
type StepType = "intro" | "text" | "logo" | "payments" | "finish"

interface Step {
  type: StepType
  key?: FieldKey
  question: string
  hint?: string
  placeholder?: string
  inputType?: string
}

const STEPS: Step[] = [
  { type: "intro", question: "Bem-vindo ao SmartLoop", hint: "Vamos configurar sua assistência em menos de 1 minuto. Esses dados aparecem nas OS, orçamentos e documentos." },
  { type: "text", key: "name", question: "Qual o nome da sua empresa?", hint: "Razão social ou nome principal. Obrigatório.", placeholder: "Assistência Connect" },
  { type: "text", key: "fantasyName", question: "Tem um nome fantasia?", hint: "Como os clientes conhecem a loja (opcional).", placeholder: "Connect Cell" },
  { type: "text", key: "cnpj", question: "Qual o CNPJ?", hint: "Obrigatório — aparece nos documentos fiscais.", placeholder: "00.000.000/0001-00" },
  { type: "text", key: "whatsapp", question: "Seu WhatsApp principal", hint: "Obrigatório — DDD + número.", placeholder: "(00) 00000-0000" },
  { type: "text", key: "city", question: "Em qual cidade você atende?", hint: "Obrigatório — cidade e estado.", placeholder: "Araguaína, TO" },
  { type: "text", key: "email", question: "E-mail da loja", hint: "Obrigatório. Já preenchemos com o e-mail da sua conta.", placeholder: "contato@loja.com.br", inputType: "email" },
  { type: "logo", question: "Adicione a logo da sua loja", hint: `Opcional — pode pular e enviar depois. PNG, JPG ou ICO, quadrada de preferência. Tamanho ideal: 250x250 px ou 192x192 px. Mínimo ${LOGO_MIN_PX}px, máximo ${LOGO_MAX_PX}px, até 2 MB.` },
  { type: "payments", question: "Quais formas de pagamento você aceita?", hint: "Selecione ao menos uma." },
  { type: "finish", question: "Tudo pronto!", hint: "Você está no teste grátis de 14 dias do plano Pro." },
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

  /** Retorna a mensagem de erro da etapa, ou null se válida. */
  function stepError(idx: number): string | null {
    const s = STEPS[idx]
    if (s.type === "text") {
      const v = form[s.key!].trim()
      switch (s.key) {
        case "name": return !v ? "Informe o nome da empresa." : v.length < 2 ? "Nome muito curto." : null
        case "fantasyName": return null
        case "cnpj": return !v ? "O CNPJ é obrigatório." : !isValidCNPJ(v) ? "CNPJ inválido. Confira os números." : null
        case "whatsapp": return !v ? "O WhatsApp é obrigatório." : !isValidPhone(v) ? "Telefone inválido. Use DDD + número." : null
        case "city": return !v ? "Informe a cidade e o estado." : null
        case "email": return !v ? "O e-mail da loja é obrigatório." : !isValidEmail(v) ? "E-mail inválido." : null
      }
    }
    if (s.type === "logo") return null // logo é opcional — usuário pode pular
    if (s.type === "payments") return methods.length === 0 ? "Selecione ao menos uma forma de pagamento." : null
    return null
  }

  function goNext() {
    const err = stepError(stepIndex)
    if (err) {
      logger.warn("onboarding", "validação bloqueou avanço", { etapa: stepIndex, motivo: err })
      setError(err)
      return
    }
    setError(null)
    if (stepIndex < STEPS.length - 1) { setDir(1); setStepIndex((i) => i + 1) }
  }
  function goBack() {
    setError(null)
    if (stepIndex > 0) { setDir(-1); setStepIndex((i) => i - 1) }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.tenantId) return
    setError(null)
    // Validação de formato. Aceitamos PNG, JPG/JPEG e ICO (x-icon + vnd.microsoft.icon).
    const allowed = /^image\/(png|jpe?g|x-icon|vnd\.microsoft\.icon)$/
    if (!allowed.test(file.type)) {
      setError("Formato inválido. Use PNG, JPG ou ICO."); return
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("A logo deve ter até 2 MB."); return
    }
    let dims: { w: number; h: number }
    try {
      dims = await readImageDims(file)
    } catch {
      setError("Não foi possível ler a imagem. Tente outro arquivo."); return
    }
    if (dims.w < LOGO_MIN_PX || dims.h < LOGO_MIN_PX) {
      setError(`A logo deve ter no mínimo ${LOGO_MIN_PX}x${LOGO_MIN_PX} pixels.`); return
    }
    if (dims.w > LOGO_MAX_PX || dims.h > LOGO_MAX_PX) {
      setError(`A logo deve ter no máximo ${LOGO_MAX_PX}x${LOGO_MAX_PX} pixels.`); return
    }
    setUploadingLogo(true)
    try {
      setLogoUrl(await uploadLogo(profile.tenantId, file))
      logger.success("onboarding", "logo validada e enviada", { dims, type: file.type, bytes: file.size })
    } catch {
      setError("Não foi possível enviar a logo. Tente novamente.")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleFinish() {
    if (!profile?.tenantId) return
    // Revalida tudo; se algo falhar, leva para a etapa do erro.
    for (let i = 0; i < STEPS.length; i++) {
      const err = stepError(i)
      if (err) {
        logger.warn("onboarding", "conclusão bloqueada por validação", { etapa: i, motivo: err })
        setDir(i < stepIndex ? -1 : 1)
        setStepIndex(i)
        setError(err)
        return
      }
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
        logoUrl,
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
              <div className="mb-6">
                {step.type === "intro" && (
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-bold leading-tight text-[--foreground] sm:text-3xl">{step.question}</h1>
                {step.hint && <p className="mt-2 text-sm text-[--muted-foreground]">{step.hint}</p>}
              </div>

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
                <div className="space-y-4">
                  {/* Info-box: etapa opcional + recomendações */}
                  <div className="rounded-xl border border-[--border] bg-[--muted]/40 p-3 text-xs text-[--muted-foreground]">
                    <p className="font-medium text-[--foreground]">Etapa opcional</p>
                    <p className="mt-1">
                      Você pode <strong>pular por enquanto</strong> e enviar a logo depois em
                      <span className="font-medium"> Configurações → Loja</span>.
                      Tamanho ideal: <strong>250x250 px</strong> ou <strong>192x192 px</strong>.
                      Dimensões entre {LOGO_MIN_PX} e {LOGO_MAX_PX} px. Formatos: PNG, JPG ou ICO. Até 2 MB.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[--border] bg-[--muted] transition-colors hover:border-[--primary]"
                    >
                      {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[--muted-foreground]" />
                        : logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        : <Upload className="h-6 w-6 text-[--muted-foreground]" />}
                    </div>
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        loading={uploadingLogo}
                      >
                        {logoUrl ? "Trocar logo" : "Enviar logo"}
                      </Button>
                      {logoUrl ? (
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[#10b981]">
                          <Check className="h-3.5 w-3.5" /> Logo enviada
                        </p>
                      ) : (
                        <p className="mt-2 text-[11px] text-[--muted-foreground]">
                          Sem logo? Sem problema — pule e envie depois.
                        </p>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept={LOGO_ACCEPT}
                        className="hidden"
                        onChange={handleLogo}
                      />
                    </div>
                  </div>

                  {/* Botão "Pular por enquanto" — sempre visível, sem desabilitar avanço */}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={uploadingLogo || saving}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[--border] py-2.5 text-xs font-medium text-[--muted-foreground] transition-colors hover:border-[--primary] hover:text-[--primary] disabled:opacity-50"
                  >
                    Pular por enquanto →
                  </button>
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
                    Teste grátis de <strong>14 dias</strong> do plano Pro. O cartão é cadastrado para ativar o teste e só é cobrado após os 14 dias.
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
