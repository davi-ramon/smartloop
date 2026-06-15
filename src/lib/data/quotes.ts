import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export type QuoteStatus = "pending" | "approved" | "rejected" | "expired"

export interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  type: "part" | "labor" | "other"
  partId?: string
}

export interface Quote {
  id: string
  osId?: string
  customerId?: string
  customerName?: string
  deviceLabel?: string
  imei?: string
  items: QuoteItem[]
  totalParts: number
  totalLabor: number
  total: number
  status: QuoteStatus
  approvalToken: string
  createdAt?: Timestamp | null
}

export type QuoteInput = Omit<Quote, "id" | "createdAt">

function quotesCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "quotes")
}

/** Token não-adivinhável para o link público de aprovação (usado na próxima fase). */
export function generateApprovalToken(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "")
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

export function summarizeItems(items: QuoteItem[]) {
  let totalParts = 0
  let totalLabor = 0
  for (const it of items) {
    const sub = it.unitPrice * it.quantity
    if (it.type === "labor") totalLabor += sub
    else totalParts += sub
  }
  return { totalParts, totalLabor, total: totalParts + totalLabor }
}

export function watchQuotes(
  tenantId: string,
  onData: (quotes: Quote[]) => void,
  onError: (err: Error) => void
) {
  const q = query(quotesCol(tenantId), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quote, "id">) }))
      logger.info("orcamento", "snapshot de orçamentos recebido", { total: list.length })
      onData(list)
    },
    (err) => {
      logger.error("orcamento", "falha no watch de orçamentos", err)
      onError(err)
    }
  )
}

export async function createQuote(tenantId: string, input: QuoteInput) {
  logger.info("orcamento", "criando orçamento", { itens: input.items.length, total: input.total })
  try {
    const ref = await addDoc(quotesCol(tenantId), { ...input, createdAt: serverTimestamp() })
    logger.success("orcamento", "orçamento criado", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("orcamento", "falha ao criar orçamento", err)
    throw err
  }
}

export async function updateQuoteStatus(tenantId: string, id: string, status: QuoteStatus) {
  logger.info("orcamento", "alterando status do orçamento", { id, status })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "quotes", id), { status })
    logger.success("orcamento", "status do orçamento alterado", { id, status })
  } catch (err) {
    logger.error("orcamento", "falha ao alterar status do orçamento", err)
    throw err
  }
}

export async function deleteQuote(tenantId: string, id: string) {
  logger.info("orcamento", "removendo orçamento", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "quotes", id))
    logger.success("orcamento", "orçamento removido", { id })
  } catch (err) {
    logger.error("orcamento", "falha ao remover orçamento", err)
    throw err
  }
}
