import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export interface SaleItem {
  productId?: string
  name: string
  price: number
  quantity: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: string
  customerId?: string
  customerName?: string
  createdAt?: Timestamp | null
}

export type SaleInput = Omit<Sale, "id" | "createdAt">

function salesCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "sales")
}

export async function createSale(tenantId: string, input: SaleInput) {
  logger.info("pdv", "registrando venda", { itens: input.items.length, total: input.total, pagamento: input.paymentMethod })
  try {
    const refDoc = await addDoc(salesCol(tenantId), { ...input, createdAt: serverTimestamp() })
    logger.success("pdv", "venda registrada", { id: refDoc.id })
    return refDoc.id
  } catch (err) {
    logger.error("pdv", "falha ao registrar venda", err); throw err
  }
}

export function watchSales(
  tenantId: string,
  onData: (sales: Sale[]) => void,
  onError: (err: Error) => void
) {
  const q = query(salesCol(tenantId), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sale, "id">) }))),
    (err) => { logger.error("pdv", "falha no watch de vendas", err); onError(err) }
  )
}
