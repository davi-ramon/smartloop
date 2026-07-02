"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Bell, PackageX, FileClock, PackageCheck, AlertTriangle, PauseCircle, CheckCheck } from "lucide-react"
import { useWorkspace } from "@/lib/firebase/workspace-context"
import { relativeTime } from "@/lib/data/service-orders"
import { logger } from "@/lib/logger"
import type { LucideIcon } from "lucide-react"

interface Notice {
  id: string
  icon: LucideIcon
  title: string
  sub?: string
  href: string
  tone: string // classe de cor do ícone
}

const STALE_MS = 7 * 86_400_000 // OS parada: sem movimentação há 7+ dias

/** Sino + painel de notificações derivadas do estado real da loja. */
export function Notifications() {
  const router = useRouter()
  const { parts, quotes, orders } = useWorkspace()
  const [open, setOpen] = useState(false)

  const notices = useMemo<Notice[]>(() => {
    // eslint-disable-next-line react-hooks/purity -- leitura intencional do relógio para "OS paradas"
    const now = Date.now()
    const list: Notice[] = []

    // Estoque baixo (ou zerado)
    parts
      .filter((p) => p.stock <= (p.minStock ?? 0) || p.stock === 0)
      .slice(0, 6)
      .forEach((p) =>
        list.push({
          id: "stock-" + p.id, icon: PackageX,
          title: p.stock === 0 ? `Sem estoque: ${p.name}` : `Estoque baixo: ${p.name}`,
          sub: `${p.stock} em estoque · mínimo ${p.minStock ?? 0}`,
          href: "/estoque", tone: "text-[#ef4444]",
        }),
      )

    // Orçamentos aguardando resposta do cliente
    const pending = quotes.filter((q) => q.status === "pending")
    if (pending.length) {
      list.push({
        id: "quotes-pending", icon: FileClock,
        title: `${pending.length} orçamento${pending.length > 1 ? "s" : ""} aguardando resposta`,
        sub: "Toque para acompanhar", href: "/os", tone: "text-[#f59e0b]",
      })
    }

    // OS prontas para entrega
    orders.filter((o) => o.status === "ready").slice(0, 6).forEach((o) =>
      list.push({
        id: "ready-" + o.id, icon: PackageCheck,
        title: `OS #${o.number} pronta para entrega`, sub: o.customerName,
        href: "/os", tone: "text-[#10b981]",
      }),
    )

    // OS aguardando peça
    orders.filter((o) => o.status === "waiting_part").slice(0, 6).forEach((o) =>
      list.push({
        id: "wp-" + o.id, icon: AlertTriangle,
        title: `OS #${o.number} aguardando peça`, sub: o.customerName,
        href: "/os", tone: "text-[#ef4444]",
      }),
    )

    // OS paradas — abertas e sem movimentação há 7+ dias
    orders
      .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
      .filter((o) => {
        const ms = o.updatedAt?.toDate?.().getTime()
        return ms != null && now - ms > STALE_MS
      })
      .slice(0, 6)
      .forEach((o) =>
        list.push({
          id: "stale-" + o.id, icon: PauseCircle,
          title: `OS #${o.number} parada`, sub: `Sem movimentação há ${relativeTime(o.updatedAt)} · ${o.customerName}`,
          href: "/os", tone: "text-[#64748b]",
        }),
      )

    return list
  }, [parts, quotes, orders])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) logger.info("notificacoes", "painel aberto", { total: notices.length })
  }

  function goto(n: Notice) {
    logger.info("notificacoes", "notificação aberta", { href: n.href })
    setOpen(false)
    router.push(n.href)
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notificações"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground]"
      >
        <Bell className="h-4 w-4" />
        {notices.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[--accent] px-1 text-[9px] font-bold text-white">
            {notices.length > 9 ? "9+" : notices.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-[--border] shadow-2xl"
              style={{ backgroundColor: "var(--card)" }}
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-[--border] px-4 py-3">
                <p className="text-sm font-semibold text-[--foreground]">Notificações</p>
                <span className="text-xs text-[--muted-foreground]">{notices.length}</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notices.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <CheckCheck className="h-6 w-6 text-[#10b981]" />
                    <p className="text-sm font-medium text-[--foreground]">Tudo em dia</p>
                    <p className="text-xs text-[--muted-foreground]">Nenhuma pendência no momento.</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {notices.map((n) => (
                      <motion.button
                        key={n.id} layout
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        onClick={() => goto(n)}
                        className="flex w-full items-start gap-3 border-b border-[--border] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[--muted]"
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--muted]">
                          <n.icon className={`h-3.5 w-3.5 ${n.tone}`} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-[--foreground]">{n.title}</span>
                          {n.sub && <span className="block truncate text-xs text-[--muted-foreground]">{n.sub}</span>}
                        </span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
