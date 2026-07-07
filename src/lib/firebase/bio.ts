import { getFunctions, httpsCallable } from "firebase/functions"
import app from "./config"
import { logger } from "@/lib/logger"
import type { BioPageSnapshot } from "@/lib/data/bio"

const functions = getFunctions(app, "southamerica-east1")

/* ─────────────────────────────────────────────────────────────
   Leitura pública — fetchBio
───────────────────────────────────────────────────────────── */

export async function fetchBio(): Promise<BioPageSnapshot> {
  // Cache em sessionStorage (30s) — primeira carga busca Firestore,
  // recargas (F5, voltar à aba) usam o cache sem network request.
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(BIO_CACHE_KEY)
      if (raw) {
        const { ts, data } = JSON.parse(raw) as { ts: number; data: BioPageSnapshot }
        if (Date.now() - ts < BIO_CACHE_TTL_MS) {
          logger.info("bio", "página pública (cache hit)", { ageMs: Date.now() - ts })
          return data
        }
      }
    } catch { /* ignora cache corrompido */ }
  }

  logger.info("bio", "buscando página pública", {})
  const fn = httpsCallable(functions, "getBioPage")
  const res = await fn()
  const data = res.data as BioPageSnapshot

  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(BIO_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
    } catch { /* sessionStorage cheio */ }
  }
  return data
}

/** Invalida o cache da Bio (chamado após salvar no editor). */
export function invalidateBioCache(): void {
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.removeItem(BIO_CACHE_KEY) } catch { /* */ }
  }
}

const BIO_CACHE_KEY = "smartloop_bio_cache"
const BIO_CACHE_TTL_MS = 30 * 1000

/* ─────────────────────────────────────────────────────────────
   UTMs — captura da URL + classificação do referrer.
   Persistência em sessionStorage com TTL de 30 min.
───────────────────────────────────────────────────────────── */

const UTM_KEY = "smartloop_bio_utm"
const UTM_TTL_MS = 30 * 60 * 1000

export type BioUtmSource = "instagram" | "facebook" | "tiktok" | "other" | "direct"
export interface BioUtmPayload {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  referrerHost?: string
  classifiedReferrer: BioUtmSource
}

const REFERER_MAP: Record<string, BioUtmSource> = {
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "tiktok.com": "tiktok",
  "vm.tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
}

/** Extrai UTMs da URL atual e grava em sessionStorage (com TTL). */
export function captureUtms(): void {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  const source = params.get("utm_source") || undefined
  const medium = params.get("utm_medium") || undefined
  const campaign = params.get("utm_campaign") || undefined
  const content = params.get("utm_content") || undefined
  const term = params.get("utm_term") || undefined
  if (source || medium || campaign) {
    try {
      sessionStorage.setItem(
        UTM_KEY,
        JSON.stringify({ source, medium, campaign, content, term, ts: Date.now() }),
      )
      logger.info("bio", "UTMs capturados", { source, medium, campaign })
    } catch { /* sessionStorage indisponível */ }
  }
}

/** Retorna UTMs armazenados + classificação do referrer. Não lança. */
export function getStoredUtms(): BioUtmPayload | null {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(UTM_KEY)
    if (!raw) return classifyReferrer()
    const parsed = JSON.parse(raw) as {
      source?: string; medium?: string; campaign?: string
      content?: string; term?: string; ts: number
    }
    if (Date.now() - parsed.ts > UTM_TTL_MS) {
      sessionStorage.removeItem(UTM_KEY)
      return classifyReferrer()
    }
    const ref = classifyReferrer()
    return { ...parsed, ...ref }
  } catch {
    return classifyReferrer()
  }
}

function classifyReferrer(): Pick<BioUtmPayload, "referrerHost" | "classifiedReferrer"> {
  if (typeof document === "undefined") {
    return { referrerHost: undefined, classifiedReferrer: "direct" }
  }
  const ref = document.referrer
  if (!ref) return { referrerHost: undefined, classifiedReferrer: "direct" }
  try {
    const host = new URL(ref).hostname
    return { referrerHost: host, classifiedReferrer: REFERER_MAP[host] || "other" }
  } catch {
    return { referrerHost: undefined, classifiedReferrer: "other" }
  }
}

/* ─────────────────────────────────────────────────────────────
   Tracking — recordBioEvent (best-effort, NUNCA lança).
   Página pública não pode quebrar se tracking falhar.
───────────────────────────────────────────────────────────── */

export type BioEventType = "view" | "click" | "redirect" | "viewContent"

export async function recordBioEvent(payload: {
  type: BioEventType
  linkId?: string
  path?: string
  href?: string
}): Promise<{ ok: true } | null> {
  const utms = getStoredUtms()
  const fn = httpsCallable(functions, "recordBioEvent")
  try {
    const res = await fn({
      ...payload,
      utms,
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      lang: typeof navigator !== "undefined" ? navigator.language : "",
    })
    return res.data as { ok: true }
  } catch (err) {
    // Best-effort — loga e engole.
    logger.warn("bio", "tracking falhou (ignorado)", { type: payload.type, error: err })
    return null
  }
}