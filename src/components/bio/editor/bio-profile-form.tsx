"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, X as XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { uploadBioAsset, type BioProfile } from "@/lib/data/bio"

const schema = z.object({
  titulo: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60"),
  descricao: z.string().max(240, "Máximo 240").optional().or(z.literal("")),
  rodape: z.string().max(80, "Máximo 80").optional().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),
})
type FormData = z.infer<typeof schema>

export interface BioProfileFormProps {
  value: BioProfile
  onChange: (patch: Partial<BioProfile>) => void
}

export function BioProfileForm({ value, onChange }: BioProfileFormProps) {
  const { register, watch, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: value.titulo,
      descricao: value.descricao ?? "",
      rodape: value.rodape ?? "",
      logoUrl: value.logoUrl ?? "",
      coverUrl: value.coverUrl ?? "",
    },
    mode: "onChange",
  })

  // Propaga para o estado central (preview reage em tempo real).
  React.useEffect(() => {
    const sub = watch((v) => {
      onChange({
        titulo: v.titulo ?? "",
        descricao: v.descricao ?? "",
        rodape: v.rodape ?? "",
        logoUrl: v.logoUrl ?? "",
        coverUrl: v.coverUrl ?? "",
      })
    })
    return () => sub.unsubscribe()
  }, [watch, onChange])

  // Upload logo
  const [uploadingLogo, setUploadingLogo] = React.useState(false)
  const [logoError, setLogoError] = React.useState<string | null>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    setUploadingLogo(true)
    try {
      const url = await uploadBioAsset(file, "logo")
      setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })
    } catch (err) {
      logger.error("bio", "upload logo falhou", err)
      setLogoError("Falha no envio. Verifique o tamanho (até 5MB) e tente novamente.")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  // Upload cover
  const [uploadingCover, setUploadingCover] = React.useState(false)
  const [coverError, setCoverError] = React.useState<string | null>(null)
  const coverInputRef = React.useRef<HTMLInputElement>(null)
  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverError(null)
    setUploadingCover(true)
    try {
      const url = await uploadBioAsset(file, "cover")
      setValue("coverUrl", url, { shouldDirty: true, shouldValidate: true })
    } catch (err) {
      logger.error("bio", "upload cover falhou", err)
      setCoverError("Falha no envio. Verifique o tamanho (até 5MB) e tente novamente.")
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ""
    }
  }

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <Field label="Título" htmlFor="titulo" error={errors.titulo?.message}>
        <Input id="titulo" placeholder="SmartLoop" {...register("titulo")} />
      </Field>

      <Field label="Descrição" htmlFor="descricao" hint="Até 240 caracteres" error={errors.descricao?.message}>
        <textarea
          id="descricao"
          rows={3}
          placeholder="Conte em uma linha o que você oferece."
          className="w-full resize-none rounded-md border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 py-2 text-sm text-[#111827] dark:text-[#f8fafc] outline-none focus:border-[#2563eb] placeholder:text-[#9ca3af] dark:placeholder:text-[#64748b]"
          {...register("descricao")}
        />
      </Field>

      <Field
        label="Logo"
        htmlFor="logoUrl"
        hint={uploadingLogo ? "Enviando..." : "Quadrado recomendado (1:1)"}
        error={logoError ?? undefined}
      >
        <div className="flex gap-2">
          <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickLogo}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingLogo}
            onClick={() => logoInputRef.current?.click()}
          >
            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
        {value.logoUrl && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[--muted-foreground]">
            <img src={value.logoUrl} alt="" className="h-8 w-8 rounded-full border border-[--border] object-cover" />
            <button
              type="button"
              onClick={() => setValue("logoUrl", "", { shouldDirty: true })}
              className="flex items-center gap-1 hover:text-[--foreground]"
            >
              <XIcon className="h-3 w-3" /> Remover
            </button>
          </div>
        )}
      </Field>

      <Field
        label="Imagem de capa"
        htmlFor="coverUrl"
        hint="Proporção 1500×500 (3:1) recomendada"
        error={coverError ?? undefined}
      >
        <div className="flex gap-2">
          <Input id="coverUrl" placeholder="https://..." {...register("coverUrl")} />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickCover}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingCover}
            onClick={() => coverInputRef.current?.click()}
          >
            {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
        {value.coverUrl && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[--muted-foreground]">
            <img src={value.coverUrl} alt="" className="h-12 w-24 rounded-md border border-[--border] object-cover" />
            <button
              type="button"
              onClick={() => setValue("coverUrl", "", { shouldDirty: true })}
              className="flex items-center gap-1 hover:text-[--foreground]"
            >
              <XIcon className="h-3 w-3" /> Remover
            </button>
          </div>
        )}
      </Field>

      <Field label="Rodapé" htmlFor="rodape" hint="Aparece no fim da página" error={errors.rodape?.message}>
        <Input id="rodape" placeholder="smartloop.com.br" {...register("rodape")} />
      </Field>
    </form>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
}
function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5">{label}</Label>
      {children}
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className={error ? "text-[#ef4444]" : "text-[--muted-foreground]"}>{error || hint}</span>
      </div>
    </div>
  )
}