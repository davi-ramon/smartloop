"use client"

import * as React from "react"
import { motion } from "motion/react"
import * as Icons from "lucide-react"
import { ExternalLink, Link as LinkIcon, User } from "lucide-react"
import type { BioLink, BioTextStyle } from "@/lib/data/bio"
import { getBrandIcon } from "./brand-icons"
import { cn } from "@/lib/utils"

/**
 * Renderizador único de link da página /bio. Usado pela página pública
 * e pelo preview do editor — mesma JSX garante mesma aparência.
 *
 * Tamanhos:
 *   curto  → botão compacto (h-11), ícone opcional + título
 *   medio  → botão maior (h-14+) com título + subtítulo
 *   grande → card com imagem (1:1 ou 16:9) + overlay de título
 *
 * Ícones:
 *   - BrandIcons (Instagram, TikTok, etc) → renderizados dentro de wrapper
 *     quadrado com fundo branco para preservar as cores oficiais.
 *   - Lucide genérico → com `style color: fg` para acompanhar textStyle.
 *
 * `onClick` é opcional: a página pública passa para abrir nova aba
 * e disparar tracking; o editor não passa (preview estático).
 */

const TEXT_COLORS: Record<BioTextStyle, string> = {
  light: "#ffffff",
  dark: "#0f172a",
}

/** Resolve o ícone: primeiro BrandIcons, depois lucide. */
function resolveIcon(name: string | undefined): { kind: "brand" | "lucide"; Comp: React.ElementType } | null {
  if (!name) return null
  const brand = getBrandIcon(name)
  if (brand) return { kind: "brand", Comp: brand as unknown as React.ElementType }
  const lucide = (Icons as unknown as Record<string, React.ElementType | undefined>)[name] || LinkIcon
  return { kind: "lucide", Comp: lucide }
}

export interface BioLinkRendererProps {
  link: BioLink
  index: number
  onClick?: (e: React.MouseEvent, link: BioLink) => void
  primary: string
  textStyle: BioTextStyle
  /** Desligar animação de entrada (default: ligada). */
  animate?: boolean
  className?: string
}

export function BioLinkRenderer({
  link,
  index,
  onClick,
  primary,
  textStyle,
  animate = true,
  className,
}: BioLinkRendererProps) {
  const fg = TEXT_COLORS[textStyle]
  const icon = resolveIcon(link.icone)

  const motionProps = {
    initial: animate ? { opacity: 0, y: 8 } : false,
    animate: animate ? { opacity: 1, y: 0 } : false,
    transition: animate ? { delay: index * 0.06, duration: 0.3, ease: "easeOut" as const } : undefined,
    whileHover: onClick ? { y: -2, scale: 1.02 } : undefined,
    whileTap: onClick ? { scale: 0.98 } : undefined,
  } as React.ComponentProps<typeof motion.a>

  if (link.tamanho === "grande" && link.imagemUrl) {
    return renderGrande(link, motionProps, className)
  }
  return renderBotao(link, index, motionProps, icon, fg, primary, onClick, className)
}

/** Wrapper de ícone: prioriza link.iconeUrl (URL externa) > brand/lucide. */
function LinkIconSlot({
  link,
  icon,
  isMedium,
  fg,
}: {
  link: BioLink
  icon: ReturnType<typeof resolveIcon>
  isMedium: boolean
  fg: string
}) {
  const Icon = icon?.Comp ?? null
  const isBrand = icon?.kind === "brand"

  // Tem URL externa? Tenta usar; se quebrar, fallback pro icon do brand/lucide.
  if (link.iconeUrl) {
    return <CustomIcon url={link.iconeUrl} Fallback={Icon} isMedium={isMedium} fg={fg} linkTitle={link.titulo} />
  }
  if (!Icon) {
    return isMedium ? (
      <User className="h-5 w-5 shrink-0" style={{ color: fg, opacity: 0.7 }} />
    ) : null
  }
  if (isBrand) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-white",
          isMedium ? "h-7 w-7" : "h-6 w-6",
        )}
        aria-hidden="true"
      >
        <Icon className={cn(isMedium ? "h-5 w-5" : "h-4 w-4")} />
      </span>
    )
  }
  return (
    <Icon
      className={cn("shrink-0", isMedium ? "h-5 w-5" : "h-4 w-4")}
      style={{ color: fg }}
    />
  )
}

function CustomIcon({
  url,
  Fallback,
  isMedium,
  fg,
  linkTitle,
}: {
  url: string
  Fallback: React.ElementType | null
  isMedium: boolean
  fg: string
  linkTitle: string
}) {
  const [broken, setBroken] = React.useState(false)
  if (broken && Fallback) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-white",
          isMedium ? "h-7 w-7" : "h-6 w-6",
        )}
        aria-hidden="true"
      >
        <Fallback className={cn(isMedium ? "h-5 w-5" : "h-4 w-4")} />
      </span>
    )
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-white",
        isMedium ? "h-7 w-7" : "h-6 w-6",
      )}
      aria-hidden="true"
    >
      <img
        src={url}
        alt={linkTitle}
        className={cn("object-contain", isMedium ? "h-5 w-5" : "h-4 w-4")}
        loading="lazy"
        onError={() => {
          // Fallback silencioso — usa o ícone nativo se URL quebrar.
          if (typeof console !== "undefined") {
            console.warn(`[SmartLoop][bio] ícone custom quebrou para "${linkTitle}"`)
          }
          setBroken(true)
        }}
      />
    </span>
  )
}

function renderBotao(
  link: BioLink,
  index: number,
  motionProps: React.ComponentProps<typeof motion.a>,
  icon: ReturnType<typeof resolveIcon>,
  fg: string,
  bg: string,
  onClick: BioLinkRendererProps["onClick"],
  className: string | undefined,
) {
  const isMedium = link.tamanho === "medio"

  return (
    <motion.a
      key={`${link.id}-${index}`}
      href={link.url}
      target={onClick ? "_blank" : undefined}
      rel={onClick ? "noopener noreferrer" : undefined}
      onClick={onClick ? (e) => onClick(e, link) : undefined}
      {...motionProps}
      className={cn(
        "block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary] rounded-2xl",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border shadow-md transition-shadow hover:shadow-lg",
          isMedium ? "min-h-[56px] px-4 py-2.5" : "h-11 px-3.5",
        )}
        style={{ backgroundColor: bg, color: fg, borderColor: "rgba(0,0,0,0.05)" }}
      >
        <LinkIconSlot link={link} icon={icon} isMedium={isMedium} fg={fg} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{link.titulo}</div>
          {isMedium && link.subtitulo && (
            <div className="truncate text-xs opacity-80">{link.subtitulo}</div>
          )}
        </div>
        {onClick && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" style={{ color: fg }} />}
      </div>
    </motion.a>
  )
}

function renderGrande(
  link: BioLink,
  motionProps: React.ComponentProps<typeof motion.a>,
  className: string | undefined,
) {
  const aspect = link.aspectRatio === "16:9" ? "16 / 9" : "1 / 1"
  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      {...motionProps}
      className={cn(
        "block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary] rounded-2xl",
        className,
      )}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-md"
        style={{ aspectRatio: aspect, backgroundColor: link.imagemUrl ? "transparent" : "var(--muted)" }}
      >
        {link.imagemUrl ? (
          <img src={link.imagemUrl} alt={link.titulo} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[--muted-foreground]">
            {link.titulo}
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 px-4 py-3 text-sm font-semibold"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.6))",
            color: "#fff",
          }}
        >
          <span className="line-clamp-2">{link.titulo}</span>
          {link.subtitulo && (
            <span className="mt-0.5 block text-xs font-normal opacity-90 line-clamp-1">{link.subtitulo}</span>
          )}
        </div>
      </div>
    </motion.a>
  )
}