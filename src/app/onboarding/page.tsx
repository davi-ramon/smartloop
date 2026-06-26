"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Wrench, Building2, Upload, Loader2, AlertCircle, Check, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/firebase/auth-context"
import { updateTenant, uploadLogo } from "@/lib/data/tenant"
import { logger } from "@/lib/logger"

const PAYMENT_METHODS = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX"]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, tenant, loading } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [fantasyName, setFantasyName] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [methods, setMethods] = useState<string[]>(["Dinheiro", "PIX", "Cartão de Crédito"])
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guard: precisa estar logado; se onboarding já feito, vai pro dashboard.
  useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (tenant?.onboardingDone) router.replace("/home")
  }, [loading, user, tenant?.onboardingDone, router])

  // Pré-preenche com o que já existe.
  useEffect(() => {
    if (!tenant) return
    setName((v) => v || tenant.name || "")
    setFantasyName((v) => v || tenant.fantasyName || "")
    setCnpj((v) => v || tenant.cnpj || "")
    setWhatsapp((v) => v || tenant.whatsapp || "")
    setEmail((v) => v || tenant.email || user?.email || "")
    setCity((v) => v || tenant.city || "")
    if (tenant.logoUrl) setLogoUrl((v) => v || tenant.logoUrl!)
  }, [tenant, user?.email])

  function toggleMethod(m: string) {
    setMethods((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m])
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.tenantId) return
    setUploadingLogo(true)
    setError(null)
    try {
      const url = await uploadLogo(profile.tenantId, file)
      setLogoUrl(url)
    } catch {
      setError("Não foi possível enviar a logo. Você pode adicionar depois nas Configurações.")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleFinish() {
    if (!profile?.tenantId) return
    if (!name.trim()) { setError("Informe ao menos a razão social / nome da empresa."); return }
    setSaving(true)
    setError(null)
    logger.info("onboarding", "concluindo onboarding", { tenantId: profile.tenantId })
    try {
      await updateTenant(profile.tenantId, {
        name, fantasyName, cnpj, whatsapp,
        email: email || user?.email || "",
        city, logoUrl: logoUrl || "",
        paymentMethods: methods,
        onboardingDone: true,
      })
      logger.success("onboarding", "onboarding concluído", { tenantId: profile.tenantId })
      router.replace("/home")
    } catch {
      setError("Não foi possível salvar. Tente novamente.")
      setSaving(false)
    }
  }

  if (loading || !user || tenant?.onboardingDone) {
    return (
      <div className="flex h-screen items-center justify-center bg-[--muted]">
        <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--muted] py-10 px-4">
      <div className="mx-auto max-w-xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-[--foreground]">Bem-vindo ao SmartLoop</h1>
          <p className="mt-1 text-sm text-[--muted-foreground]">
            Vamos configurar sua assistência em 1 minuto. Esses dados aparecem nas OS, orçamentos e documentos.
          </p>
        </div>

        <div className="rounded-2xl border border-[--border] bg-[--card] p-6 shadow-sm">
          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {/* Logo */}
          <div className="mb-5 flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[--border] bg-[--muted] transition-colors hover:border-[--primary]"
            >
              {uploadingLogo ? (
                <Loader2 className="h-5 w-5 animate-spin text-[--muted-foreground]" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-[--muted-foreground]" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[--foreground]">Logo da loja</p>
              <p className="text-xs text-[--muted-foreground]">PNG ou JPG, até 5MB (opcional)</p>
              <Button type="button" variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => fileRef.current?.click()}>
                {logoUrl ? "Trocar logo" : "Enviar logo"}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Razão social / Nome da empresa *</Label>
              <Input id="name" placeholder="48.257.434 Pedro Victor..." value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fantasy">Nome fantasia</Label>
              <Input id="fantasy" placeholder="Assistência Connect" value={fantasyName} onChange={(e) => setFantasyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0001-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whats">WhatsApp principal</Label>
              <Input id="whats" placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade / UF</Label>
              <Input id="city" placeholder="Araguaína, TO" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">E-mail da loja</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Formas de pagamento */}
          <div className="mt-5">
            <Label className="mb-2 block">Formas de pagamento aceitas</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[--border] p-2.5 transition-colors hover:bg-[--muted] has-[:checked]:border-[--primary] has-[:checked]:bg-[--primary]/5">
                  <input type="checkbox" checked={methods.includes(m)} onChange={() => toggleMethod(m)} className="h-4 w-4 accent-[--primary]" />
                  <span className="text-sm text-[--foreground]">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assinatura (apenas exibida) */}
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-[--primary]/20 bg-[--primary]/5 p-3">
            <Check className="h-4 w-4 shrink-0 text-[--primary]" />
            <p className="text-xs text-[--foreground]">
              Você está no <strong>teste grátis de 14 dias</strong> do plano Pro. Sem cartão agora — você configura a assinatura depois.
            </p>
          </div>

          <Button className="mt-6 w-full" onClick={handleFinish} loading={saving} disabled={saving || uploadingLogo}>
            Concluir e acessar o SmartLoop
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
