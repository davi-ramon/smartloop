import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore"
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

// Deduplicação: garante que apenas UMA criação de perfil rode por uid,
// mesmo que signup() e o observer de auth chamem ao mesmo tempo (evita race
// que causava permission-denied ao atualizar o tenant antes do users existir).
const inFlightProfiles = new Map<string, Promise<UserProfile>>()
let pendingStoreName: string | undefined

/** signup() registra o nome da loja antes de criar o usuário. */
export function setPendingStoreName(name?: string) {
  pendingStoreName = name
}

/**
 * Garante que o usuário autenticado tenha um perfil e um tenant (loja).
 * Idempotente e à prova de concorrência: usa tenantId = uid do dono
 * (1 dono = 1 loja no MVP) e compartilha a mesma promise entre chamadas.
 */
export function ensureUserProfile(user: User, storeName?: string): Promise<UserProfile> {
  const existing = inFlightProfiles.get(user.uid)
  if (existing) return existing
  const promise = createOrLoadProfile(user, storeName ?? pendingStoreName)
    .finally(() => {
      inFlightProfiles.delete(user.uid)
      pendingStoreName = undefined
    })
  inFlightProfiles.set(user.uid, promise)
  return promise
}

async function createOrLoadProfile(
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
    status: "trial",
    trialEndsAt: Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
