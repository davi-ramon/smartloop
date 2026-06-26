import { doc, onSnapshot, updateDoc, type Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export interface Tenant {
  id: string
  name?: string           // razão social
  fantasyName?: string
  cnpj?: string
  whatsapp?: string
  email?: string
  city?: string
  logoUrl?: string
  paymentMethods?: string[]
  plan?: string
  status?: string
  onboardingDone?: boolean
  trialEndsAt?: Timestamp | null
  createdAt?: Timestamp | null
}

export type TenantUpdate = Partial<Omit<Tenant, "id">>

export function watchTenant(
  tenantId: string,
  onData: (tenant: Tenant | null) => void,
  onError: (err: Error) => void
) {
  return onSnapshot(
    doc(db, "tenants", tenantId),
    (snap) => {
      const t = snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Tenant, "id">) }) : null
      onData(t)
    },
    (err) => {
      logger.error("tenant", "falha no watch do tenant", err)
      onError(err)
    }
  )
}

export async function updateTenant(tenantId: string, data: TenantUpdate) {
  logger.info("tenant", "atualizando dados da empresa", { campos: Object.keys(data) })
  try {
    await updateDoc(doc(db, "tenants", tenantId), data)
    logger.success("tenant", "dados da empresa salvos", { tenantId })
  } catch (err) {
    logger.error("tenant", "falha ao salvar dados da empresa", err)
    throw err
  }
}

/** Sobe a logo para o Storage e retorna a URL pública. */
export async function uploadLogo(tenantId: string, file: File): Promise<string> {
  logger.info("tenant", "enviando logo", { tenantId, size: file.size, type: file.type })
  try {
    const ext = file.name.split(".").pop() || "png"
    const storageRef = ref(storage, `tenants/${tenantId}/logo.${ext}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    logger.success("tenant", "logo enviada", { tenantId })
    return url
  } catch (err) {
    logger.error("tenant", "falha ao enviar logo", err)
    throw err
  }
}
