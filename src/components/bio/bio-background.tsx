"use client"

import * as React from "react"
import type { BioAnimacao } from "@/lib/data/bio"

/**
 * BioBackground — fundo procedural CSS da página /bio.
 *
 * Cinco estilos:
 *  - aurora: 2 blurs coloridos flutuando (default)
 *  - grade:  linhas finas deslizando
 *  - ondas:  conic-gradient rotacionando
 *  - particulas: pontinhos via radial-gradient
 *  - desligado: nada
 *
 * Tudo é CSS puro + transform/opacity → GPU-friendly. pointer-events: none
 * + -z-10 não interfere em cliques. Respeita prefers-reduced-motion.
 */

const SPEED_SECONDS: Record<string, string> = {
  lenta: "40s",
  normal: "20s",
  rapida: "10s",
}

export interface BioBackgroundProps {
  config: BioAnimacao
}

export function BioBackground({ config }: BioBackgroundProps) {
  const style = config.estilo
  if (style === "desligado") return null

  const corPrimaria = config.corPrimaria || "#2563eb"
  const corSecundaria = config.corSecundaria || "#7c3aed"
  const speed = SPEED_SECONDS[config.velocidade] || SPEED_SECONDS.lenta
  const intensity = Math.max(0, Math.min(100, config.intensidade ?? 40))
  const scaleBase = 0.6 + (intensity / 100) * 0.8 // 0.6 a 1.4

  return (
    <div
      aria-hidden="true"
      className="bio-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Gradient base (sempre presente) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 25% 15%, ${corPrimaria}25, transparent 55%), radial-gradient(circle at 80% 85%, ${corSecundaria}25, transparent 55%)`,
        }}
      />

      {style === "aurora" && (
        <>
          <div
            className="bio-blur absolute h-[420px] w-[420px] rounded-full max-sm:blur-2xl"
            style={{
              background: corPrimaria,
              opacity: 0.32,
              top: "-120px",
              left: "-120px",
              animation: `bio-float-1 ${speed} ease-in-out infinite`,
              transform: `scale(${scaleBase})`,
              filter: "blur(64px)",
            }}
          />
          <div
            className="bio-blur absolute h-[520px] w-[520px] rounded-full max-sm:blur-2xl"
            style={{
              background: corSecundaria,
              opacity: 0.22,
              bottom: "-160px",
              right: "-160px",
              animation: `bio-float-2 ${speed} ease-in-out infinite`,
              transform: `scale(${scaleBase * 0.85})`,
              filter: "blur(64px)",
            }}
          />
        </>
      )}

      {style === "grade" && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${corPrimaria} 1px, transparent 1px), linear-gradient(90deg, ${corPrimaria} 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            opacity: 0.18,
            animation: `bio-grid-drift ${speed} linear infinite`,
          }}
        />
      )}

      {style === "ondas" && (
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg, ${corPrimaria}, ${corSecundaria}, ${corPrimaria})`,
            opacity: 0.28,
            animation: `bio-rotate ${speed} linear infinite`,
          }}
        />
      )}

      {style === "particulas" && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${corPrimaria} 1.2px, transparent 1.2px)`,
            backgroundSize: "28px 28px",
            opacity: 0.22,
            animation: `bio-particles-drift ${speed} linear infinite`,
          }}
        />
      )}
    </div>
  )
}