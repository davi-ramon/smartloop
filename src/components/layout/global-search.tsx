"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { AnimatePresence, motion } from "motion/react"
import {
  Search, Users, ClipboardList, Smartphone, Wrench, Truck, Package, Boxes,
} from "lucide-react"
import { useWorkspace } from "@/lib/firebase/workspace-context"
import { logger } from "@/lib/logger"

interface Result {
  id: string
  label: string
  sub?: string
  href: string
  keywords: string
}

/** Busca global (⌘K) sobre clientes, OS, aparelhos, técnicos, fornecedores, produtos e peças. */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { customers, orders, technicians, suppliers, products, parts } = useWorkspace()

  const groups = useMemo(() => {
    const clientes: Result[] = customers.map((c) => ({
      id: "c-" + c.id, label: c.name, sub: c.whatsapp || c.phone || c.email,
      href: "/clientes", keywords: `${c.name} ${c.whatsapp ?? ""} ${c.phone ?? ""} ${c.email ?? ""}`,
    }))
    const os: Result[] = orders.map((o) => ({
      id: "o-" + o.id, label: `OS #${o.number} · ${o.customerName}`,
      sub: [o.deviceBrand, o.deviceModel].filter(Boolean).join(" ") || o.problem,
      href: "/os", keywords: `os ${o.number} ${o.customerName} ${o.deviceBrand ?? ""} ${o.deviceModel ?? ""} ${o.imei ?? ""}`,
    }))
    const aparelhosMap = new Map<string, string>()
    orders.forEach((o) => {
      const label = [o.deviceBrand, o.deviceModel].filter(Boolean).join(" ")
      if (label) aparelhosMap.set(label.toLowerCase(), label)
    })
    const aparelhos: Result[] = [...aparelhosMap.values()].map((label) => ({
      id: "a-" + label, label, href: "/os", keywords: label,
    }))
    const tecnicos: Result[] = technicians.map((t) => ({
      id: "t-" + t.id, label: t.name, sub: t.role, href: "/tecnicos", keywords: `${t.name} ${t.role}`,
    }))
    const fornecedores: Result[] = suppliers.map((s) => ({
      id: "f-" + s.id, label: s.name, sub: s.city || s.phone, href: "/fornecedores", keywords: `${s.name} ${s.city ?? ""} ${s.phone ?? ""}`,
    }))
    const prods: Result[] = products.map((p) => ({
      id: "p-" + p.id, label: p.name, sub: p.category, href: "/pdv", keywords: `${p.name} ${p.category ?? ""} ${p.sku ?? ""}`,
    }))
    const pecas: Result[] = parts.map((p) => ({
      id: "pt-" + p.id, label: p.name, sub: p.category, href: "/estoque", keywords: `${p.name} ${p.category ?? ""} ${p.sku ?? ""}`,
    }))
    return [
      { key: "Clientes", icon: Users, items: clientes },
      { key: "Ordens de Serviço", icon: ClipboardList, items: os },
      { key: "Aparelhos", icon: Smartphone, items: aparelhos },
      { key: "Técnicos", icon: Wrench, items: tecnicos },
      { key: "Fornecedores", icon: Truck, items: fornecedores },
      { key: "Produtos", icon: Package, items: prods },
      { key: "Peças", icon: Boxes, items: pecas },
    ].filter((g) => g.items.length > 0)
  }, [customers, orders, technicians, suppliers, products, parts])

  function go(r: Result) {
    logger.info("busca", "resultado selecionado", { href: r.href })
    onClose()
    router.push(r.href)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[--border] shadow-2xl"
            style={{ backgroundColor: "var(--card)" }}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Command label="Busca global" shouldFilter loop className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-[--border] px-4">
                <Search className="h-4 w-4 shrink-0 text-[--muted-foreground]" />
                <Command.Input
                  autoFocus placeholder="Buscar clientes, OS, aparelhos, técnicos, produtos…"
                  className="h-12 w-full bg-transparent text-sm text-[--foreground] outline-none placeholder:text-[--muted-foreground]"
                />
                <kbd className="hidden shrink-0 rounded border border-[--border] px-1.5 py-0.5 font-mono text-[10px] text-[--muted-foreground] sm:inline">esc</kbd>
              </div>
              <Command.List className="max-h-[52vh] overflow-y-auto p-2">
                <Command.Empty className="py-10 text-center text-sm text-[--muted-foreground]">
                  Nenhum resultado encontrado.
                </Command.Empty>
                {groups.map((g) => (
                  <Command.Group
                    key={g.key} heading={g.key}
                    className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[--muted-foreground]"
                  >
                    {g.items.map((r) => (
                      <Command.Item
                        key={r.id} value={`${r.label} ${r.keywords} ${r.id}`} onSelect={() => go(r)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-[--foreground] data-[selected=true]:bg-[--muted]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--muted]">
                          <g.icon className="h-3.5 w-3.5 text-[--muted-foreground]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{r.label}</span>
                          {r.sub && <span className="block truncate text-xs text-[--muted-foreground]">{r.sub}</span>}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
