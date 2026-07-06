"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { fetchBio, captureUtms, recordBioEvent, type BioUtmPayload } from "@/lib/firebase/bio"
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
export default function BioPublicPage() {
  const [profile, setProfile] = React.useState<BioPublicState["profile"]>(null)
  const [links, setLinks] = React.useState<BioLink[]>([])
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
    <div className="flex h-screen items-center justify-center bg-[--background]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[--primary]/10 text-[--primary]"
      >
        <Loader2 className="h-5 w-5" />
      </motion.div>
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