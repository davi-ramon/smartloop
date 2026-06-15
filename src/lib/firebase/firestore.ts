import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "./config"
import { logger } from "@/lib/logger"

export type UserRole = "owner" | "technician" | "attendant"

export interface UserProfile {
  uid: string
  tenantId: string
  name: string
  email: string
  role: UserRole
}

/**
 * Garante que o usuário autenticado tenha um perfil e um tenant (loja).
 * Idempotente: usa tenantId = uid do dono (1 dono = 1 loja no MVP), então
 * múltiplas chamadas (signup + observer de auth) não criam duplicatas.
 */
export async function ensureUserProfile(
  user: User,
  storeName?: string
): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid)
  const snap = await getDoc(userRef)

  if (snap.exists()) {
    const d = snap.data()
    return {
      uid: user.uid,
      tenantId: d.tenantId,
      name: d.name ?? "",
      email: d.email ?? "",
      role: (d.role ?? "owner") as UserRole,
    }
  }

  // Primeiro acesso: cria a loja e o perfil do dono.
  const tenantId = user.uid
  const name = user.displayName || "Responsável"
  const email = user.email || ""
  logger.info("firestore", "bootstrap de tenant/usuário (primeiro acesso)", {
    uid: user.uid,
  })

  await setDoc(doc(db, "tenants", tenantId), {
    name: storeName || name || "Minha Loja",
    ownerId: user.uid,
    plan: "pro",
    createdAt: serverTimestamp(),
  })

  await setDoc(userRef, {
    tenantId,
    name,
    email,
    role: "owner",
    createdAt: serverTimestamp(),
  })

  logger.success("firestore", "tenant/usuário criados", { tenantId })
  return { uid: user.uid, tenantId, name, email, role: "owner" }
}
