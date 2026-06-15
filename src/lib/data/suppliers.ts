import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export interface Supplier {
  id: string
  name: string
  city?: string
  phone?: string
  email?: string
  active: boolean
  createdAt?: Timestamp | null
}

export type SupplierInput = Omit<Supplier, "id" | "createdAt">

function suppliersCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "suppliers")
}

export function watchSuppliers(
  tenantId: string,
  onData: (suppliers: Supplier[]) => void,
  onError: (err: Error) => void
) {
  const q = query(suppliersCol(tenantId), orderBy("name"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Supplier, "id">) }))
      logger.info("fornecedores", "snapshot recebido", { total: list.length })
      onData(list)
    },
    (err) => {
      logger.error("fornecedores", "falha no watch de fornecedores", err)
      onError(err)
    }
  )
}

export async function createSupplier(tenantId: string, data: SupplierInput) {
  logger.info("fornecedores", "criando fornecedor", { name: data.name })
  try {
    const ref = await addDoc(suppliersCol(tenantId), { ...data, createdAt: serverTimestamp() })
    logger.success("fornecedores", "fornecedor criado", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("fornecedores", "falha ao criar fornecedor", err)
    throw err
  }
}

export async function updateSupplier(tenantId: string, id: string, data: Partial<SupplierInput>) {
  logger.info("fornecedores", "atualizando fornecedor", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "suppliers", id), data)
    logger.success("fornecedores", "fornecedor atualizado", { id })
  } catch (err) {
    logger.error("fornecedores", "falha ao atualizar fornecedor", err)
    throw err
  }
}

export async function deleteSupplier(tenantId: string, id: string) {
  logger.info("fornecedores", "removendo fornecedor", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "suppliers", id))
    logger.success("fornecedores", "fornecedor removido", { id })
  } catch (err) {
    logger.error("fornecedores", "falha ao remover fornecedor", err)
    throw err
  }
}
