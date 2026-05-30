"use client"

import { Bell, Search, Moon, Sun, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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
  const [isDark, setIsDark] = useState(false)

  function toggleTheme() {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[--border] bg-[--background]/95 backdrop-blur-sm px-6 gap-4">
      {/* Left */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-[15px] font-semibold text-[--foreground] leading-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[--muted-foreground] mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <button className="flex items-center gap-2 h-8 rounded-lg border border-[--border] bg-[--muted] px-3 text-sm text-[--muted-foreground] hover:border-[--ring] hover:text-[--foreground] transition-colors min-w-[160px] md:min-w-[200px]">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-[--border] bg-[--background] px-1 font-mono text-[10px] text-[--muted-foreground]">
            ⌘K
          </kbd>
        </button>

        {/* Action CTA */}
        {action && (
          <Button size="sm" asChild={!!action.href} onClick={action.onClick}>
            {action.href ? (
              <a href={action.href} className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {action.label}
              </a>
            ) : (
              <span className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {action.label}
              </span>
            )}
          </Button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground] transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[--accent]" />
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[--primary] to-[#1d4ed8] text-xs font-bold text-white ring-2 ring-offset-1 ring-offset-[--background] ring-[--border] hover:ring-[--primary] transition-all">
          P
        </div>
      </div>
    </header>
  )
}
