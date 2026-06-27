import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export const TECH_ROLES = ["Técnico", "Técnico Sênior", "Atendente", "Proprietário"] as const

export interface Technician {
  id: string
  name: string
  role: string
  phone?: string
  active: boolean
  createdAt?: Timestamp | null
}

export type TechnicianInput = Omit<Technician, "id" | "createdAt">

function techCol(tenantId: string) {
  return collection(db, "tenants", tenantId, "technicians")
}

export function watchTechnicians(
  tenantId: string,
  onData: (techs: Technician[]) => void,
  onError: (err: Error) => void
) {
  const q = query(techCol(tenantId), orderBy("name"))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Technician, "id">) }))),
    (err) => { logger.error("tecnicos", "falha no watch de técnicos", err); onError(err) }
  )
}

export async function createTechnician(tenantId: string, data: TechnicianInput) {
  logger.info("tecnicos", "criando técnico", { name: data.name })
  try {
    const refDoc = await addDoc(techCol(tenantId), { ...data, createdAt: serverTimestamp() })
    logger.success("tecnicos", "técnico criado", { id: refDoc.id })
    return refDoc.id
  } catch (err) { logger.error("tecnicos", "falha ao criar técnico", err); throw err }
}

export async function updateTechnician(tenantId: string, id: string, data: Partial<TechnicianInput>) {
  logger.info("tecnicos", "atualizando técnico", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "technicians", id), data)
    logger.success("tecnicos", "técnico atualizado", { id })
  } catch (err) { logger.error("tecnicos", "falha ao atualizar técnico", err); throw err }
}

export async function deleteTechnician(tenantId: string, id: string) {
  logger.info("tecnicos", "removendo técnico", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "technicians", id))
    logger.success("tecnicos", "técnico removido", { id })
  } catch (err) { logger.error("tecnicos", "falha ao remover técnico", err); throw err }
}
