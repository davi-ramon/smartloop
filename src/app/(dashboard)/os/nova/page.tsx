"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  User, Smartphone, Scan, FileText,
  ChevronRight, ChevronLeft, Check,
  Search, Camera, QrCode,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

const STEPS = [
  { id: 1, label: "Cliente",  icon: User       },
  { id: 2, label: "Aparelho", icon: Smartphone },
  { id: 3, label: "IMEI",     icon: Scan       },
  { id: 4, label: "Defeito",  icon: FileText   },
]

const MOCK_CUSTOMERS = [
  { id: "1", name: "João Silva",   phone: "(63) 98765-4321" },
  { id: "2", name: "Maria Santos", phone: "(63) 97654-3210" },
  { id: "3", name: "Pedro Alves",  phone: "(63) 96543-2109" },
]

export default function NovaOSPage() {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<typeof MOCK_CUSTOMERS[0] | null>(null)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [imei, setImei] = useState("")
  const [problem, setProblem] = useState("")
  const [condition, setCondition] = useState("")

  const filteredCustomers = MOCK_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const canAdvance = () => {
    if (step === 1) return !!selectedCustomer
    if (step === 2) return !!(brand && model)
    if (step === 3) return true // IMEI is optional in some flows
    if (step === 4) return !!problem
    return false
  }

  function goNext() {
    if (!canAdvance()) {
      logger.warn("os/nova", `avanço bloqueado na etapa ${step} — requisitos não atendidos`, {
        step,
        hasCustomer: !!selectedCustomer,
        brand,
        model,
      })
      return
    }
    const next = Math.min(4, step + 1)
    logger.info("os/nova", `avançando para etapa ${next}`, { de: step, para: next })
    setStep(next)
  }

  function goBack() {
    const prev = Math.max(1, step - 1)
    logger.info("os/nova", `voltando para etapa ${prev}`, { de: step, para: prev })
    setStep(prev)
  }

  function handleCreate() {
    if (!canAdvance()) {
      logger.warn("os/nova", "tentativa de criar OS sem campos obrigatórios", { problem })
      return
    }
    // TODO(Semana 2): persistir no Supabase/Firestore. Hoje é modo demonstração.
    logger.success("os/nova", "OS criada (modo demo)", {
      cliente: selectedCustomer?.name,
      aparelho: `${brand} ${model}`,
      imei,
      problem,
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Nova Ordem de Serviço" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                    step > s.id
                      ? "border-[--primary] bg-[--primary] text-white"
                      : step === s.id
                        ? "border-[--primary] bg-white text-[--primary]"
                        : "border-[--border] bg-[--muted] text-[--muted-foreground]"
                  )}>
                    {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    step >= s.id ? "text-[--primary]" : "text-[--muted-foreground]"
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "mb-4 h-0.5 w-16 mx-1 transition-colors",
                    step > s.id ? "bg-[--primary]" : "bg-[--border]"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="mx-auto max-w-xl">
          {/* Step 1 — Cliente */}
          {step === 1 && (
            <Card className="border-[--border] shadow-none">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-[--foreground]">Quem é o cliente?</h2>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    className="pl-8 bg-[--muted] border-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                        selectedCustomer?.id === c.id
                          ? "border-[--primary] bg-[--primary]/5"
                          : "border-[--border] hover:border-[--primary]/40 hover:bg-[--muted]"
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[--primary] to-[#1d4ed8] text-xs font-bold text-white">
                        {c.name.split(" ").slice(0,2).map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[--foreground]">{c.name}</p>
                        <p className="text-xs text-[--muted-foreground]">{c.phone}</p>
                      </div>
                      {selectedCustomer?.id === c.id && (
                        <Check className="ml-auto h-4 w-4 text-[--primary]" />
                      )}
                    </button>
                  ))}
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <User className="h-4 w-4" />
                  Cadastrar novo cliente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Aparelho */}
          {step === 2 && (
            <Card className="border-[--border] shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[--primary] to-[#1d4ed8] text-xs font-bold text-white">
                    {selectedCustomer?.name.split(" ").slice(0,2).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[--foreground]">{selectedCustomer?.name}</p>
                    <p className="text-xs text-[--muted-foreground]">{selectedCustomer?.phone}</p>
                  </div>
                </div>

                <div className="h-px bg-[--border]" />
                <h2 className="font-semibold text-[--foreground]">Qual o aparelho?</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Marca</Label>
                    <Input placeholder="Apple, Samsung..." value={brand} onChange={e => setBrand(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Modelo</Label>
                    <Input placeholder="iPhone 14 Pro..." value={model} onChange={e => setModel(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cor</Label>
                    <Input placeholder="Preto, Branco..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Número de série (opcional)</Label>
                    <Input placeholder="SN123456789" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 — IMEI */}
          {step === 3 && (
            <Card className="border-[--border] shadow-none">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-[--foreground]">Leitura de IMEI</h2>
                <p className="text-sm text-[--muted-foreground]">
                  Use a câmera para ler o IMEI automaticamente ou digite manualmente.
                </p>

                <button className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[--primary]/40 bg-[--primary]/5 p-8 hover:border-[--primary] hover:bg-[--primary]/10 transition-all">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--primary]/15">
                    <Camera className="h-7 w-7 text-[--primary]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[--primary]">Abrir câmera</p>
                    <p className="text-xs text-[--muted-foreground] mt-0.5">Aponte para o IMEI impresso no aparelho</p>
                  </div>
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[--border]" />
                  <span className="text-xs text-[--muted-foreground]">ou</span>
                  <div className="h-px flex-1 bg-[--border]" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">IMEI 1</Label>
                  <Input
                    placeholder="XX XXXXXX XXXXXX X"
                    value={imei}
                    onChange={e => setImei(e.target.value)}
                    maxLength={19}
                  />
                  <p className="text-xs text-[--muted-foreground]">
                    Para encontrar: discar *#06# ou verificar nas configurações
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">IMEI 2 (dual chip, opcional)</Label>
                  <Input placeholder="XX XXXXXX XXXXXX X" maxLength={19} />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-[--muted] p-3">
                  <QrCode className="h-4 w-4 text-[--muted-foreground] shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[--foreground]">Solicitar fotos do cliente</p>
                    <p className="text-xs text-[--muted-foreground]">Gera um QR Code para o cliente fotografar o aparelho</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Gerar QR</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4 — Defeito */}
          {step === 4 && (
            <Card className="border-[--border] shadow-none">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-[--foreground]">Descreva o defeito</h2>

                <div className="space-y-1.5">
                  <Label className="text-xs">Defeito relatado pelo cliente *</Label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm placeholder:text-[--muted-foreground] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] resize-none"
                    placeholder="Descreva o problema reportado pelo cliente..."
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Condição na entrada</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm placeholder:text-[--muted-foreground] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring] resize-none"
                    placeholder="Estado físico do aparelho (arranhões, trincas, manchas...)"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Técnico responsável</Label>
                  <select className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
                    <option value="">Selecionar técnico...</option>
                    <option value="carlos">Carlos Eduardo</option>
                    <option value="andre">André Luís</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Prazo estimado (opcional)</Label>
                  <Input type="date" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 1}
              aria-label="Voltar para a etapa anterior"
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              Voltar
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                aria-label="Avançar para a próxima etapa"
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canAdvance()}
                aria-label="Criar ordem de serviço"
                className="bg-[#10b981] hover:bg-[#059669]"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Criar OS
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
