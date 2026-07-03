import {
  collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy,
  serverTimestamp, type Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

export type BugReportType = "bug" | "suggestion"
export type BugReportStatus = "new" | "in_progress" | "resolved"

/** Módulos do sistema (para localizar onde o problema ocorreu). */
export const BUG_MODULES = [
  "Início / Dashboard", "Ordens de Serviço", "Clientes", "Técnicos", "Fornecedores",
  "PDV", "Orçamento", "Estoque", "Financeiro", "Garantia", "Relatórios",
  "Configurações", "Login / Cadastro", "Outro",
] as const

export interface BugAttachment {
  url: string
  name: string
  type: string
}

export interface BugReport {
  id: string
  type: BugReportType
  module: string
  description: string
  attachments: BugAttachment[]
  rating?: number
  ratingComment?: string
  status: BugReportStatus
  // Autoria / contexto (para análise)
  userId: string
  userName?: string
  userEmail?: string
  tenantId?: string
  path?: string
  userAgent?: string
  createdAt?: Timestamp | null
}

export type NewBugReport = Omit<BugReport, "id" | "createdAt" | "status" | "rating" | "ratingComment">

const COL = "bugReports"

/** Sobe um anexo do relato para o Storage e retorna a URL. */
export async function uploadBugAttachment(uid: string, file: File, index: number): Promise<BugAttachment> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 60)
  const path = `bugReports/${uid}/${Date.now()}_${index}_${safe}`
  logger.info("bugs", "enviando anexo", { name: safe, size: file.size })
  try {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    logger.success("bugs", "anexo enviado", { name: safe })
    return { url, name: file.name, type: file.type }
  } catch (err) {
    logger.error("bugs", "falha ao enviar anexo", err)
    throw err
  }
}

/** Cria o relato de bug/sugestão. Retorna o id do documento. */
export async function createBugReport(data: NewBugReport): Promise<string> {
  logger.info("bugs", "registrando relato", { type: data.type, module: data.module })
  try {
    const refDoc = await addDoc(collection(db, COL), {
      ...data,
      status: "new",
      createdAt: serverTimestamp(),
    })
    logger.success("bugs", "relato registrado", { id: refDoc.id })
    return refDoc.id
  } catch (err) {
    logger.error("bugs", "falha ao registrar relato", err)
    throw err
  }
}

/** Anexa a avaliação (NPS) ao relato já criado. */
export async function rateBugReport(id: string, rating: number, ratingComment?: string) {
  logger.info("bugs", "avaliação do relato", { id, rating })
  try {
    await updateDoc(doc(db, COL, id), { rating, ratingComment: ratingComment || "" })
  } catch (err) {
    logger.error("bugs", "falha ao salvar avaliação", err)
    // não relança: avaliação é opcional, não deve travar o fluxo
  }
}

/** Assina os relatos (somente admins conseguem ler — imposto nas rules). */
export function watchBugReports(
  onData: (reports: BugReport[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BugReport, "id">) }))),
    (err) => { logger.error("bugs", "falha no watch de relatos", err); onError(err) },
  )
}

export async function updateBugReportStatus(id: string, status: BugReportStatus) {
  logger.info("bugs", "alterando status do relato", { id, status })
  try {
    await updateDoc(doc(db, COL, id), { status })
  } catch (err) {
    logger.error("bugs", "falha ao alterar status", err)
    throw err
  }
}
