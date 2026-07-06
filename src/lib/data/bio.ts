import {
  collection, doc, onSnapshot,
  addDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import { logger } from "@/lib/logger"

/* ─────────────────────────────────────────────────────────────
   Tipos — armazenados em PT-BR no Firestore (consistente com UI).
───────────────────────────────────────────────────────────── */

export type BioTamanho = "curto" | "medio" | "grande"
export type BioAspectRatio = "1:1" | "16:9"
export type BioBgStyle = "gradient" | "solid"
export type BioTextStyle = "light" | "dark"

export const PROFILE_DEFAULTS = {
  titulo: "SmartLoop",
  descricao: "",
  logoUrl: "",
  coverUrl: "",
  rodape: "smartloop.com.br",
  primary: "#2563eb",
  bgStyle: "gradient" as BioBgStyle,
  textStyle: "dark" as BioTextStyle,
}

export interface BioProfile {
  id?: string
  titulo: string
  descricao?: string
  logoUrl?: string
  coverUrl?: string
  rodape?: string
  primary: string
  bgStyle: BioBgStyle
  textStyle: BioTextStyle
  updatedAt?: Timestamp | null
  updatedBy?: string | null
}

export interface BioLink {
  id: string
  titulo: string
  subtitulo?: string
  url: string
  icone: string
  tamanho: BioTamanho
  aspectRatio?: BioAspectRatio
  imagemUrl?: string
  ativo: boolean
  ordem: number
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

export interface BioPageSnapshot {
  profile: BioProfile
  links: BioLink[]
}

const PROFILE_DOC = "bioPage/main"
const LINKS_COL = "bioPage/main/links"

/* ─────────────────────────────────────────────────────────────
   Leitura — watchBioPage combina 2 onSnapshot (profile + links).
   Retorna função de unsubscribe.
───────────────────────────────────────────────────────────── */

export function watchBioPage(
  onData: (snap: BioPageSnapshot) => void,
  onError: (err: Error) => void,
): () => void {
  logger.info("bio", "assinando página pública", {})
  let profile: BioProfile = { ...PROFILE_DEFAULTS }
  let links: BioLink[] = []
  let profileReady = false
  let linksReady = false

  const flush = () => {
    if (profileReady && linksReady) {
      onData({ profile: { ...profile }, links: [...links] })
    }
  }

  const unsubProfile = onSnapshot(
    doc(db, PROFILE_DOC),
    (snap) => {
      const data = snap.data() as Omit<BioProfile, "id"> | undefined
      profile = data ? { id: snap.id, ...data } : { id: "main", ...PROFILE_DEFAULTS }
      profileReady = true
      flush()
    },
    (err) => { logger.error("bio", "watch profile falhou", err); onError(err) },
  )

  const unsubLinks = onSnapshot(
    collection(db, LINKS_COL),
    (snap) => {
      links = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BioLink, "id">) }))
      links.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      linksReady = true
      flush()
    },
    (err) => { logger.error("bio", "watch links falhou", err); onError(err) },
  )

  return () => {
    logger.info("bio", "encerrando watch da página", {})
    unsubProfile()
    unsubLinks()
  }
}

/* ─────────────────────────────────────────────────────────────
   Mutations — admin only (Firestore rules bloqueiam não-admin).
───────────────────────────────────────────────────────────── */

export type NewBioLink = Omit<BioLink, "id" | "createdAt" | "updatedAt" | "ordem">

export async function createBioLink(data: NewBioLink): Promise<string> {
  // Ordem: usamos Date.now() como tiebreaker (próximo link sempre maior que
  // os atuais; admin é único, conflitos raríssimos; reorder final no saveBioPage).
  const ordem = Date.now()
  logger.info("bio", "criando link", { titulo: data.titulo, ordem })
  try {
    const ref = await addDoc(collection(db, LINKS_COL), {
      ...data,
      ativo: data.ativo ?? true,
      ordem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    logger.success("bio", "link criado", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("bio", "falha ao criar link", err)
    throw err
  }
}

export async function updateBioLink(id: string, patch: Partial<BioLink>): Promise<void> {
  logger.info("bio", "atualizando link", { id })
  try {
    await updateDoc(doc(db, LINKS_COL, id), {
      ...patch,
      updatedAt: serverTimestamp(),
    })
    logger.success("bio", "link atualizado", { id })
  } catch (err) {
    logger.error("bio", "falha ao atualizar link", err)
    throw err
  }
}

export async function deleteBioLink(id: string): Promise<void> {
  logger.info("bio", "removendo link", { id })
  try {
    await deleteDoc(doc(db, LINKS_COL, id))
    logger.success("bio", "link removido", { id })
  } catch (err) {
    logger.error("bio", "falha ao remover link", err)
    throw err
  }
}

export async function reorderBioLinks(orderedIds: string[]): Promise<void> {
  logger.info("bio", "reordenando links", { count: orderedIds.length })
  try {
    await Promise.all(
      orderedIds.map((id, idx) =>
        updateDoc(doc(db, LINKS_COL, id), {
          ordem: idx + 1,
          updatedAt: serverTimestamp(),
        }),
      ),
    )
    logger.success("bio", "links reordenados", { count: orderedIds.length })
  } catch (err) {
    logger.error("bio", "falha ao reordenar links", err)
    throw err
  }
}

export async function updateBioProfile(patch: Partial<BioProfile>, updatedBy?: string): Promise<void> {
  logger.info("bio", "atualizando perfil", { keys: Object.keys(patch) })
  try {
    await setDoc(
      doc(db, PROFILE_DOC),
      { ...patch, ...(updatedBy ? { updatedBy } : {}), updatedAt: serverTimestamp() },
      { merge: true },
    )
    logger.success("bio", "perfil atualizado")
  } catch (err) {
    logger.error("bio", "falha ao atualizar perfil", err)
    throw err
  }
}

/* ─────────────────────────────────────────────────────────────
   Storage — upload de logo/cover da página pública.
───────────────────────────────────────────────────────────── */

export type BioAssetKind = "logo" | "cover"

export async function uploadBioAsset(file: File, kind: BioAssetKind): Promise<string> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 60)
  const path = `bio/${kind}/${Date.now()}_${safe}`
  logger.info("bio", `enviando ${kind}`, { name: safe, size: file.size })
  try {
    const ref = storageRef(storage, path)
    await uploadBytes(ref, file)
    const url = await getDownloadURL(ref)
    logger.success("bio", `${kind} enviado`, { url })
    return url
  } catch (err) {
    logger.error("bio", `falha ao enviar ${kind}`, err)
    throw err
  }
}

/* ─────────────────────────────────────────────────────────────
   Save atômico — usado pelo editor.
   Reconcilia links (diff entre `currentLinks` e `nextLinks`):
   - novos (id temporário) → createBioLink
   - existentes (id real) → updateBioLink (somente se patch != current)
   - removidos → deleteBioLink
───────────────────────────────────────────────────────────── */

export async function saveBioPage(
  next: { profile: BioProfile; links: BioLink[] },
  current: { profile: BioProfile; links: BioLink[] },
  updatedBy?: string,
): Promise<void> {
  logger.info("bio", "publicando", {
    links: next.links.length,
    profileKeys: Object.keys(next.profile),
  })

  const tasks: Promise<unknown>[] = []

  // Profile — setDoc merge (campos idênticos são no-op no Firestore, mas barato).
  tasks.push(updateBioProfile(next.profile, updatedBy))

  const currentById = new Map(current.links.map((l) => [l.id, l]))
  const nextById = new Map(next.links.map((l) => [l.id, l]))

  // Removidos
  for (const id of currentById.keys()) {
    if (!nextById.has(id)) tasks.push(deleteBioLink(id))
  }

  // Criados / atualizados
  for (const link of next.links) {
    const prev = currentById.get(link.id)
    if (!prev) {
      // novo — sem o campo `id`/timestamps/ordem (o createBioLink gera)
      const { id, createdAt, updatedAt, ordem, ...payload } = link
      void id; void createdAt; void updatedAt; void ordem
      tasks.push(createBioLink(payload as NewBioLink))
    } else if (JSON.stringify(prev) !== JSON.stringify(link)) {
      const { id, createdAt, updatedAt, ...payload } = link
      void id; void createdAt; void updatedAt
      tasks.push(updateBioLink(link.id, payload))
    }
  }

  // Reordenar — sempre regrava ordem = idx+1, mais simples que diff.
  tasks.push(reorderBioLinks(next.links.map((l) => l.id)))

  try {
    await Promise.all(tasks)
    logger.success("bio", "publicada", { changes: tasks.length })
  } catch (err) {
    logger.error("bio", "falha ao publicar", err)
    throw err
  }
}