"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { User } from "lucide-react"
import type { BioLink, BioProfile } from "@/lib/data/bio"
import { BioLinkRenderer } from "./bio-link-renderer"
import { BioBackground } from "./bio-background"

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
 * Composição (top→bottom):
 *  1. Capa (cover) opcional — full-width
 *  2. Frase do topo (fraseTopo) — entre capa e avatar
 *  3. Avatar circular 2× maior (128px mobile, 160px desktop), metade sobre a capa
 *  4. Título + descrição
 *  5. Lista de links (curto/médio/grande)
 *  6. Rodapé
 *
 * Background:
 *  - Gradiente/sólido (do perfil)
 *  - + BioBackground CSS procedural (camada -z-10 por trás de tudo)
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

  // Quando a animação procedural está ativa, o fundo da página fica
  // TRANSPARENTE — assim a animação (que está em -z-10) brilha por trás.
  // Caso contrário (animacao "desligado"), usamos o gradient/solid do perfil.
  const animEstilo = profile.animacao?.estilo ?? "desligado"
  const showAnimBg = animEstilo !== "desligado"

  // Gradient/solid como FALLBACK (degrade bonito) sob/blended com a animação.
  // Aplicamos como fundo mesmo com animação ligada — fica por trás da camada
  // animada em z=-10, criando profundidade.
  const bgStyle = showAnimBg
    ? {
        // Fundo só com gradient bem sutil (alpha 0.85) pra leitura confortável
        background: profile.bgStyle === "gradient"
          ? `linear-gradient(160deg, ${profile.primary}d0, color-mix(in oklab, ${profile.primary} 60%, #7c3aed)d0)`
          : `${profile.primary}d0`,
        color: fg,
      }
    : profile.bgStyle === "gradient"
      ? {
          background: `linear-gradient(160deg, ${profile.primary}, color-mix(in oklab, ${profile.primary} 60%, #7c3aed))`,
          color: fg,
        }
      : { backgroundColor: profile.primary, color: fg }

  return (
    <div className="relative">
      {/* Animação procedural CSS — sempre em fixed inset-0 z=-10, atrás de tudo.
          Quando a animação está ligada, o conteúdo fica transparente por cima. */}
      {profile.animacao && <BioBackground config={profile.animacao} />}

      {/* Camada de fallback SUTIL acima da animação — um gradient/solid
          com alpha 0.88 que dá leitura confortável + tom da marca. */}
      {showAnimBg && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[-5]"
          style={bgStyle}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={className}
        style={showAnimBg ? { backgroundColor: "transparent" } : bgStyle}
      >
        {!hideCover && profile.coverUrl && (
          <div className="relative h-44 sm:h-56 w-full overflow-hidden">
            <img
              src={profile.coverUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        )}

        <div
          className={`mx-auto max-w-md px-5 ${profile.coverUrl && !hideCover ? "pt-10 sm:pt-14" : "pt-10"} pb-12`}
        >
          {/* Frase do topo (entre capa e avatar) */}
          {profile.fraseTopo && !hideCover && (
            <p
              className="mb-3 text-center text-sm font-medium opacity-90"
              style={{ color: fg }}
            >
              {profile.fraseTopo}
            </p>
          )}

          {/* Avatar sobreposto à capa — 2× maior (128px mobile, 160px desktop).
              Z-index alto (z-10) para garantir que fica acima da capa. */}
          {(!hideCover || profile.logoUrl) && (
            <div className={`relative z-10 flex justify-center ${profile.coverUrl && !hideCover ? "-mt-20 sm:-mt-24" : ""} mb-4`}>
              <div
                className="relative h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full border-[6px] shadow-2xl"
                style={{
                  // Borda SEMPRE branca sólida — fica consistente
                  // independente do fundo (sólido, gradient ou animado).
                  borderColor: "#ffffff",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
                }}
              >
                {/* Fundo branco interno garante visibilidade se logoUrl falhar
                    ou se a imagem tiver areas transparentes. */}
                <div className="absolute inset-0 rounded-full bg-white" />
                <div className="relative h-full w-full">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={profile.titulo}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[--muted]">
                      <User className="h-14 w-14 text-[--muted-foreground]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <h1 className="text-center text-2xl font-bold">{profile.titulo}</h1>
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
    </div>
  )
}