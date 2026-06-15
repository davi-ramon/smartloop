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

export const PART_CATEGORIES = [
  "Telas", "Baterias", "Películas", "Capas", "Conectores", "Outros",
] as const

export type PartCategory = (typeof PART_CATEGORIES)[number]

export interface Part {
  id: string
  name: string
  sku?: string
  category?: string
  cost: number
  price: number
  stock: number
  minStock: number
  supplier?: string
  createdAt?: Timestamp | null
}

export type PartInput = Omit<Part, "id" | "createdAt">

function partsCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "parts")
}

export function watchParts(
  tenantId: string,
  onData: (parts: Part[]) => void,
  onError: (err: Error) => void
) {
  const q = query(partsCol(tenantId), orderBy("name"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Part, "id">) }))
      logger.info("estoque", "snapshot de peças recebido", { total: list.length })
      onData(list)
    },
    (err) => {
      logger.error("estoque", "falha no watch de peças", err)
      onError(err)
    }
  )
}

export async function createPart(tenantId: string, data: PartInput) {
  logger.info("estoque", "criando peça", { name: data.name })
  try {
    const ref = await addDoc(partsCol(tenantId), { ...data, createdAt: serverTimestamp() })
    logger.success("estoque", "peça criada", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("estoque", "falha ao criar peça", err)
    throw err
  }
}

export async function updatePart(tenantId: string, id: string, data: Partial<PartInput>) {
  logger.info("estoque", "atualizando peça", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "parts", id), data)
    logger.success("estoque", "peça atualizada", { id })
  } catch (err) {
    logger.error("estoque", "falha ao atualizar peça", err)
    throw err
  }
}

export async function deletePart(tenantId: string, id: string) {
  logger.info("estoque", "removendo peça", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "parts", id))
    logger.success("estoque", "peça removida", { id })
  } catch (err) {
    logger.error("estoque", "falha ao remover peça", err)
    throw err
  }
}
