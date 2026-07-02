import type { Timestamp } from "firebase/firestore"

export type PeriodKey = "today" | "7d" | "14d" | "30d" | "60d" | "90d" | "all" | "custom"

export interface PeriodRange {
  /** Início do intervalo em ms epoch (null = sem limite inferior). */
  start: number | null
  /** Fim do intervalo em ms epoch (null = agora/sem limite superior). */
  end: number | null
}

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "14d", label: "14 dias" },
  { key: "30d", label: "30 dias" },
  { key: "60d", label: "60 dias" },
  { key: "90d", label: "90 dias" },
  { key: "all", label: "Tudo" },
  { key: "custom", label: "Personalizado" },
]

const DAY = 86_400_000

/** Converte uma chave de período em um intervalo concreto de ms epoch. */
export function rangeFor(key: PeriodKey, custom?: { start?: string; end?: string }): PeriodRange {
  const now = Date.now()
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)

  switch (key) {
    case "today": return { start: startOfToday.getTime(), end: now }
    case "7d": return { start: now - 7 * DAY, end: now }
    case "14d": return { start: now - 14 * DAY, end: now }
    case "30d": return { start: now - 30 * DAY, end: now }
    case "60d": return { start: now - 60 * DAY, end: now }
    case "90d": return { start: now - 90 * DAY, end: now }
    case "all": return { start: null, end: null }
    case "custom": {
      const s = custom?.start ? new Date(custom.start + "T00:00:00").getTime() : null
      const e = custom?.end ? new Date(custom.end + "T23:59:59").getTime() : now
      return { start: s, end: e }
    }
  }
}

/** Número de dias que o intervalo cobre (para bucketização de gráficos). */
export function daysInRange(range: PeriodRange, fallback = 30): number {
  if (range.start == null) return fallback
  const end = range.end ?? Date.now()
  return Math.max(1, Math.ceil((end - range.start) / DAY))
}

function toMs(ts?: Timestamp | null): number | null {
  if (!ts?.toDate) return null
  return ts.toDate().getTime()
}

/** Verdadeiro se o Timestamp cai dentro do intervalo (limites null = abertos). */
export function isWithin(ts: Timestamp | null | undefined, range: PeriodRange): boolean {
  const ms = toMs(ts)
  if (ms == null) return false
  if (range.start != null && ms < range.start) return false
  if (range.end != null && ms > range.end) return false
  return true
}

export interface DayBucket { label: string; ms: number; value: number }

/**
 * Distribui registros em buckets diários dentro do intervalo, somando `pick`.
 * Retorna no máximo ~14 rótulos legíveis (agrupa quando o período é longo).
 */
export function bucketByDay<T>(
  items: T[],
  getTs: (item: T) => Timestamp | null | undefined,
  pick: (item: T) => number,
  range: PeriodRange,
): DayBucket[] {
  const end = range.end ?? Date.now()
  const start = range.start ?? (end - 30 * DAY)
  const totalDays = Math.max(1, Math.ceil((end - start) / DAY))
  const step = Math.max(1, Math.ceil(totalDays / 14)) // no máx. ~14 colunas
  const buckets: DayBucket[] = []
  for (let d = 0; d < totalDays; d += step) {
    const bStart = start + d * DAY
    buckets.push({
      ms: bStart,
      label: new Date(bStart).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: 0,
    })
  }
  for (const it of items) {
    const ms = toMs(getTs(it))
    if (ms == null || ms < start || ms > end) continue
    const idx = Math.min(buckets.length - 1, Math.floor((ms - start) / DAY / step))
    buckets[idx].value += pick(it)
  }
  return buckets
}
