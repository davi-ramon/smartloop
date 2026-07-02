"use client"

import { Search, Moon, Sun, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-context"
import { GlobalSearch } from "@/components/layout/global-search"
import { Notifications } from "@/components/layout/notifications"

interface HeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function Header({ title, description, action }: HeaderProps) {
  const { profile, user } = useAuth()
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  )
  const [searchOpen, setSearchOpen] = useState(false)

  const initial = (profile?.name?.trim()?.[0] || user?.email?.[0] || "S").toUpperCase()

  // Atalho global ⌘K / Ctrl+K para abrir a busca.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-[--border] bg-[--background]/95 px-6 backdrop-blur-sm">
        {/* Left — título */}
        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-[--foreground]">{title}</h1>
          {description && <p className="mt-0.5 truncate text-xs text-[--muted-foreground]">{description}</p>}
        </div>

        {/* Center — busca global */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="group flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-[--border] bg-[--muted] px-3 text-sm text-[--muted-foreground] transition-all hover:border-[--ring] hover:bg-[--card] hover:text-[--foreground] focus-visible:ring-2 focus-visible:ring-[--primary]"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left text-xs">Buscar clientes, OS, aparelhos…</span>
            <kbd className="hidden h-4 items-center gap-0.5 rounded border border-[--border] bg-[--background] px-1 font-mono text-[10px] text-[--muted-foreground] sm:inline-flex">⌘K</kbd>
          </button>
        </div>

        {/* Right — ações */}
        <div className="flex shrink-0 items-center gap-2">
          {action && (
            <Button size="sm" asChild={!!action.href} onClick={action.onClick}>
              {action.href ? (
                <a href={action.href} className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />{action.label}</a>
              ) : (
                <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />{action.label}</span>
              )}
            </Button>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Notifications />

          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[--primary] to-[#1d4ed8] text-xs font-bold text-white ring-2 ring-[--border] ring-offset-1 ring-offset-[--background] transition-all hover:ring-[--primary]">
            {initial}
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
