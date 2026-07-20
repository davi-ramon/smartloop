import { getFunctions, httpsCallable } from "firebase/functions"
import app from "./config"
import { logger } from "@/lib/logger"

const functions = getFunctions(app, "southamerica-east1")

/**
 * Convida um técnico ja cadastrado (doc com email) para o SmartLoop.
 * Cria usuario no Firebase Auth (disabled), grava users/{uid} com
 * tenantId/role=technician/inviteStatus=pending, e envia email de ativacao
 * com link para /ativar-convite?token={uid}.
 */
export async function inviteTechnician(
  technicianDocId: string,
  email: string,
): Promise<{ ok: true; techUid: string; acceptUrl: string }> {
  logger.info("tecnicos", "convidando tecnico", { technicianDocId, email })
  const fn = httpsCallable(functions, "inviteTechnician")
  const res = await fn({ technicianDocId, email })
  return res.data as { ok: true; techUid: string; acceptUrl: string }
}

/**
 * Aceita um convite a partir do link recebido por email. Define a senha do
 * tecnico e ativa a conta no Auth + atualiza inviteStatus=active no Firestore.
 */
export async function acceptTechnicianInvite(
  uid: string,
  password: string,
): Promise<{ ok: true; email: string }> {
  logger.info("tecnicos", "ativando conta do tecnico", { uid: uid.slice(0, 6) + "..." })
  const fn = httpsCallable(functions, "acceptInvite")
  const res = await fn({ uid, password })
  return res.data as { ok: true; email: string }
}

/**
 * Revoga um tecnico: desativa no Auth, marca inviteStatus=revoked e active=false.
 */
export async function revokeTechnician(technicianDocId: string): Promise<{ ok: true }> {
  logger.info("tecnicos", "revogando tecnico", { technicianDocId })
  const fn = httpsCallable(functions, "revokeTechnician")
  const res = await fn({ technicianDocId })
  return res.data as { ok: true }
}