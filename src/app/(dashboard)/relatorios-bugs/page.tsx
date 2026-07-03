"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { useAuth } from "@/lib/firebase/auth-context"
import { isAdmin } from "@/lib/admins"
import {
  watchBugReports, updateBugReportStatus,
  type BugReport, type BugReportStatus,
} from "@/lib/data/bug-reports"
import { relativeTime } from "@/lib/data/service-orders"
import { logger } from "@/lib/logger"
import { Bug, Lightbulb, Paperclip, ShieldAlert, Star } from "lucide-react"

const STATUS_META: Record<BugReportStatus, { label: string; color: string }> = {
  new: { label: "Novo", color: "#ef4444" },
  in_progress: { label: "Em andamento", color: "#f59e0b" },
  resolved: { label: "Resolvido", color: "#10b981" },
}

type Filter = "all" | "bug" | "suggestion"

export default function BugRepositoryPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.email)
  const [reports, setReports] = useState<BugReport[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!admin) return
    logger.info("bugs", "abrindo repositório de relatos (admin)")
    const unsub = watchBugReports(setReports, () => setError(true))
    return () => unsub()
  }, [admin])

  const filtered = useMemo(
    () => (filter === "all" ? reports : reports.filter((r) => r.type === filter)),
    [reports, filter],
  )

  const counts = useMemo(() => ({
    total: reports.length,
    bugs: reports.filter((r) => r.type === "bug").length,
    suggestions: reports.filter((r) => r.type === "suggestion").length,
    novos: reports.filter((r) => r.status === "new").length,
  }), [reports])

  if (!admin) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Relatos" description="Repositório de bugs e sugestões" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <ShieldAlert className="h-10 w-10 text-[--muted-foreground]" />
          <p className="text-sm font-medium text-[--foreground]">Acesso restrito</p>
          <p className="max-w-xs text-xs text-[--muted-foreground]">Esta área é exclusiva para administradores e desenvolvedores do SmartLoop.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Relatos (beta)" description="Bugs e sugestões enviados pelos usuários" />

      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={counts.total} />
          <Stat label="Bugs" value={counts.bugs} color="#ef4444" />
          <Stat label="Sugestões" value={counts.suggestions} color="#f59e0b" />
          <Stat label="Novos" value={counts.novos} color="#2563eb" />
        </div>

        <div className="flex gap-1 rounded-lg border border-[--border] bg-[--card] p-1 w-fit">
          {(["all", "bug", "suggestion"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${filter === f ? "text-white" : "text-[--muted-foreground] hover:text-[--foreground]"}`} style={filter === f ? { backgroundColor: "var(--primary)" } : undefined}>
              {f === "all" ? "Todos" : f === "bug" ? "Bugs" : "Sugestões"}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-[#ef4444]">Falha ao carregar os relatos (verifique se seu e-mail é admin nas rules).</p>}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[--border] py-16 text-center text-sm text-[--muted-foreground]">Nenhum relato ainda.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-xl border border-[--border] bg-[--card] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: r.type === "bug" ? "#ef444418" : "#f59e0b18" }}>
                      {r.type === "bug" ? <Bug className="h-4 w-4" style={{ color: "#ef4444" }} /> : <Lightbulb className="h-4 w-4" style={{ color: "#f59e0b" }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[--foreground]">{r.module}</p>
                      <p className="text-[11px] text-[--muted-foreground]">{r.userName || r.userEmail || "Anônimo"} · {relativeTime(r.createdAt)}</p>
                    </div>
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => updateBugReportStatus(r.id, e.target.value as BugReportStatus).catch(() => {})}
                    className="rounded-md border border-[--border] bg-[--background] px-2 py-1 text-xs font-medium text-[--foreground]"
                    style={{ color: STATUS_META[r.status].color }}
                  >
                    {(["new", "in_progress", "resolved"] as BugReportStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-[--foreground]">{r.description}</p>

                {r.attachments?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-md border border-[--border] px-2 py-1 text-[11px] text-[--primary] hover:underline">
                        <Paperclip className="h-3 w-3" />{a.name.slice(0, 24)}
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 border-t border-[--border] pt-2 text-[11px] text-[--muted-foreground]">
                  {r.rating != null && <span className="flex items-center gap-1"><Star className="h-3 w-3" style={{ color: "#f59e0b" }} fill="#f59e0b" />NPS {r.rating}/10</span>}
                  {r.path && <span className="truncate">rota: {r.path}</span>}
                </div>
                {r.ratingComment && <p className="mt-1 text-[11px] italic text-[--muted-foreground]">&ldquo;{r.ratingComment}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--card] p-4">
      <p className="text-xs text-[--muted-foreground]">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: color ?? "var(--foreground)" }}>{value}</p>
    </div>
  )
}
