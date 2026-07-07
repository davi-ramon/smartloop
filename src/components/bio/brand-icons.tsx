import * as React from "react"

/**
 * BrandIcons — SVGs coloridos estilizados das principais redes sociais.
 *
 * Renderizam em qualquer tamanho via className. Cor de fundo do wrapper
 * (no BioLinkRenderer) deve ser neutra/clara para preservar o contraste
 * das cores da marca.
 *
 * Por que versões estilizadas (não logos oficiais): o projeto depende de
 * lucide-react@1.17 (sem ícones sociais), e baixar SVGs oficiais adiciona
 * dependência externa. Versões estilizadas com as cores reconhecíveis
 * funcionam em links onde o reconhecimento da marca é o ponto.
 */

type IconComp = (props: { className?: string }) => React.ReactElement

const Instagram: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Instagram"
  >
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#feda77" />
        <stop offset="30%" stopColor="#f58529" />
        <stop offset="60%" stopColor="#dd2a7b" />
        <stop offset="100%" stopColor="#8134af" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="#fff" />
  </svg>
)

// TikTok — versão oficial preta: "nota musical" estilizada (forma que lembra
// o logo TikTok) com offsets coloridos ciano + magenta pra criar o efeito
// glitch característico da marca.
const TikTok: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="TikTok"
  >
    {/* Sombra cyan */}
    <path
      d="M11 5v13.5a4.5 4.5 0 1 1-4.5-4.5"
      fill="none"
      stroke="#25F4EE"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-1.2 0)"
    />
    {/* Sombra magenta */}
    <path
      d="M11 5v13.5a4.5 4.5 0 1 1-4.5-4.5"
      fill="none"
      stroke="#FE2C55"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(1.2 0)"
    />
    {/* Curva principal preta (topo do logo) */}
    <path
      d="M12 5v13.5a4.5 4.5 0 1 1-4.5-4.5"
      fill="none"
      stroke="#000"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Haste superior preta — vem do topo até a junção */}
    <path
      d="M12 5c0 3.5 3 6.2 6.5 6.2"
      fill="none"
      stroke="#000"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Acentos coloridos na haste superior */}
    <path
      d="M11.4 5c0 3.5 3 6.2 6.5 6.2"
      fill="none"
      stroke="#FE2C55"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0.8 0)"
      opacity="0.85"
    />
    <path
      d="M12.6 5c0 3.5 3 6.2 6.5 6.2"
      fill="none"
      stroke="#25F4EE"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-0.8 0)"
      opacity="0.85"
    />
  </svg>
)

const Facebook: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Facebook"
  >
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#1877F2" />
    <path
      d="M14.5 22v-7h2.3l.4-3h-2.7V9.8c0-.9.3-1.5 1.5-1.5h1.4V5.6c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.4V12H9.5v3h2.5v7h2.5z"
      fill="#fff"
    />
  </svg>
)

// Google Maps — pin em gota com a letra "G" (estilo oficial).
const GoogleMaps: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Google Maps"
  >
    {/* Pin em gota (vermelho Google) */}
    <path
      d="M12 2c-4.4 0-8 3.6-8 8 0 5.4 7 11.4 7.3 11.6.4.3 1 .3 1.4 0C13 21.4 20 15.4 20 10c0-4.4-3.6-8-8-8z"
      fill="#EA4335"
    />
    {/* Círculo branco interno */}
    <circle cx="12" cy="10" r="3.6" fill="#fff" />
    {/* Letra "G" estilizada (azul Google) */}
    <path
      d="M9.5 10c0-1.4 1.1-2.5 2.5-2.5.7 0 1.3.3 1.7.7l-1 1c-.2-.2-.4-.3-.7-.3-.6 0-1.1.5-1.1 1.1 0 .6.5 1.1 1.1 1.1.4 0 .7-.1.9-.4l-.9-.9 2-.2v1.6c-.5.7-1.3 1.1-2 1.1-1.4 0-2.5-1.1-2.5-2.5z"
      fill="#4285F4"
    />
  </svg>
)

const WhatsApp: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="WhatsApp"
  >
    <circle cx="12" cy="12" r="10" fill="#25D366" />
    <path
      d="M8.3 15.3l-.4 1.4 1.4-.4c1.6.8 3.4.7 4.9-.4 1.5-1 2.2-2.7 2-4.4-.3-1.7-1.5-3-3.2-3.4-1.7-.4-3.4.3-4.4 1.7-1 1.5-1 3.4 0 4.9l-.3.6zm5.2-7c-.2 0-.4 0-.6.1-.2.1-.4.2-.6.4l-.2.4c-.1.2-.1.4 0 .6.1.2.2.4.4.5l.3.2c.2 0 .4 0 .6-.1.2-.1.4-.2.5-.4.1-.2.2-.4.1-.6 0-.2-.1-.4-.3-.5.1-.3 0-.5-.2-.6zm1.5 4.2c-.2-.1-.9-.4-1-.5-.1-.1-.2-.1-.3.1l-.4.5c-.1.1-.2.2-.3.1-.1-.1-.6-.2-1.2-.7-.4-.4-.7-.9-.8-1-.1-.1 0-.2.1-.3.1-.1.1-.2.2-.3.1-.1.1-.2.1-.3 0-.1 0-.2-.1-.3l-.4-1c-.1-.2-.2-.2-.3-.2h-.3c-.1 0-.3 0-.4.1-.2.1-.5.4-.5 1s.4 1.1.5 1.2c.1.1 1 1.6 2.5 2.2.4.2.7.3 1 .4.4.1.8.1 1 .1.3 0 .8-.3.9-.6.1-.3.1-.6.1-.6 0-.1-.1-.2-.3-.3z"
      fill="#fff"
    />
  </svg>
)

const YouTube: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="YouTube"
  >
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF0000" />
    <path d="M10 8.5l6 3.5-6 3.5z" fill="#fff" />
  </svg>
)

const Twitter: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Twitter / X"
  >
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#000" />
    <path
      d="M14 5h2.5l-5.5 6.3L17 19h-5l-3.9-5L3.5 19H1l5.9-6.7L1 5h5.1l3.5 4.6L14 5zm-.9 12.4h1.4L7 6.5H5.5l7.6 10.9z"
      fill="#fff"
    />
  </svg>
)

const LinkedIn: IconComp = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="LinkedIn"
  >
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2" />
    <path
      d="M7 9.5h-2v8h2v-8zm-1-3.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM18 17.5h-2v-3.9c0-1 0-2.2-1.3-2.2s-1.5 1-1.5 2.1v4h-2v-8h1.9v1.1c.3-.5 1-1.2 2.1-1.2 2.3 0 2.7 1.5 2.7 3.5v4.6z"
      fill="#fff"
    />
  </svg>
)

/** Mapa de marca → componente SVG. */
export const BRAND_ICONS: Record<string, IconComp> = {
  Instagram,
  TikTok,
  Facebook,
  "Google Maps": GoogleMaps,
  WhatsApp,
  YouTube,
  Twitter,
  LinkedIn,
}

/** Lista canônica usada pelo editor. Mantém compatibilidade com `icon-list.ts`. */
export const BRAND_ICON_NAMES = Object.keys(BRAND_ICONS)

export function isBrandIcon(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(BRAND_ICONS, name)
}

/** Retorna o componente BrandIcon ou null se não existir. */
export function getBrandIcon(name: string): IconComp | null {
  return BRAND_ICONS[name] ?? null
}