"use client"

import { motion } from "motion/react"
import { PERIODS, type PeriodKey } from "@/lib/period"

interface Props {
  value: PeriodKey
  onChange: (k: PeriodKey) => void
  custom: { start: string; end: string }
  onCustomChange: (c: { start: string; end: string }) => void
}

/** Seletor de período em pílulas + campos de data quando "Personalizado". */
export function PeriodFilter({ value, onChange, custom, onCustomChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[--border] bg-[--card] p-1">
        {PERIODS.map((p) => {
          const active = value === p.key
          return (
            <button
              key={p.key}
              onClick={() => onChange(p.key)}
              className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? "text-white" : "text-[--muted-foreground] hover:text-[--foreground]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
            </button>
          )
        })}
      </div>

      {value === "custom" && (
        <motion.div
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-xs"
        >
          <input
            type="date" value={custom.start}
            onChange={(e) => onCustomChange({ ...custom, start: e.target.value })}
            className="rounded-md border border-[--border] bg-[--card] px-2 py-1 text-[--foreground] outline-none focus:border-[--primary]"
          />
          <span className="text-[--muted-foreground]">até</span>
          <input
            type="date" value={custom.end}
            onChange={(e) => onCustomChange({ ...custom, end: e.target.value })}
            className="rounded-md border border-[--border] bg-[--card] px-2 py-1 text-[--foreground] outline-none focus:border-[--primary]"
          />
        </motion.div>
      )}
    </div>
  )
}
