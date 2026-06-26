import { getFunctions, httpsCallable } from "firebase/functions"
import app from "./config"
import { logger } from "@/lib/logger"

const functions = getFunctions(app, "southamerica-east1")

export interface PublicQuoteItem {
  description: string
  quantity: number
  unitPrice: number
  type: "part" | "labor" | "other"
}

export interface PublicQuote {
  customerName: string
  deviceLabel: string
  items: PublicQuoteItem[]
  totalParts: number
  totalLabor: number
  total: number
  status: "pending" | "approved" | "rejected" | "expired"
  store: { name: string; logoUrl: string; whatsapp: string }
}

export async function fetchPublicQuote(token: string): Promise<PublicQuote> {
  logger.info("orcamento", "buscando orçamento público", { hasToken: !!token })
  const fn = httpsCallable(functions, "getPublicQuote")
  const res = await fn({ token })
  return res.data as PublicQuote
}

export async function respondPublicQuote(token: string, decision: "approved" | "rejected") {
  logger.info("orcamento", "respondendo orçamento", { decision })
  const fn = httpsCallable(functions, "respondPublicQuote")
  await fn({ token, decision })
  logger.success("orcamento", "orçamento respondido", { decision })
}
