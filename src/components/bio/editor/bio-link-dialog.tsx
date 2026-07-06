"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import * as Icons from "lucide-react"
import { motion } from "motion/react"
import {
  Loader2, Search, Upload, X as XIcon, Check, ChevronDown,
} from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { uploadBioAsset, type BioAspectRatio, type BioLink, type BioTamanho } from "@/lib/data/bio"
import { BIO_ICON_OPTIONS } from "./icon-list"

const schema = z.object({
  titulo: z.string().min(1, "Obrigatório").max(40, "Máximo 40"),
  subtitulo: z.string().max(80, "Máximo 80").optional().or(z.literal("")),
  url: z
    .string()
    .max(500, "Máximo 500")
    .regex(/^https?:\/\//, "Use http ou https"),
  icone: z.string().min(1, "Escolha um ícone"),
  tamanho: z.enum(["curto", "medio", "grande"]),
  aspectRatio: z.enum(["1:1", "16:9"]).optional(),
  imagemUrl: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.tamanho === "grande" && !data.imagemUrl) {
    ctx.addIssue({
      path: ["imagemUrl"],
      code: z.ZodIssueCode.custom,
      message: "Imagem obrigatória para tamanho grande",
    })
  }
})
type FormData = z.infer<typeof schema>

export interface BioLinkDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Partial<BioLink>
  onSave: (data: Omit<BioLink, "id" | "createdAt" | "updatedAt" | "ordem">) => void
}

export function BioLinkDialog({ open, onOpenChange, initial, onSave }: BioLinkDialogProps) {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: initial?.titulo ?? "",
      subtitulo: initial?.subtitulo ?? "",
      url: initial?.url ?? "",
      icone: initial?.icone ?? "Link",
      tamanho: (initial?.tamanho as BioTamanho) ?? "curto",
      aspectRatio: (initial?.aspectRatio as BioAspectRatio) ?? "1:1",
      imagemUrl: initial?.imagemUrl ?? "",
    },
    mode: "onChange",
  })

  const tamanho = watch("tamanho")
  const icone = watch("icone")
  const imagemUrl = watch("imagemUrl")

  React.useEffect(() => {
    if (tamanho !== "grande") setValue("aspectRatio", undefined)
  }, [tamanho, setValue])

  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadBioAsset(file, "cover")
      setValue("imagemUrl", url, { shouldDirty: true, shouldValidate: true })
      if (tamanho !== "grande") setValue("tamanho", "grande", { shouldDirty: true, shouldValidate: true })
    } catch (err) {
      logger.error("bio", "upload imagem do link falhou", err)
      setUploadError("Falha no envio. Verifique tamanho (até 5MB) e tente novamente.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function onSubmit(data: FormData) {
    // Constrói payload omitindo campos opcionais não preenchidos — o Firestore
    // rejeita `undefined` (Unsupported field value: undefined).
    const payload: Omit<BioLink, "id" | "createdAt" | "updatedAt" | "ordem"> = {
      titulo: data.titulo.trim(),
      url: data.url.trim(),
      icone: data.icone,
      tamanho: data.tamanho,
      ativo: initial?.ativo ?? true,
    }
    const subt = data.subtitulo?.trim()
    if (subt) payload.subtitulo = subt
    if (data.tamanho === "grande") {
      payload.aspectRatio = data.aspectRatio ?? "1:1"
      if (data.imagemUrl) payload.imagemUrl = data.imagemUrl
    }
    onSave(payload)
    onOpenChange(false)
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent drawerOnMobile className="sm:max-w-lg">
        <DialogTitle>{initial?.id ? "Editar link" : "Novo link"}</DialogTitle>
        <DialogDescription>
          Configure o link que aparece na sua página pública.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <FormRow label="Título" htmlFor="titulo" error={errors.titulo?.message}>
            <Input id="titulo" placeholder="Ex.: Falar no WhatsApp" {...register("titulo")} />
          </FormRow>

          <FormRow label="Subtítulo" htmlFor="subtitulo" hint="Opcional" error={errors.subtitulo?.message}>
            <Input id="subtitulo" placeholder="Atendimento humano, sem custo" {...register("subtitulo")} />
          </FormRow>

          <FormRow label="URL" htmlFor="url" error={errors.url?.message}>
            <Input id="url" placeholder="https://..." {...register("url")} />
          </FormRow>

          <FormRow label="Ícone" htmlFor="icone-trigger" error={errors.icone?.message}>
            <IconPicker
              value={icone}
              onChange={(v) => setValue("icone", v, { shouldDirty: true, shouldValidate: true })}
            />
          </FormRow>

          <FormRow label="Tamanho" error={errors.tamanho?.message}>
            <Segmented<BioTamanho>
              value={tamanho}
              options={[
                { value: "curto", label: "Curto" },
                { value: "medio", label: "Médio" },
                { value: "grande", label: "Grande" },
              ]}
              onChange={(v) => setValue("tamanho", v, { shouldDirty: true, shouldValidate: true })}
            />
          </FormRow>

          {tamanho === "grande" && (
            <>
              <FormRow label="Proporção da imagem" error={errors.aspectRatio?.message}>
                <Segmented<BioAspectRatio>
                  value={watch("aspectRatio") ?? "1:1"}
                  options={[
                    { value: "1:1", label: "1:1" },
                    { value: "16:9", label: "16:9" },
                  ]}
                  onChange={(v) => setValue("aspectRatio", v, { shouldDirty: true, shouldValidate: true })}
                />
              </FormRow>
              <FormRow
                label="Imagem"
                htmlFor="imagemUrl-input"
                error={errors.imagemUrl?.message ?? uploadError ?? undefined}
              >
                <div className="flex gap-2">
                  <Input
                    id="imagemUrl-input"
                    placeholder="https://..."
                    {...register("imagemUrl")}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="hidden sm:inline">Enviar</span>
                  </Button>
                </div>
                {imagemUrl && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#6b7280]">
                    <img src={imagemUrl} alt="" className="h-12 w-20 rounded-md border border-[--border] object-cover" />
                    <button
                      type="button"
                      onClick={() => setValue("imagemUrl", "", { shouldDirty: true, shouldValidate: true })}
                      className="flex items-center gap-1 hover:text-[#111827]"
                    >
                      <XIcon className="h-3 w-3" /> Remover
                    </button>
                  </div>
                )}
              </FormRow>
            </>
          )}

          <div className="mt-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              className="text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

/* ─────────── helpers locais ─────────── */

interface FormRowProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: React.ReactNode
}
function FormRow({ label, htmlFor, hint, error, children }: FormRowProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-[#111827] dark:text-[#f8fafc]">{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-[#ef4444]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">{hint}</p>
      ) : null}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}
function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex w-full rounded-lg border border-[#e5e7eb] dark:border-[#334155] bg-[#f9fafb] dark:bg-[#0f172a] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === o.value
              ? "text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f8fafc]",
          )}
          style={value === o.value ? { backgroundColor: "var(--primary)" } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * IconPicker — usa Radix Popover (Portal) para o dropdown não ser cortado
 * pelo DialogContent. Animação motion fade+slide na entrada/saída.
 */
interface IconPickerProps {
  value: string
  onChange: (v: string) => void
}
function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = React.useState("")
  const filtered = React.useMemo(
    () => BIO_ICON_OPTIONS.filter((n) => n.toLowerCase().includes(query.toLowerCase())),
    [query],
  )
  const Current = ((Icons as unknown) as Record<string, React.ElementType | undefined>)[value] || Icons.Link

  return (
    <Popover.Root onOpenChange={(o) => { if (!o) setQuery("") }}>
      <Popover.Trigger asChild>
        <button
          id="icone-trigger"
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md border border-[#e5e7eb] dark:border-[#334155] bg-[#f9fafb] dark:bg-[#1e293b] px-3 py-2 text-sm text-[#111827] dark:text-[#f8fafc] hover:border-[#9ca3af] dark:hover:border-[#475569]"
        >
          <span className="flex items-center gap-2">
            <Current className="h-4 w-4" />
            {value}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#6b7280] dark:text-[#94a3b8]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[100] w-[var(--radix-popover-trigger-width)] rounded-md border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#0f172a] shadow-xl focus:outline-none"
          onOpenAutoFocus={(e) => { e.preventDefault(); /* mantém o input focado no form */ }}
        >
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14 }}
          >
            <div className="flex items-center gap-2 border-b border-[#e5e7eb] dark:border-[#334155] px-3 py-2">
              <Search className="h-3.5 w-3.5 text-[#6b7280] dark:text-[#94a3b8]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ícone..."
                className="w-full bg-transparent text-sm text-[#111827] dark:text-[#f8fafc] outline-none placeholder:text-[#9ca3af] dark:placeholder:text-[#64748b]"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-[#6b7280] dark:text-[#94a3b8]">Nenhum ícone encontrado.</li>
              ) : filtered.map((name) => {
                const Ico = ((Icons as unknown) as Record<string, React.ElementType | undefined>)[name] || Icons.Link
                const active = name === value
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => onChange(name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs",
                        active
                          ? "bg-[#eff6ff] text-[#1d4ed8] dark:bg-[#1e3a8a] dark:text-[#bfdbfe]"
                          : "text-[#111827] hover:bg-[#f3f4f6] dark:text-[#f8fafc] dark:hover:bg-[#1e293b]",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Ico className="h-3.5 w-3.5" /> {name}
                      </span>
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}