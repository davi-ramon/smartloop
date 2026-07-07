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
export type BioAnimacaoEstilo = "aurora" | "grade" | "ondas" | "particulas" | "desligado"
export type BioAnimacaoVelocidade = "lenta" | "normal" | "rapida"

export interface BioAnimacao {
  estilo: BioAnimacaoEstilo
  corPrimaria?: string
  corSecundaria?: string
  velocidade: BioAnimacaoVelocidade
  /** 0..100 — controla intensidade do movimento/escala. */
  intensidade: number
}

export const ANIMACAO_DEFAULTS: BioAnimacao = {
  estilo: "aurora",
  corPrimaria: "#2563eb",
  corSecundaria: "#7c3aed",
  velocidade: "lenta",
  intensidade: 40,
}

export const PROFILE_DEFAULTS = {
  titulo: "SmartLoop",
  descricao: "",
  logoUrl: "",
  coverUrl: "",
  rodape: "smartloop.com.br",
  primary: "#2563eb",
  bgStyle: "gradient" as BioBgStyle,
  textStyle: "dark" as BioTextStyle,
  fraseTopo: "",
  animacao: ANIMACAO_DEFAULTS,
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
  /** Frase curta exibida entre a capa e a foto de perfil. Max 120. */
  fraseTopo?: string
  /** Configuração da animação procedural do fundo. */
  animacao?: BioAnimacao
  // Open Graph (preview de compartilhamento em redes sociais / WhatsApp)
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string
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
  /** URL de ícone personalizado (PNG/ICO/BMP/SVG). Só válido p/ tamanho !== "curto". */
  iconeUrl?: string
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
      // Aplica defaults da animação caso o campo esteja ausente no Firestore
      // (doc antigo sem o campo continua funcionando).
      if (!profile.animacao) {
        profile.animacao = { ...ANIMACAO_DEFAULTS }
      }
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

/**
 * Remove chaves com `undefined` de um objeto. Necessário porque o Firestore
 * rejeita `undefined` em addDoc/updateDoc ("Unsupported field value: undefined").
 * Mantém o tipo estrutural via spread.
 */
function purgeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(obj) as Array<keyof T>) {
    if (obj[k] !== undefined) out[k] = obj[k]
  }
  return out
}

export async function createBioLink(data: NewBioLink): Promise<string> {
  // Ordem: usamos Date.now() como tiebreaker (próximo link sempre maior que
  // os atuais; admin é único, conflitos raríssimos; reorder final no saveBioPage).
  const ordem = Date.now()
  const safeData = purgeUndefined({ ...data })
  logger.info("bio", "criando link", { titulo: safeData.titulo, ordem, fields: Object.keys(safeData) })
  try {
    const ref = await addDoc(collection(db, LINKS_COL), {
      ...safeData,
      ativo: safeData.ativo ?? true,
      ordem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    logger.success("bio", "link criado", { id: ref.id })
    return ref.id
  } catch (err) {
    logger.error("bio", "falha ao criar link", { err: serializeError(err), sentFields: Object.keys(safeData) })
    throw err
  }
}

export async function updateBioLink(id: string, patch: Partial<BioLink>): Promise<void> {
  const safePatch = purgeUndefined({ ...patch })
  logger.info("bio", "atualizando link", { id, fields: Object.keys(safePatch) })
  try {
    await updateDoc(doc(db, LINKS_COL, id), {
      ...safePatch,
      updatedAt: serverTimestamp(),
    })
    logger.success("bio", "link atualizado", { id })
  } catch (err) {
    logger.error("bio", "falha ao atualizar link", { id, err: serializeError(err), sentFields: Object.keys(safePatch) })
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
  const safePatch = purgeUndefined({ ...patch })
  logger.info("bio", "atualizando perfil", { fields: Object.keys(safePatch) })
  try {
    await setDoc(
      doc(db, PROFILE_DOC),
      { ...safePatch, ...(updatedBy ? { updatedBy } : {}), updatedAt: serverTimestamp() },
      { merge: true },
    )
    logger.success("bio", "perfil atualizado")
  } catch (err) {
    logger.error("bio", "falha ao atualizar perfil", { err: serializeError(err), sentFields: Object.keys(safePatch) })
    throw err
  }
}

/** Serializa Error para algo legível em logs (evita [object Object]). */
function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, code: (err as Error & { code?: string }).code ?? null }
  }
  return { raw: String(err) }
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
   Reconcilia links (diff entre `currentLinks` e `nextLinks`).
   Ordem das etapas (sequencial, não paralelo):
     1. Deletar links removidos
     2. Criar links novos (gera IDs reais; mapeia tmpId → realId)
     3. Atualizar links existentes que mudaram (somente após todos os creates ok)
     4. Reordenar SOMENTE com IDs reais (Firestore, não tmp_*)
   Em caso de falha em qualquer etapa, aborta e devolve erro legível.
───────────────────────────────────────────────────────────── */

export async function saveBioPage(
  next: { profile: BioProfile; links: BioLink[] },
  current: { profile: BioProfile; links: BioLink[] },
  updatedBy?: string,
): Promise<void> {
  logger.info("bio", "publicando", {
    links: next.links.length,
    currentLinks: current.links.length,
  })

  // 1. Profile (independente dos links — pode rodar em paralelo com delete)
  await updateBioProfile(next.profile, updatedBy)

  const currentById = new Map(current.links.map((l) => [l.id, l]))
  const nextById = new Map(next.links.map((l) => [l.id, l]))

  // 2. Deletar links removidos
  const removedIds = [...currentById.keys()].filter((id) => !nextById.has(id))
  if (removedIds.length > 0) {
    logger.info("bio", "removendo links", { ids: removedIds })
    for (const id of removedIds) {
      try { await deleteBioLink(id) }
      catch (err) {
        logger.error("bio", "falha ao deletar link", { id, err: serializeError(err) })
        throw new Error(`Falha ao remover link ${id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // 3. Criar links novos (sequencial pra capturar IDs reais)
  const idMap = new Map<string, string>() // tmpId → realId
  for (const link of next.links) {
    if (currentById.has(link.id)) continue // não é novo
    const { id: _tmp, createdAt, updatedAt, ordem, ...raw } = link
    void createdAt; void updatedAt; void ordem
    const payload = purgeUndefined(raw) as NewBioLink
    try {
      const realId = await createBioLink(payload)
      idMap.set(link.id, realId)
      logger.info("bio", "novo link criado", { tmpId: link.id, realId })
    } catch (err) {
      logger.error("bio", "falha ao criar link — abortando publicação", {
        tmpId: link.id,
        titulo: link.titulo,
        err: serializeError(err),
        sentFields: Object.keys(payload),
      })
      throw new Error(`Falha ao criar link "${link.titulo}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 4. Atualizar links existentes (somente após todos os creates ok)
  for (const link of next.links) {
    const prev = currentById.get(link.id)
    if (!prev) continue // novo, já tratado
    if (JSON.stringify(prev) === JSON.stringify(link)) continue // sem mudança
    const { id: _id, createdAt, updatedAt, ...raw } = link
    void createdAt; void updatedAt
    const patch = purgeUndefined(raw) as Partial<BioLink>
    try {
      await updateBioLink(link.id, patch)
    } catch (err) {
      logger.error("bio", "falha ao atualizar link", {
        id: link.id,
        titulo: link.titulo,
        err: serializeError(err),
        sentFields: Object.keys(patch),
      })
      throw new Error(`Falha ao atualizar link "${link.titulo}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 5. Reordenar — APENAS IDs reais (Firestore rejeita tmp_*).
  //    Substitui tmp_ por realId usando o mapa criado acima.
  const realIds = next.links.map((l) => idMap.get(l.id) ?? l.id)
  await reorderBioLinks(realIds)

  logger.success("bio", "publicada", {
    criados: idMap.size,
    atualizados: next.links.filter((l) => currentById.has(l.id) && JSON.stringify(currentById.get(l.id)) !== JSON.stringify(l)).length,
    removidos: removedIds.length,
    reordenados: realIds.length,
  })
}