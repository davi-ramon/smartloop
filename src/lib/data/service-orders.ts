import {
  collection,
  doc,
  runTransaction,
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
import type { ServiceOrderStatus } from "@/types/database"

export interface ServiceOrder {
  id: string
  number: number
  customerId: string
  customerName: string
  deviceBrand?: string
  deviceModel?: string
  imei?: string
  imei2?: string
  color?: string
  problem?: string
  conditionNotes?: string
  status: ServiceOrderStatus
  technicianName?: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

export type ServiceOrderInput = Omit<
  ServiceOrder,
  "id" | "number" | "createdAt" | "updatedAt"
>

function ordersCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "serviceOrders")
}

/** Assina as OS do tenant em tempo real (mais recentes primeiro). */
export function watchServiceOrders(
  tenantId: string,
  onData: (orders: ServiceOrder[]) => void,
  onError: (err: Error) => void
) {
  const q = query(ordersCol(tenantId), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ServiceOrder, "id">),
      }))
      logger.info("os", "snapshot de OS recebido", { total: list.length })
      onData(list)
    },
    (err) => {
      logger.error("os", "falha no watch de OS", err)
      onError(err)
    }
  )
}

/**
 * Cria uma OS com número sequencial por tenant (transação no contador
 * tenants/{id}.osCounter para evitar números duplicados).
 */
export async function createServiceOrder(tenantId: string, input: ServiceOrderInput) {
  logger.info("os", "criando OS", { cliente: input.customerName })
  try {
    const tenantRef = doc(db, "tenants", tenantId)
    const newRef = doc(ordersCol(tenantId))

    const number = await runTransaction(db, async (tx) => {
      const tenantSnap = await tx.get(tenantRef)
      const current = (tenantSnap.data()?.osCounter as number | undefined) ?? 0
      const next = current + 1
      tx.set(
        newRef,
        {
          ...input,
          number: next,
          status: input.status ?? "received",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      )
      tx.set(tenantRef, { osCounter: next }, { merge: true })
      return next
    })

    logger.success("os", "OS criada", { id: newRef.id, number })
    return { id: newRef.id, number }
  } catch (err) {
    logger.error("os", "falha ao criar OS", err)
    throw err
  }
}

export async function updateServiceOrderStatus(
  tenantId: string,
  id: string,
  status: ServiceOrderStatus
) {
  logger.info("os", "alterando status da OS", { id, status })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "serviceOrders", id), {
      status,
      updatedAt: serverTimestamp(),
    })
    logger.success("os", "status alterado", { id, status })
  } catch (err) {
    logger.error("os", "falha ao alterar status", err)
    throw err
  }
}

export async function deleteServiceOrder(tenantId: string, id: string) {
  logger.info("os", "removendo OS", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "serviceOrders", id))
    logger.success("os", "OS removida", { id })
  } catch (err) {
    logger.error("os", "falha ao remover OS", err)
    throw err
  }
}

/** Tempo relativo curto a partir de um Timestamp do Firestore. */
export function relativeTime(ts?: Timestamp | null): string {
  if (!ts) return "agora"
  const date = ts.toDate ? ts.toDate() : new Date(ts as unknown as string)
  const diffMs = Date.now() - date.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "agora"
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  const w = Math.floor(d / 7)
  return `${w}sem`
}
