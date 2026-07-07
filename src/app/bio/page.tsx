"use client"

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { fetchBio, captureUtms, recordBioEvent, type BioUtmPayload } from "@/lib/firebase/bio"
import type { BioPageSnapshot } from "@/lib/data/bio"
import { BioPageView } from "@/components/bio/bio-page-view"
import { ExitPopup } from "@/components/bio/exit-popup"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import type { BioLink } from "@/lib/data/bio"

/**
 * Página pública /bio — sem auth, consulta `getBioPage` via Cloud Function.
 *
 * Tracking:
 *   - Uma view por sessão (flag em sessionStorage).
 *   - Click nos links: window.open síncrono (sem await antes) + event async.
 *   - visibilitychange → recordBioEvent({type:"redirect"}) (best-effort).
 *   - UTM capturado e classificado pelo referrer.
 *
 * Erros de tracking são engolidos via `recordBioEvent` (best-effort).
 */
/** Lê o cache do sessionStorage de forma síncrona no primeiro render
 *  (client-only — protegi contra typeof window). */
function readBioCache(): BioPageSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("smartloop_bio_cache")
    if (!raw) return null
    const { ts, data } = JSON.parse(raw) as { ts: number; data: BioPageSnapshot }
    if (Date.now() - ts < 30 * 1000) return data
  } catch { /* ignora */ }
  return null
}

export default function BioPublicPage() {
  const [initial] = React.useState(() => readBioCache())
  const [profile, setProfile] = React.useState<BioPublicState["profile"]>(initial?.profile ?? null)
  const [links, setLinks] = React.useState<BioLink[]>(initial?.links ?? [])
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const load = React.useCallback(() => {
    startTransition(async () => {
      try {
        const data = await fetchBio()
        setProfile(data.profile)
        setLinks(data.links)
        setError(null)
        logger.info("bio", "página carregada", { links: data.links.length })
      } catch (err) {
        logger.error("bio", "fetchBio falhou", err)
        setError("Não foi possível carregar a página. Tente novamente em instantes.")
      }
    })
  }, [])

  const loading = isPending && !profile

  React.useEffect(() => {
    captureUtms()
    load()
  }, [load])

  // View uma vez por sessão
  React.useEffect(() => {
    if (!profile) return
    if (typeof sessionStorage === "undefined") return
    if (sessionStorage.getItem("bio_view_recorded") === "1") return
    sessionStorage.setItem("bio_view_recorded", "1")
    void recordBioEvent({ type: "view", path: "/bio" })
  }, [profile])

  // Redirect event em visibilitychange (analytics; pode não completar)
  React.useEffect(() => {
    if (typeof document === "undefined") return
    function onVis() {
      if (document.visibilityState === "hidden") {
        void recordBioEvent({ type: "redirect", path: "/bio" })
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  function handleLinkClick(e: React.MouseEvent, link: BioLink) {
    e.preventDefault()
    // Crítico: window.open SÍNCRONO antes de qualquer await — browsers
    // bloqueiam popup quando vem depois de código async.
    const win = window.open(link.url, "_blank", "noopener,noreferrer")
    if (!win) {
      logger.warn("bio", "popup bloqueado — usuário pode não ter visto o link abrir", { linkId: link.id })
    }
    void recordBioEvent({ type: "click", linkId: link.id, path: "/bio", href: link.url })
  }

  if (loading) return <Loading />
  if (error || !profile) return <ErrorState message={error} onRetry={load} />
  return (
    <>
      <BioPageView profile={profile} links={links} onLinkClick={handleLinkClick} />
      <ExitPopup />
    </>
  )
}

/* ────── estados ────── */

type BioPublicState = {
  profile: import("@/lib/data/bio").BioProfile | null
  links: BioLink[]
  utms: BioUtmPayload | null
}

function Loading() {
  return (
    <div
      className="min-h-screen bg-[--background]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-md px-5 pt-0 pb-12">
        {/* Capa skeleton */}
        <div className="h-44 w-full animate-pulse rounded-b-2xl bg-[--muted]" />
        {/* Avatar skeleton */}
        <div className="-mt-20 mb-4 flex justify-center sm:-mt-24">
          <div className="h-32 w-32 animate-pulse rounded-full border-4 bg-[--muted] sm:h-40 sm:w-40" />
        </div>
        {/* Título skeleton */}
        <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-[--muted]" />
        <div className="mx-auto mt-2 h-3 w-1/2 animate-pulse rounded bg-[--muted]" />
        {/* 4 botões skeleton */}
        <ul className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="h-11 animate-pulse rounded-2xl bg-[--muted]"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--background] p-4">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ef4444]/10">
          <AlertCircle className="h-7 w-7 text-[#ef4444]" />
        </div>
        <p className="text-sm font-medium text-[--foreground]">
          Algo deu errado ao carregar esta página.
        </p>
        <p className="text-xs text-[--muted-foreground]">{message || "Tente novamente."}</p>
        <Button onClick={onRetry} className="mt-2 text-white" style={{ backgroundColor: "var(--primary)" }}>
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    </div>
  )
}