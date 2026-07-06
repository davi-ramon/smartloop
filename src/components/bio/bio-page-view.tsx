"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { User } from "lucide-react"
import type { BioLink, BioProfile } from "@/lib/data/bio"
import { BioLinkRenderer } from "./bio-link-renderer"

export interface BioPageViewProps {
  profile: BioProfile
  links: BioLink[]
  /** Handler de clique (página pública). Editor passa undefined. */
  onLinkClick?: (e: React.MouseEvent, link: BioLink) => void
  /** Esconde a capa quando true (útil no editor no mobile). */
  hideCover?: boolean
  className?: string
}

/**
 * Renderiza a página inteira do /bio. Compartilhado com o editor (preview).
 *
 * Background calculado:
 *   gradient → linear-gradient(160deg, primary, color-mix(...))
 *   solid    → primary
 *
 * Cor do texto (fg) vem do `textStyle` (`dark` = #0f172a, `light` = #fff).
 */
export function BioPageView({
  profile,
  links,
  onLinkClick,
  hideCover,
  className,
}: BioPageViewProps) {
  const sorted = [...links].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  const active = sorted.filter((l) => l.ativo !== false)
  const fg = profile.textStyle === "light" ? "#ffffff" : "#0f172a"

  const bgStyle =
    profile.bgStyle === "gradient"
      ? {
          background: `linear-gradient(160deg, ${profile.primary}, color-mix(in oklab, ${profile.primary} 60%, #7c3aed))`,
          color: fg,
        }
      : { backgroundColor: profile.primary, color: fg }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
      style={bgStyle}
    >
      {!hideCover && profile.coverUrl && (
        <div className="h-40 sm:h-48 w-full overflow-hidden">
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className={`mx-auto max-w-md px-5 ${profile.coverUrl && !hideCover ? "pt-12 sm:pt-14" : "pt-10"} pb-10`}>
        {/* Avatar sobreposto à capa */}
        {(!hideCover || profile.logoUrl) && (
          <div className={`flex justify-center ${profile.coverUrl && !hideCover ? "-mt-16 sm:-mt-20" : ""} mb-4`}>
            <div
              className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-4 shadow-xl"
              style={{ borderColor: "var(--card)" }}
            >
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.titulo} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[--muted]">
                  <User className="h-10 w-10 text-[--muted-foreground]" />
                </div>
              )}
            </div>
          </div>
        )}

        <h1 className="text-center text-xl font-bold">{profile.titulo}</h1>
        {profile.descricao && (
          <p className="mt-1 text-center text-sm opacity-80">{profile.descricao}</p>
        )}

        <ul className="mt-8 space-y-3">
          <AnimatePresence mode="popLayout">
            {active.map((link, i) => (
              <li key={link.id}>
                <BioLinkRenderer
                  link={link}
                  index={i}
                  onClick={onLinkClick}
                  primary={profile.primary}
                  textStyle={profile.textStyle}
                />
              </li>
            ))}
          </AnimatePresence>
        </ul>

        {active.length === 0 && (
          <p className="mt-12 text-center text-sm opacity-70">
            Nenhum link publicado ainda.
          </p>
        )}

        {profile.rodape && (
          <p className="mt-12 text-center text-xs opacity-60">{profile.rodape}</p>
        )}
      </div>
    </motion.div>
  )
}