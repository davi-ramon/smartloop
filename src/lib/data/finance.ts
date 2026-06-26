import {
  collection, doc, addDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export type TxType = "income" | "expense"

export const INCOME_CATEGORIES = ["Serviço / OS", "Venda", "Outros"]
export const EXPENSE_CATEGORIES = ["Peças", "Fornecedores", "Aluguel", "Salários", "Marketing", "Outros"]

export interface Transaction {
  id: string
  type: TxType
  description: string
  amount: number
  category?: string
  createdAt?: Timestamp | null
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt">

function txCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "transactions")
}

export function watchTransactions(
  tenantId: string,
  onData: (txs: Transaction[]) => void,
  onError: (err: Error) => void
) {
  const q = query(txCol(tenantId), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }))),
    (err) => { logger.error("financeiro", "falha no watch de lançamentos", err); onError(err) }
  )
}

export async function createTransaction(tenantId: string, input: TransactionInput) {
  logger.info("financeiro", "criando lançamento", { type: input.type, amount: input.amount })
  try {
    const refDoc = await addDoc(txCol(tenantId), { ...input, createdAt: serverTimestamp() })
    logger.success("financeiro", "lançamento criado", { id: refDoc.id })
    return refDoc.id
  } catch (err) {
    logger.error("financeiro", "falha ao criar lançamento", err); throw err
  }
}

export async function deleteTransaction(tenantId: string, id: string) {
  logger.info("financeiro", "removendo lançamento", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "transactions", id))
    logger.success("financeiro", "lançamento removido", { id })
  } catch (err) {
    logger.error("financeiro", "falha ao remover lançamento", err); throw err
  }
}

/** Verdadeiro se o Timestamp está no mês/ano atuais. */
export function isThisMonth(ts?: Timestamp | null): boolean {
  if (!ts?.toDate) return false
  const d = ts.toDate()
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}
