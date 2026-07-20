import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

/**
 * MVP: tecnico tem login proprio (Firebase Auth), pertence a um tenant,
 * acessa o sistema com permissao total EXCETO Financeiro/Configuracoes/Relatorios.
 *
 * Proxima iteracao (escopo separado): permissoes granulares via `permissions`.
 */

export const TECH_ROLES = ["Tecnico", "Tecnico Senior", "Atendente"] as const

export type TechRole = (typeof TECH_ROLES)[number]

export interface Technician {
  id: string
  /** uid no Firebase Auth. Vazio enquanto o convite nao foi aceito. */
  uid?: string
  name: string
  email: string
  role: TechRole
  phone?: string
  active: boolean
  /** "pending" = convite enviado, ainda nao aceito; "active" = aceitou; "revoked" = desativado pelo dono. */
  inviteStatus: "pending" | "active" | "revoked"
  createdAt?: Timestamp | null
  acceptedAt?: Timestamp | null
}

export type TechnicianInput = Omit<Technician, "id" | "uid" | "createdAt" | "acceptedAt" | "inviteStatus">

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
    (err) => { logger.error("tecnicos", "falha no watch de técnicos", err); onError(err) },
  )
}

export async function createTechnician(
  tenantId: string,
  data: TechnicianInput,
): Promise<string> {
  logger.info("tecnicos", "criando técnico", { name: data.name, email: data.email })
  try {
    const refDoc = await addDoc(techCol(tenantId), {
      ...data,
      inviteStatus: "pending" as const,
      createdAt: serverTimestamp(),
    })
    logger.success("tecnicos", "técnico criado", { id: refDoc.id })
    return refDoc.id
  } catch (err) {
    logger.error("tecnicos", "falha ao criar técnico", err)
    throw err
  }
}

export async function updateTechnician(
  tenantId: string,
  id: string,
  data: Partial<TechnicianInput>,
): Promise<void> {
  logger.info("tecnicos", "atualizando técnico", { id })
  try {
    await updateDoc(doc(db, "tenants", tenantId, "technicians", id), data)
    logger.success("tecnicos", "técnico atualizado", { id })
  } catch (err) {
    logger.error("tecnicos", "falha ao atualizar técnico", err)
    throw err
  }
}

export async function deleteTechnician(
  tenantId: string,
  id: string,
): Promise<void> {
  logger.info("tecnicos", "removendo técnico", { id })
  try {
    await deleteDoc(doc(db, "tenants", tenantId, "technicians", id))
    logger.success("tecnicos", "técnico removido", { id })
  } catch (err) {
    logger.error("tecnicos", "falha ao remover técnico", err)
    throw err
  }
}