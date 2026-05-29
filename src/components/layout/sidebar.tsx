"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Ordens de Serviço",
    href: "/os",
    icon: ClipboardList,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Package,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-[--sidebar] text-[--sidebar-foreground]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[--sidebar-border] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--primary]">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          Fix<span className="text-[#60a5fa]">OS</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[--sidebar-accent] text-white"
                  : "text-[--sidebar-foreground]/70 hover:bg-[--sidebar-accent]/50 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[--sidebar-border] p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[--sidebar-foreground]/70 transition-colors hover:bg-[--sidebar-accent]/50 hover:text-white">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
