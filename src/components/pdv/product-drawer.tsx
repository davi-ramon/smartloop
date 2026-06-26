"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Upload, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import {
  createProduct, updateProduct, uploadProductImage,
  PRODUCT_CATEGORIES, type Product,
} from "@/lib/data/products"

interface ProductDrawerProps {
  /** null = novo; objeto = editar. */
  product: Product | null
  open: boolean
  onClose: () => void
}

export function ProductDrawer({ product, open, onClose }: ProductDrawerProps) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const isEdit = !!product
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState<string>("Películas")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? "")
    setDescription(product?.description ?? "")
    setPrice(product ? String(product.price) : "")
    setCategory(product?.category ?? "Películas")
    setImageUrl(product?.imageUrl ?? "")
    setError(null)
  }, [open, product])

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setError(null)
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setError("Use PNG, JPG ou WEBP."); return }
    if (file.size > 5 * 1024 * 1024) { setError("Imagem até 5MB."); return }
    setUploading(true)
    try { setImageUrl(await uploadProductImage(tenantId, file)) }
    catch { setError("Não foi possível enviar a imagem.") }
    finally { setUploading(false) }
  }

  async function handleSave() {
    if (!tenantId) return
    if (!name.trim()) { setError("Informe o nome do produto."); return }
    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) { setError("Informe um valor válido."); return }
    setSaving(true); setError(null)
    try {
      const data = { name, description, price: priceNum, category, imageUrl }
      if (isEdit && product) await updateProduct(tenantId, product.id, data)
      else await createProduct(tenantId, data)
      onClose()
    } catch {
      setError("Não foi possível salvar o produto.")
      setSaving(false)
    }
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar produto" : "Novo produto"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving || uploading}>{isEdit ? "Salvar" : "Adicionar"}</Button>
        </div>
      }
    >
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-4">
        {/* Imagem */}
        <div className="flex items-center gap-4">
          <div onClick={() => fileRef.current?.click()} className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[--border] bg-[--muted] hover:border-[--primary] transition-colors">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-[--muted-foreground]" /> : imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-[--muted-foreground]" />}
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />{imageUrl ? "Trocar imagem" : "Imagem (opcional)"}
            </Button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImage} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pn">Nome *</Label>
          <Input id="pn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Película iPhone 14" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pd">Descrição curta</Label>
          <Input id="pd" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vidro temperado 9H" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pp">Valor (R$) *</Label>
            <Input id="pp" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc">Categoria</Label>
            <select id="pc" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
    </SideDrawer>
  )
}
