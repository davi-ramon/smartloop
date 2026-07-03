"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { Cookie } from "lucide-react"
import { logger } from "@/lib/logger"

const KEY = "smartloop_cookie_consent"

/** Ativa rastreamentos que dependem de consentimento (Pixel/Analytics futuros). */
function enableTracking() {
  logger.info("cookies", "consentimento concedido — rastreamento habilitado")
  // Ponto de ativação futuro: Meta Pixel / Google Analytics só entram aqui.
}

/** Aviso de cookies discreto e persistente até o usuário escolher. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === "accepted") enableTracking()
      else if (saved !== "rejected") setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function decide(choice: "accepted" | "rejected") {
    try { localStorage.setItem(KEY, choice) } catch { /* ignora */ }
    logger.info("cookies", "escolha de cookies registrada", { choice })
    if (choice === "accepted") enableTracking()
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#0d1526]/95 p-4 shadow-2xl backdrop-blur-md sm:inset-x-4 sm:bottom-4"
          role="dialog" aria-label="Aviso de cookies"
        >
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <Cookie className="h-4 w-4 text-[#60a5fa]" />
            </div>
            <p className="flex-1 text-xs leading-relaxed text-slate-300">
              Usamos cookies para melhorar sua experiência e entender como o site é usado. Ao aceitar, você concorda com nossa{" "}
              <Link href="/cookies" className="text-[#60a5fa] underline underline-offset-2">Política de Cookies</Link> e{" "}
              <Link href="/privacidade" className="text-[#60a5fa] underline underline-offset-2">Privacidade</Link>.
            </p>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <button onClick={() => decide("rejected")} className="flex-1 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 sm:flex-none">
                Recusar
              </button>
              <button onClick={() => decide("accepted")} className="flex-1 rounded-lg bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none">
                Aceitar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
