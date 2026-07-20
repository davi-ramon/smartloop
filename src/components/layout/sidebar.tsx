"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Truck,
  Package,
  ShoppingCart,
  Zap,
  BarChart2,
  Shield,
  PieChart,
  Settings,
  Wrench,
  Pin,
  ChevronRight,
  LogOut,
  Bug,
  LayoutGrid,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebar"
import { useAuth } from "@/lib/firebase/auth-context"
// (Removido: import isAdmin - sidebar agora checa profile.role direto)
import { logger } from "@/lib/logger"

const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { label: "Início", href: "/home", icon: LayoutDashboard, exact: true },
      { label: "Ordens de Serviço", href: "/os", icon: ClipboardList },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Técnicos", href: "/tecnicos", icon: UserCog, ownerOnly: true },
      { label: "Fornecedores", href: "/fornecedores", icon: Truck },
    ],
  },
  {
    label: "Vendas",
    items: [
      { label: "PDV", href: "/pdv", icon: ShoppingCart },
      { label: "Orçamento Rápido", href: "/orcamento-rapido", icon: Zap },
      { label: "Estoque", href: "/estoque", icon: Package },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: BarChart2, ownerOnly: true },
      { label: "Garantia", href: "/garantia", icon: Shield },
      { label: "Relatórios", href: "/relatorios", icon: PieChart, ownerOnly: true },
    ],
  },
]

const COLLAPSED_W = 64
const EXPANDED_W = 240

interface NavItemProps {
  label: string
  href: string
  icon: React.ElementType
  isActive: boolean
  isExpanded: boolean
}

function NavItem({ label, href, icon: Icon, isActive, isExpanded }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out hover:translate-x-0.5 active:scale-[0.98]",
        isActive
          ? "bg-[--sidebar-active] text-[--sidebar-active-text]"
          : "text-[--sidebar-foreground] hover:bg-[--sidebar-hover]"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive ? "text-[--sidebar-icon-active]" : "text-[--sidebar-icon]"
        )}
      />
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[--sidebar-icon-active]"
          transition={{ duration: 0.2, ease: "easeInOut" }}
        />
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user, profile } = useAuth()
  // Mostrar grupo Admin apenas para o dono do tenant (nao tecnico).
  // Antes: isAdmin(user?.email) - baseado em allowlist de e-mails (bug: tecnico
  // com e-mail fora da allowlist mas com role=owner via Firestore tbm nao via).
  const showAdmin = profile?.role === "owner"
  const { isPinned, togglePin } = useSidebarStore()
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = isPinned || isHovered

  async function handleLogout() {
    try {
      await logout()
      router.replace("/login")
    } catch (err) {
      logger.error("auth", "falha ao sair", err)
    }
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Overlay backdrop quando expandido mas não fixado — escurece e desfoca o fundo */}
      <AnimatePresence>
        {isExpanded && !isPinned && (
          <motion.div
            className="fixed inset-0 left-16 z-40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsHovered(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-[--sidebar-border]"
        animate={{ width: isExpanded ? EXPANDED_W : COLLAPSED_W }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: "var(--sidebar)",
          boxShadow: isExpanded
            ? "8px 0 40px rgba(2, 6, 23, 0.16)"
            : "1px 0 0 rgba(0,0,0,0.02)",
        }}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[--sidebar-border] px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--primary]">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[15px] font-bold tracking-tight whitespace-nowrap text-[--foreground]"
                >
                  Smart<span className="text-[--primary]">Loop</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={togglePin}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                  isPinned
                    ? "text-[--primary]"
                    : "text-[--sidebar-icon] hover:text-[--sidebar-foreground]"
                )}
                title={isPinned ? "Desafixar sidebar" : "Fixar sidebar"}
              >
                <Pin className={cn("h-3.5 w-3.5", isPinned && "rotate-45")} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              <AnimatePresence>
                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[--muted-foreground] whitespace-nowrap"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {group.items
                  // Filtra itens restritos ao owner quando o usuario for tecnico.
                  .filter((item) => !("ownerOnly" in item && item.ownerOnly) || profile?.role === "owner")
                  .map((item) => (
                  <NavItem
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    isActive={isActive(item.href, item.exact)}
                    isExpanded={isExpanded}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Admin/dev — repositório de relatos (beta) */}
          {showAdmin && (
            <div className="mb-4">
              <AnimatePresence>
                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                    className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[--muted-foreground] whitespace-nowrap"
                  >
                    Admin
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                <NavItem label="Painel" href="/admin" icon={LayoutGrid} isActive={isActive("/admin", true)} isExpanded={isExpanded} />
                <NavItem label="Bio" href="/admin/bio" icon={Globe} isActive={isActive("/admin/bio")} isExpanded={isExpanded} />
                <NavItem label="Relatos (beta)" href="/relatorios-bugs" icon={Bug} isActive={isActive("/relatorios-bugs")} isExpanded={isExpanded} />
              </div>
            </div>
          )}
        </nav>

        {/* Bottom — Settings + Logout */}
        <div className="shrink-0 border-t border-[--sidebar-border] p-2 space-y-0.5">
          {/* Configurações so para owner (tecnico NAO altera nome/logo da loja). */}
          {profile?.role === "owner" && (
            <NavItem
              label="Configurações"
              href="/configuracoes"
              icon={Settings}
              isActive={isActive("/configuracoes")}
              isExpanded={isExpanded}
            />
          )}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair da conta"
            title="Sair"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[--sidebar-foreground] transition-colors duration-150 hover:bg-[--sidebar-hover] hover:text-[--destructive]"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-[--sidebar-icon]" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  )
}
