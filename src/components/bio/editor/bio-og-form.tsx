"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload, X as XIcon, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { uploadBioAsset, type BioProfile } from "@/lib/data/bio"

/**
 * Form de Open Graph — personaliza como a página /bio aparece quando
 * compartilhada em WhatsApp / Facebook / Twitter / Instagram / LinkedIn.
 *
 * Defaults automáticos:
 *   ogTitle       → titulo
 *   ogDescription → descricao
 *   ogImageUrl    → ogImageUrl || coverUrl || logoUrl
 */

const schema = z.object({
  ogTitle: z.string().max(95, "Máximo 95").optional().or(z.literal("")),
  ogDescription: z.string().max(200, "Máximo 200").optional().or(z.literal("")),
  ogImageUrl: z.string().optional().or(z.literal("")),
})
type FormData = z.infer<typeof schema>

export interface BioOgFormProps {
  value: BioProfile
  onChange: (patch: Partial<BioProfile>) => void
}

export function BioOgForm({ value, onChange }: BioOgFormProps) {
  const { register, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ogTitle: value.ogTitle ?? "",
      ogDescription: value.ogDescription ?? "",
      ogImageUrl: value.ogImageUrl ?? "",
    },
    mode: "onChange",
  })

  // Propaga para o estado central (preview + save atômico)
  React.useEffect(() => {
    const sub = watch((v) => {
      onChange({
        ogTitle: v.ogTitle ?? "",
        ogDescription: v.ogDescription ?? "",
        ogImageUrl: v.ogImageUrl ?? "",
      })
    })
    return () => sub.unsubscribe()
  }, [watch, onChange])

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
      setValue("ogImageUrl", url, { shouldDirty: true, shouldValidate: true })
      logger.success("bio", "OG image enviada", { url })
    } catch (err) {
      logger.error("bio", "upload OG image falhou", err)
      setUploadError("Falha no envio. Verifique tamanho (até 5MB) e tente novamente.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const previewImage = watch("ogImageUrl") || value.coverUrl || value.logoUrl || ""

  // Defaults exibidos como placeholder (não como valor) — UX
  const titlePh = value.titulo || "SmartLoop"
  const descPh = value.descricao || "A OS que resolve. O sistema que escala."

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 text-xs text-[#6b7280] dark:border-[#334155] dark:bg-[#0f172a] dark:text-[#94a3b8]">
        <p className="font-medium text-[#111827] dark:text-[#f8fafc]">Como funciona</p>
        <p className="mt-1">
          Quando alguém compartilha <code className="rounded bg-white px-1 py-0.5 text-[#111827] dark:bg-[#1e293b] dark:text-[#f8fafc]">smartloop.com.br/bio</code> no
          WhatsApp, Facebook ou outra rede, este título/descrição/imagem aparece no preview.
          Se ficar em branco, usamos o título/descrição do perfil + capa/logo.
        </p>
      </div>

      <div>
        <Label htmlFor="ogTitle" className="mb-1.5 block text-[#111827] dark:text-[#f8fafc]">Título do compartilhamento</Label>
        <Input
          id="ogTitle"
          placeholder={titlePh}
          maxLength={95}
          {...register("ogTitle")}
        />
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className={errors.ogTitle?.message ? "text-[#ef4444]" : "text-[#6b7280] dark:text-[#94a3b8]"}>
            {errors.ogTitle?.message || "Se vazio, usa o título do perfil."}
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="ogDescription" className="mb-1.5 block text-[#111827] dark:text-[#f8fafc]">Descrição do compartilhamento</Label>
        <textarea
          id="ogDescription"
          rows={3}
          placeholder={descPh}
          maxLength={200}
          className="w-full resize-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#2563eb] placeholder:text-[#9ca3af] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#f8fafc]"
          {...register("ogDescription")}
        />
        <div className="mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          Se vazia, usa a descrição do perfil.
        </div>
      </div>

      <div>
        <Label htmlFor="ogImageUrl" className="mb-1.5 block text-[#111827] dark:text-[#f8fafc]">Imagem do compartilhamento</Label>
        <div className="flex gap-2">
          <Input
            id="ogImageUrl"
            placeholder="https://..."
            {...register("ogImageUrl")}
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
        <div className="mt-1 text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
          {uploadError || "Recomendado 1200×630px (até 5MB). Se vazia, usa capa ou logo."}
        </div>
        {previewImage && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#e5e7eb] dark:border-[#334155]">
            <img src={previewImage} alt="Pré-visualização" className="h-40 w-full object-cover" />
            <div className="flex items-center justify-between bg-white px-3 py-2 text-[11px] dark:bg-[#0f172a]">
              <span className="truncate text-[#6b7280] dark:text-[#94a3b8]">{previewImage.slice(0, 60)}…</span>
              {watch("ogImageUrl") && (
                <button
                  type="button"
                  onClick={() => setValue("ogImageUrl", "", { shouldDirty: true })}
                  className="flex items-center gap-1 text-[#6b7280] hover:text-[#dc2626] dark:text-[#94a3b8]"
                >
                  <XIcon className="h-3 w-3" /> Remover
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block text-[#111827] dark:text-[#f8fafc]">Como testar</Label>
        <a
          href="https://www.opengraph.xyz/url?url=https%3A%2F%2Fsmartloop.com.br%2Fbio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#2563eb] hover:underline"
        >
          Ver preview ao vivo no opengraph.xyz <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </form>
  )
}