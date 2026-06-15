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

export interface Customer {
  id: string
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  cpf?: string
  active: boolean
  createdAt?: Timestamp | null
}

export type CustomerInput = Omit<Customer, "id" | "createdAt">

function customersCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "customers")
}

/** Assina a lista de clientes em tempo real. Retorna a função de unsubscribe. */
export function watchCustomers(
  tenantId: string,
  onData: (customers: Customer[]) => void,
  onError: (err: Error) => void
) {
  const q = query(customersCol(tenantId), orderBy("name"))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Customer, "id">),
      }))
      logger.info("customers", "snapshot recebido", { total: list.length })
      onData(list)
    },
    (err) => {
      logger.error("customers", "falha no watch de clientes", err)
      onError(err)
    }
  )
}

export async function createCustomer(tenantId: string, data: CustomerInput) {
  logger.info("customers", "criando cliente", { name: data.name })
  try {
    const ref = await addDoc(customersCol(tenantId), {
      ...data,
      createdAt: serverTimestamp(),
    })
    logger.success("customers", "cliente criado", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("customers", "falha ao criar cliente", err)
    throw err
  }
}

export async function updateCustomer(
  tenantId: string,
  id: string,
  data: Partial<CustomerInput>
) {
  logger.info("customers", "atualizando cliente", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "customers", id), data)
    logger.success("customers", "cliente atualizado", { id })
  } catch (err) {
    logger.error("customers", "falha ao atualizar cliente", err)
    throw err
  }
}

export async function deleteCustomer(tenantId: string, id: string) {
  logger.info("customers", "removendo cliente", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "customers", id))
    logger.success("customers", "cliente removido", { id })
  } catch (err) {
    logger.error("customers", "falha ao remover cliente", err)
    throw err
  }
}
