"use client"

import { useId } from "react"
import { motion } from "motion/react"
import type { DayBucket } from "@/lib/period"

/* Gráficos SVG leves, sem dependência externa. Cores via prop (aceita var(--x)). */

interface SeriesProps {
  data: DayBucket[]
  color?: string
  height?: number
  /** Formata o valor no tooltip nativo (title). */
  format?: (v: number) => string
}

const W = 320

/** Área suavizada — ideal para faturamento/movimentação ao longo do período. */
export function AreaChart({ data, color = "var(--primary)", height = 120, format }: SeriesProps) {
  const gid = "area-grad-" + useId().replace(/:/g, "")
  if (!data.length) return <EmptyChart height={height} />
  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? W / (data.length - 1) : W
  const pts = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : W / 2
    const y = height - 8 - (d.value / max) * (height - 24)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
      <motion.path
        d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color}>
          <title>{data[i].label}: {format ? format(data[i].value) : data[i].value}</title>
        </circle>
      ))}
    </svg>
  )
}

/** Barras verticais — ideal para OS por dia / vendas por dia. */
export function BarChart({ data, color = "var(--primary)", height = 120, format }: SeriesProps) {
  if (!data.length) return <EmptyChart height={height} />
  const max = Math.max(1, ...data.map((d) => d.value))
  const gap = 6
  const bw = (W - gap * (data.length - 1)) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 16)
        const x = i * (bw + gap)
        return (
          <motion.rect
            key={i} x={x} width={bw} rx="3" fill={color}
            initial={{ height: 0, y: height }}
            animate={{ height: Math.max(2, h), y: height - Math.max(2, h) }}
            transition={{ duration: 0.5, delay: i * 0.02, ease: "easeOut" }}
          >
            <title>{d.label}: {format ? format(d.value) : d.value}</title>
          </motion.rect>
        )
      })}
    </svg>
  )
}

export interface DonutSegment { label: string; value: number; color: string }

/** Donut de distribuição — ideal para status das OS. */
export function Donut({ segments, size = 140 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
      </svg>
    )
  }

  // Offsets acumulados pré-computados (sem mutação durante o render).
  const active = segments.filter((s) => s.value > 0)
  const arcs = active.map((s, i) => {
    const before = active.slice(0, i).reduce((a, x) => a + x.value, 0)
    return { ...s, dash: (s.value / total) * circ, offset: (before / total) * circ }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} role="img">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth="14" />
      {arcs.map((s, i) => (
        <motion.circle
          key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={-s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          <title>{s.label}: {s.value}</title>
        </motion.circle>
      ))}
      <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[--foreground]" style={{ fontSize: 22, fontWeight: 800 }}>{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="fill-[--muted-foreground]" style={{ fontSize: 10 }}>total</text>
    </svg>
  )
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-xs text-[--muted-foreground]" style={{ height }}>
      Sem dados no período
    </div>
  )
}
