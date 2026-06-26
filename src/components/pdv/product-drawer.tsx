"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Upload, Loader2, Package, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import {
  createProduct, updateProduct, uploadProductImage, addProductCategory,
  PRODUCT_CATEGORIES, type Product,
} from "@/lib/data/products"

interface ProductDrawerProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

export function ProductDrawer({ product, open, onClose }: ProductDrawerProps) {
  const { profile, tenant } = useAuth()
  const tenantId = profile?.tenantId
  const isEdit = !!product
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState<string>("Películas")
  const [sku, setSku] = useState("")
  const [brand, setBrand] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newCat, setNewCat] = useState("")
  const [addingCat, setAddingCat] = useState(false)

  const categories = useMemo(() => {
    const custom = tenant?.productCategories ?? []
    return Array.from(new Set([...PRODUCT_CATEGORIES, ...custom]))
  }, [tenant?.productCategories])

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? "")
    setDescription(product?.description ?? "")
    setPrice(product ? String(product.price) : "")
    setCategory(product?.category ?? PRODUCT_CATEGORIES[0])
    setSku(product?.sku ?? "")
    setBrand(product?.brand ?? "")
    setCost(product?.cost ? String(product.cost) : "")
    setStock(product?.stock != null ? String(product.stock) : "")
    setImageUrl(product?.imageUrl ?? "")
    setError(null); setNewCat(""); setAddingCat(false)
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

  async function handleAddCategory() {
    if (!tenantId || !newCat.trim()) return
    try {
      await addProductCategory(tenantId, newCat)
      setCategory(newCat.trim())
      setNewCat(""); setAddingCat(false)
    } catch {
      setError("Não foi possível adicionar a categoria.")
    }
  }

  async function handleSave() {
    if (!tenantId) return
    if (!name.trim()) { setError("Informe o nome do produto."); return }
    const priceNum = Number(price)
    if (!priceNum || priceNum <= 0) { setError("Informe um valor de venda válido."); return }
    setSaving(true); setError(null)
    try {
      const data = {
        name, description, price: priceNum, category,
        sku: sku || undefined,
        brand: brand || undefined,
        cost: Number(cost) || undefined,
        stock: stock !== "" ? Number(stock) : undefined,
        imageUrl,
      }
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
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />{imageUrl ? "Trocar imagem" : "Imagem (opcional)"}
          </Button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImage} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pn">Nome *</Label>
          <Input id="pn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fone Bluetooth TWS" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pd">Descrição curta</Label>
          <Input id="pd" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cancelamento de ruído, 20h de bateria" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="pp">Valor de venda (R$) *</Label>
            <Input id="pp" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pcost">Custo (R$)</Label>
            <Input id="pcost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="psku">SKU / Código</Label>
            <Input id="psku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="FONE-TWS-01" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pbrand">Marca</Label>
            <Input id="pbrand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="JBL, Apple..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pstock">Estoque</Label>
            <Input id="pstock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pc">Categoria</Label>
            <select id="pc" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Nova categoria */}
        {addingCat ? (
          <div className="flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nome da categoria" onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory() }} />
            <Button type="button" size="sm" onClick={handleAddCategory} disabled={!newCat.trim()}><Check className="h-4 w-4" /></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setAddingCat(false); setNewCat("") }}>Cancelar</Button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingCat(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-[--primary] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Nova categoria
          </button>
        )}
      </div>
    </SideDrawer>
  )
}
