"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MessageCircle, ArrowRight } from "lucide-react"
import { logger } from "@/lib/logger"

/**
 * Exit-intent — desktop: detecta mouse deixando a viewport pelo topo,
 * mostra o modal após 1.5s (se ainda não foi visto nesta sessão).
 * Mobile: não dispara o modal (sem mouse confiável); os eventos de
 * `visibilitychange` ficam na própria página.
 */
const PEDRO_WA = "https://wa.me/5563991089086?text=" + encodeURIComponent("Olá! Vim pela página /bio e gostaria de saber mais.")
const SEEN_KEY = "smartloop_bio_exit_seen"
const SHOW_DELAY_MS = 1500

export function ExitPopup() {
  const [open, setOpen] = React.useState(false)
  const shownRef = React.useRef(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") return
    if (sessionStorage.getItem(SEEN_KEY) === "1") return
    if (window.matchMedia?.("(hover: none)").matches) return // mobile — sem mouse intent

    function onLeave(e: MouseEvent) {
      if (shownRef.current) return
      // clientY <= 0 → cursor saiu pelo topo da viewport (exit intent clássico)
      if (e.clientY <= 0) {
        shownRef.current = true
        logger.info("bio", "intent de saída detectado", {})
        setTimeout(() => setOpen(true), SHOW_DELAY_MS)
      }
    }
    document.documentElement.addEventListener("mouseleave", onLeave)
    return () => document.documentElement.removeEventListener("mouseleave", onLeave)
  }, [])

  function dismiss() {
    if (typeof sessionStorage !== "undefined") {
      try { sessionStorage.setItem(SEEN_KEY, "1") } catch { /* ignora */ }
    }
    setOpen(false)
    logger.info("bio", "exit-popup dismissed", {})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) dismiss()
      }}
    >
      <DialogContent drawerOnMobile className="sm:max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--primary]/10 text-[--primary]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Antes de sair…</DialogTitle>
            <DialogDescription>
              Sabia que dá pra resolver tudo num só lugar?
            </DialogDescription>
          </div>
        </div>
        <p className="text-sm text-[--muted-foreground]">
          Vamos conversar pelo WhatsApp, sem custo. Resposta rápida e atendimento humano
          do Pedro ou da equipe.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <a
            href={PEDRO_WA}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Falar no WhatsApp <ArrowRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border border-[--border] py-3 text-sm font-medium text-[--foreground] hover:bg-[--muted]"
          >
            Continuar navegando
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}