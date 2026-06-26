"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Wrench, Loader2, AlertCircle, CheckCircle2, XCircle, FileText, Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchPublicQuote, respondPublicQuote, type PublicQuote } from "@/lib/firebase/public-quote"
import { callableErrorMessage } from "@/lib/firebase/password-reset"
import { logger } from "@/lib/logger"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

function QuoteView() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    if (!token) { setError("Link inválido."); setLoading(false); return }
    fetchPublicQuote(token)
      .then((q) => { setQuote(q); setError(null) })
      .catch((err) => { logger.error("orcamento", "falha ao carregar orçamento público", err); setError(callableErrorMessage(err)) })
      .finally(() => setLoading(false))
  }, [token])

  async function respond(decision: "approved" | "rejected") {
    setResponding(true)
    try {
      await respondPublicQuote(token, decision)
      setQuote((q) => q ? { ...q, status: decision } : q)
    } catch (err) {
      setError(callableErrorMessage(err))
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[--primary]" /></div>
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--destructive]/10"><AlertCircle className="h-7 w-7 text-[--destructive]" /></div>
          <p className="text-sm text-[--muted-foreground]">{error || "Orçamento não encontrado."}</p>
        </div>
      </div>
    )
  }

  const responded = quote.status === "approved" || quote.status === "rejected"

  return (
    <div className="min-h-screen bg-[--muted] py-8 px-4">
      <div className="mx-auto max-w-md">
        {/* Loja */}
        <div className="mb-5 flex flex-col items-center text-center">
          {quote.store.logoUrl ? (
            <img src={quote.store.logoUrl} alt={quote.store.name} className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[--primary] to-[#7c3aed]"><Wrench className="h-7 w-7 text-white" /></div>
          )}
          <h1 className="mt-3 text-lg font-bold text-[--foreground]">{quote.store.name}</h1>
          <p className="text-xs text-[--muted-foreground]">Orçamento de serviço</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--card] shadow-sm">
          <div className="border-b border-[--border] p-5">
            {quote.customerName && <p className="text-sm text-[--muted-foreground]">Para <span className="font-medium text-[--foreground]">{quote.customerName}</span></p>}
            {quote.deviceLabel && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[--foreground]"><Smartphone className="h-3.5 w-3.5 text-[--muted-foreground]" />{quote.deviceLabel}</p>
            )}
          </div>

          {/* Itens */}
          <div className="divide-y divide-[--border]">
            {quote.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[--foreground]">{it.description}</p>
                  <p className="text-xs text-[--muted-foreground]">{it.type === "labor" ? "Serviço" : "Peça"} · {it.quantity}x</p>
                </div>
                <span className="text-sm font-medium text-[--foreground]">{brl(it.unitPrice * it.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-1 border-t border-[--border] bg-[--muted]/30 p-5">
            <div className="flex justify-between text-xs text-[--muted-foreground]"><span>Peças</span><span>{brl(quote.totalParts)}</span></div>
            <div className="flex justify-between text-xs text-[--muted-foreground]"><span>Mão de obra</span><span>{brl(quote.totalLabor)}</span></div>
            <div className="flex justify-between border-t border-[--border] pt-2 text-lg font-bold text-[--foreground]"><span>Total</span><span className="text-[--primary]">{brl(quote.total)}</span></div>
          </div>
        </div>

        {/* Ação */}
        <div className="mt-5">
          {responded ? (
            <div className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium ${quote.status === "approved" ? "border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]" : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"}`}>
              {quote.status === "approved" ? <><CheckCircle2 className="h-5 w-5" />Orçamento aprovado! A loja foi avisada.</> : <><XCircle className="h-5 w-5" />Orçamento recusado.</>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]" onClick={() => respond("rejected")} disabled={responding}>
                <XCircle className="h-4 w-4" />Recusar
              </Button>
              <Button className="bg-[#10b981] hover:bg-[#059669]" loading={responding} disabled={responding} onClick={() => respond("approved")}>
                <CheckCircle2 className="h-4 w-4" />Aprovar
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-[--muted-foreground]">
          <FileText className="h-3 w-3" />Orçamento gerado pelo SmartLoop
        </p>
      </div>
    </div>
  )
}

export default function OrcamentoPublicoPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[--primary]" /></div>}>
      <QuoteView />
    </Suspense>
  )
}
