"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Building2, Users, ClipboardCheck, CreditCard, Package,
  Shield, Upload, Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/firebase/auth-context"
import { updateTenant, uploadLogo } from "@/lib/data/tenant"

const TABS = [
  { id: "empresa",     label: "Empresa",          icon: Building2     },
  { id: "usuarios",    label: "Usuários",          icon: Users         },
  { id: "os",          label: "Ordens de Serviço", icon: ClipboardCheck },
  { id: "pagamentos",  label: "Pagamentos",        icon: CreditCard    },
  { id: "catalogo",    label: "Catálogo",          icon: Package       },
  { id: "assinatura",  label: "Assinatura",        icon: Shield        },
]

const PAYMENT_METHODS = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX", "Transferência", "Cheque"]

function TabEmpresa() {
  const { profile, tenant } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [fantasyName, setFantasyName] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    setName(tenant.name ?? "")
    setFantasyName(tenant.fantasyName ?? "")
    setCnpj(tenant.cnpj ?? "")
    setWhatsapp(tenant.whatsapp ?? "")
    setEmail(tenant.email ?? "")
    setCity(tenant.city ?? "")
    setLogoUrl(tenant.logoUrl ?? "")
  }, [tenant])

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.tenantId) return
    setUploadingLogo(true); setError(null)
    try { setLogoUrl(await uploadLogo(profile.tenantId, file)) }
    catch { setError("Não foi possível enviar a logo.") }
    finally { setUploadingLogo(false) }
  }

  async function handleSave() {
    if (!profile?.tenantId) return
    setSaving(true); setError(null); setSaved(false)
    try {
      await updateTenant(profile.tenantId, { name, fantasyName, cnpj, whatsapp, email, city, logoUrl })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Não foi possível salvar as alterações.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-[--border] shadow-none">
        <CardHeader><CardTitle className="text-sm">Dados da empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex items-center gap-4">
            <div onClick={() => fileRef.current?.click()} className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[--border] bg-[--muted] cursor-pointer hover:border-[--primary] transition-colors">
              {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-[--muted-foreground]" /> : logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Upload className="h-5 w-5 text-[--muted-foreground]" />}
            </div>
            <div>
              <p className="text-sm font-medium text-[--foreground]">Logo da loja</p>
              <p className="text-xs text-[--muted-foreground]">PNG ou JPG, até 5MB</p>
              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => fileRef.current?.click()}>{logoUrl ? "Trocar logo" : "Fazer upload"}</Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className="text-xs">Razão social</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Assistência Connect" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Nome fantasia</Label><Input value={fantasyName} onChange={(e) => setFantasyName(e.target.value)} placeholder="Connect Cell" /></div>
            <div className="space-y-1.5"><Label className="text-xs">CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="48.257.434/0001-06" /></div>
            <div className="space-y-1.5"><Label className="text-xs">WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(63) 99999-9999" /></div>
            <div className="space-y-1.5"><Label className="text-xs">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@loja.com.br" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Cidade / UF</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Araguaína, TO" /></div>
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="flex items-center gap-1.5 text-xs font-medium text-[#10b981]"><CheckCircle2 className="h-3.5 w-3.5" />Salvo!</span>}
            <Button onClick={handleSave} loading={saving} disabled={saving}>Salvar alterações</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TabUsuarios() {
  const users = [
    { name: "Pedro Victor",  email: "pedro@assistencia.com", role: "Proprietário", active: true  },
    { name: "Carlos Eduardo", email: "carlos@assistencia.com", role: "Técnico Sênior", active: true  },
    { name: "André Luís",    email: "andre@assistencia.com",  role: "Técnico",       active: true  },
    { name: "Fernanda Matos", email: "fernanda@assistencia.com", role: "Atendente",   active: true  },
  ]
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Convidar usuário</Button></div>
      <Card className="border-[--border] shadow-none">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[--muted]/50 border-b border-[--border]">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Usuário</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide hidden sm:table-cell">Papel</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[--muted-foreground] uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-[--muted]/20">
                  <td className="py-3 px-4">
                    <p className="font-medium text-[--foreground]">{u.name}</p>
                    <p className="text-xs text-[--muted-foreground]">{u.email}</p>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="rounded-md bg-[--muted] px-2 py-0.5 text-xs">{u.role}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10b981]">Ativo</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-[--muted-foreground] hover:text-[#ef4444] transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function TabPagamentos() {
  return (
    <div className="max-w-2xl">
      <Card className="border-[--border] shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Formas de pagamento</CardTitle>
          <CardDescription className="text-xs">Selecione os métodos aceitos na sua loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[--border] p-3 hover:bg-[--muted] transition-colors has-[:checked]:border-[--primary] has-[:checked]:bg-[--primary]/5">
                <input type="checkbox" defaultChecked={["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX"].includes(method)} className="h-4 w-4 accent-[--primary]" />
                <span className="text-sm text-[--foreground]">{method}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end"><Button>Salvar</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}

function TabAssinatura() {
  return (
    <div className="max-w-2xl">
      <Card className="border-[--border] shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[--foreground]">Plano Pro</span>
                <span className="rounded-full bg-[--primary]/10 px-2.5 py-0.5 text-xs font-semibold text-[--primary]">Ativo</span>
              </div>
              <p className="text-sm text-[--muted-foreground] mt-1">Próxima cobrança: 26/06/2026</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[--foreground]">R$ 89,90</p>
              <p className="text-xs text-[--muted-foreground]">por mês</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "OS este mês", current: 18, limit: "Ilimitadas", pct: 0 },
              { label: "Usuários", current: 4, limit: "5 usuários", pct: 80 },
              { label: "Armazenamento", current: "12MB", limit: "5GB", pct: 2 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[--muted-foreground]">{item.label}</span>
                  <span className="font-medium text-[--foreground]">{item.current} / {item.limit}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[--muted] overflow-hidden">
                  <div className="h-full rounded-full bg-[--primary]" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1">Mudar plano</Button>
            <Button className="flex-1">Gerenciar cobrança</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("empresa")

  const renderTab = () => {
    switch (activeTab) {
      case "empresa":    return <TabEmpresa />
      case "usuarios":   return <TabUsuarios />
      case "pagamentos": return <TabPagamentos />
      case "assinatura": return <TabAssinatura />
      default:
        return (
          <div className="flex items-center justify-center py-16 text-center">
            <div>
              <p className="text-[--muted-foreground] text-sm">Em construção — disponível na Fase 2</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações" />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de abas */}
        <div className="w-48 shrink-0 border-r border-[--border] py-4 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors",
                activeTab === tab.id
                  ? "bg-[--primary]/10 text-[--primary]"
                  : "text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab()}
        </div>
      </div>
    </div>
  )
}
