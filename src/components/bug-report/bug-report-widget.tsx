"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import {
  Bug, X, Mic, MicOff, Paperclip, Loader2, CheckCircle2, AlertCircle,
  ChevronLeft, Lightbulb, Send, Star, Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { logger } from "@/lib/logger"
import {
  BUG_MODULES, createBugReport, rateBugReport, uploadBugAttachment,
  type BugReportType, type BugAttachment,
} from "@/lib/data/bug-reports"

/* ── Web Speech API (transcrição gratuita, no navegador) ── */
interface SpeechAlt { transcript: string }
interface SpeechResult { isFinal: boolean; 0: SpeechAlt }
interface SpeechResultList { length: number; [i: number]: SpeechResult }
interface SpeechEvent { resultIndex: number; results: SpeechResultList }
interface SpeechRec {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: (e: SpeechEvent) => void; onend: () => void; onerror: (e: { error?: string }) => void
  start: () => void; stop: () => void
}
type SpeechCtor = new () => SpeechRec

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

function useSpeech(onText: (chunk: string) => void) {
  const [supported] = useState(() => !!getSpeechCtor())
  const [recording, setRecording] = useState(false)
  const recRef = useRef<SpeechRec | null>(null)
  const wantsOnRef = useRef(false)
  const onTextRef = useRef(onText)
  useEffect(() => { onTextRef.current = onText })

  function start() {
    const Ctor = getSpeechCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = true
    rec.onresult = (e) => {
      let finalText = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript
      }
      if (finalText) onTextRef.current(finalText.trim() + " ")
    }
    rec.onend = () => { if (wantsOnRef.current) { try { rec.start() } catch { /* ignora */ } } }
    rec.onerror = (e) => logger.error("bugs", "erro na transcrição de voz", { error: e?.error })
    wantsOnRef.current = true
    recRef.current = rec
    try { rec.start(); setRecording(true); logger.info("bugs", "gravação de voz iniciada") } catch { /* ignora */ }
  }

  function stop() {
    wantsOnRef.current = false
    try { recRef.current?.stop() } catch { /* ignora */ }
    setRecording(false)
    logger.info("bugs", "gravação de voz encerrada")
  }

  useEffect(() => () => { wantsOnRef.current = false; try { recRef.current?.stop() } catch { /* ignora */ } }, [])

  return { supported, recording, start, stop }
}

/* ── Widget ── */
type Step = "type" | "module" | "describe" | "attach" | "rate" | "done"
const MIN_DESC = 90

interface Pending { file: File; preview?: string }

export function BugReportWidget() {
  const { user, profile } = useAuth()
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("type")
  const [type, setType] = useState<BugReportType | null>(null)
  const [moduleName, setModuleName] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<Pending[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [ratingComment, setRatingComment] = useState("")

  const speech = useSpeech((chunk) => setDescription((d) => (d ? d + " " : "") + chunk))

  function openPanel() {
    setOpen(true)
    logger.info("bugs", "painel de reporte aberto", { path: pathname })
  }

  function reset() {
    setStep("type"); setType(null); setModuleName(""); setDescription("")
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview))
    setFiles([]); setError(null); setReportId(null); setRating(null); setRatingComment("")
  }

  function closePanel() {
    if (speech.recording) speech.stop()
    setOpen(false)
    setTimeout(reset, 300)
  }

  function pickType(t: BugReportType) { setType(t); setStep("module") }
  function pickModule(m: string) { setModuleName(m); setStep("describe") }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next: Pending[] = []
    for (const file of Array.from(list).slice(0, 6 - files.length)) {
      next.push({ file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined })
    }
    setFiles((prev) => [...prev, ...next])
    logger.info("bugs", "anexos adicionados", { total: next.length })
  }

  function removeFile(i: number) {
    setFiles((prev) => {
      const f = prev[i]; if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function submit() {
    if (!user) return
    if (speech.recording) speech.stop()
    setSubmitting(true); setError(null)
    try {
      const attachments: BugAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        attachments.push(await uploadBugAttachment(user.uid, files[i].file, i))
      }
      const id = await createBugReport({
        type: type as BugReportType,
        module: moduleName,
        description: description.trim(),
        attachments,
        userId: user.uid,
        userName: profile?.name || "",
        userEmail: user.email || "",
        tenantId: profile?.tenantId || "",
        path: pathname,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      })
      setReportId(id)
      setStep("rate")
    } catch (err) {
      logger.error("bugs", "falha ao enviar relato", err)
      setError("Não foi possível enviar. Verifique a conexão e tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  async function finishRating(skip = false) {
    if (!skip && reportId && rating != null) {
      await rateBugReport(reportId, rating, ratingComment)
    }
    setStep("done")
  }

  const canDescribe = description.trim().length >= MIN_DESC

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        onClick={openPanel}
        aria-label="Reportar bug ou sugestão"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.08, rotate: -6 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-[70] flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: "var(--primary)", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
      >
        <Bug className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePanel}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[90] flex w-full flex-col shadow-2xl sm:w-[440px]"
              style={{ backgroundColor: "var(--card)" }}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between border-b border-[--border] px-5 py-4">
                <div className="flex items-center gap-2">
                  {step !== "type" && step !== "rate" && step !== "done" && (
                    <button onClick={() => setStep(step === "module" ? "type" : step === "describe" ? "module" : "describe")} className="text-[--muted-foreground] hover:text-[--foreground]">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--primary)" }}>
                    <Bug className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[--foreground]">Reportar</span>
                </div>
                <button onClick={closePanel} aria-label="Fechar" className="text-[--muted-foreground] hover:text-[--foreground]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progresso */}
              {step !== "done" && (
                <div className="flex gap-1.5 px-5 pt-3">
                  {(["type", "module", "describe", "attach", "rate"] as Step[]).map((s, i) => {
                    const order = ["type", "module", "describe", "attach", "rate"]
                    const active = order.indexOf(step) >= i
                    return <div key={s} className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: active ? "var(--primary)" : "var(--muted)" }} />
                  })}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  {/* 1. Tipo */}
                  {step === "type" && (
                    <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <h3 className="text-base font-semibold text-[--foreground]">O que você quer reportar?</h3>
                      <p className="mt-1 text-xs text-[--muted-foreground]">Sua colaboração ajuda a melhorar o SmartLoop.</p>
                      <div className="mt-4 grid gap-3">
                        <button onClick={() => pickType("bug")} className="flex items-center gap-3 rounded-xl border border-[--border] p-4 text-left transition-all hover:border-[#ef4444] hover:bg-[#ef4444]/5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#ef444418" }}><Bug className="h-5 w-5" style={{ color: "#ef4444" }} /></div>
                          <div><p className="text-sm font-semibold text-[--foreground]">Um bug</p><p className="text-xs text-[--muted-foreground]">Algo não funcionou como esperado</p></div>
                        </button>
                        <button onClick={() => pickType("suggestion")} className="flex items-center gap-3 rounded-xl border border-[--border] p-4 text-left transition-all hover:border-[#f59e0b] hover:bg-[#f59e0b]/5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#f59e0b18" }}><Lightbulb className="h-5 w-5" style={{ color: "#f59e0b" }} /></div>
                          <div><p className="text-sm font-semibold text-[--foreground]">Uma sugestão</p><p className="text-xs text-[--muted-foreground]">Uma ideia de melhoria</p></div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* 2. Módulo */}
                  {step === "module" && (
                    <motion.div key="module" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <h3 className="text-base font-semibold text-[--foreground]">Onde aconteceu?</h3>
                      <p className="mt-1 text-xs text-[--muted-foreground]">Em qual parte do sistema.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {BUG_MODULES.map((m) => (
                          <button key={m} onClick={() => pickModule(m)} className="rounded-lg border border-[--border] px-3 py-2.5 text-left text-xs font-medium text-[--foreground] transition-all hover:border-[--primary] hover:bg-[--primary]/5">
                            {m}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* 3. Descrição + voz */}
                  {step === "describe" && (
                    <motion.div key="describe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <h3 className="text-base font-semibold text-[--foreground]">Descreva com detalhes</h3>
                      <p className="mt-1 text-xs text-[--muted-foreground]">Digite ou use o microfone para ditar (mín. {MIN_DESC} caracteres).</p>
                      <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        rows={7} placeholder="O que aconteceu? O que você esperava? Passos para reproduzir…"
                        className="mt-3 w-full resize-none rounded-xl border border-[--border] bg-[--background] p-3 text-sm text-[--foreground] outline-none focus:border-[--primary]"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs ${canDescribe ? "text-[#10b981]" : "text-[--muted-foreground]"}`}>{description.trim().length}/{MIN_DESC}</span>
                        {speech.supported ? (
                          <button
                            onClick={() => (speech.recording ? speech.stop() : speech.start())}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${speech.recording ? "bg-[#ef4444] text-white" : "border border-[--border] text-[--foreground] hover:bg-[--muted]"}`}
                          >
                            {speech.recording ? <><MicOff className="h-3.5 w-3.5" /> Parar</> : <><Mic className="h-3.5 w-3.5" /> Ditar por voz</>}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[--muted-foreground]">Voz indisponível neste navegador</span>
                        )}
                      </div>
                      {speech.recording && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#ef4444]">
                          <motion.span className="h-2 w-2 rounded-full bg-[#ef4444]" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                          Gravando… fale e o texto aparece acima. Revise antes de enviar.
                        </div>
                      )}
                      <button
                        onClick={() => setStep("attach")} disabled={!canDescribe}
                        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        Continuar
                      </button>
                    </motion.div>
                  )}

                  {/* 4. Anexos + enviar */}
                  {step === "attach" && (
                    <motion.div key="attach" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <h3 className="text-base font-semibold text-[--foreground]">Anexos (opcional)</h3>
                      <p className="mt-1 text-xs text-[--muted-foreground]">Prints ou arquivos que ajudem a entender.</p>

                      <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[--border] p-6 text-center transition-colors hover:border-[--primary] hover:bg-[--primary]/5">
                        <Paperclip className="h-5 w-5 text-[--muted-foreground]" />
                        <span className="text-xs text-[--muted-foreground]">Toque para escolher (até 6, 10MB cada)</span>
                        <input type="file" multiple accept="image/*,application/pdf,.txt,.log" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                      </label>

                      {files.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {files.map((f, i) => (
                            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[--border] bg-[--muted]">
                              {f.preview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-1 p-1"><Paperclip className="h-4 w-4 text-[--muted-foreground]" /><span className="truncate text-[9px] text-[--muted-foreground]">{f.file.name}</span></div>
                              )}
                              <button onClick={() => removeFile(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {error && <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]"><AlertCircle className="h-3.5 w-3.5" />{error}</div>}

                      <button
                        onClick={submit} disabled={submitting}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar relato</>}
                      </button>
                    </motion.div>
                  )}

                  {/* 5. Avaliação (NPS) */}
                  {step === "rate" && (
                    <motion.div key="rate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#10b981]/10 px-3 py-2 text-xs font-medium text-[#10b981]"><CheckCircle2 className="h-4 w-4" /> Relato enviado! Obrigado.</div>
                      <h3 className="text-base font-semibold text-[--foreground]">De 0 a 10, o quanto você está gostando do SmartLoop?</h3>
                      <div className="mt-4 grid grid-cols-6 gap-1.5">
                        {Array.from({ length: 11 }, (_, n) => (
                          <button key={n} onClick={() => setRating(n)} className={`aspect-square rounded-lg text-sm font-semibold transition-all ${rating === n ? "text-white" : "border border-[--border] text-[--foreground] hover:border-[--primary]"}`} style={rating === n ? { backgroundColor: "var(--primary)" } : undefined}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={ratingComment} onChange={(e) => setRatingComment(e.target.value)}
                        rows={2} placeholder="Quer comentar algo? (opcional)"
                        className="mt-3 w-full resize-none rounded-xl border border-[--border] bg-[--background] p-3 text-sm text-[--foreground] outline-none focus:border-[--primary]"
                      />
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => finishRating(true)} className="flex-1 rounded-xl border border-[--border] py-3 text-sm font-medium text-[--muted-foreground] hover:bg-[--muted]">Pular</button>
                        <button onClick={() => finishRating(false)} disabled={rating == null} className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40" style={{ backgroundColor: "var(--primary)" }}>Finalizar</button>
                      </div>
                    </motion.div>
                  )}

                  {/* 6. Concluído */}
                  {step === "done" && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#10b98118" }}>
                        <Star className="h-8 w-8" style={{ color: "#10b981" }} fill="#10b981" />
                      </motion.div>
                      <h3 className="mt-4 text-lg font-bold text-[--foreground]">Valeu pela colaboração!</h3>
                      <p className="mt-1 text-sm text-[--muted-foreground]">Seu relato foi registrado e a equipe já foi avisada.</p>
                      <button onClick={closePanel} className="mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--primary)" }}>Fechar</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
