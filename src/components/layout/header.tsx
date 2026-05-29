"use client"

import { Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function Header({ title, action }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[--border] bg-[--background] px-6">
      <h1 className="text-xl font-semibold text-[--foreground]">{title}</h1>

      <div className="flex items-center gap-3">
        {action && (
          <Button size="sm" asChild={!!action.href}>
            {action.href ? (
              <a href={action.href}>
                <Plus className="h-4 w-4" />
                {action.label}
              </a>
            ) : (
              <span onClick={action.onClick}>
                <Plus className="h-4 w-4" />
                {action.label}
              </span>
            )}
          </Button>
        )}

        <button className="relative rounded-md p-2 text-[--muted-foreground] hover:bg-[--secondary] hover:text-[--foreground]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[--accent]" />
        </button>

        {/* Avatar do usuário */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--primary] text-sm font-medium text-white">
          P
        </div>
      </div>
    </header>
  )
}
