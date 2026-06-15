"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/firebase/auth-context"
import { updatePart, PART_CATEGORIES, type Part } from "@/lib/data/parts"
import { logger } from "@/lib/logger"

interface PartEditDialogProps {
  part: Part | null
  open: boolean
  onClose: () => void
}

export function PartEditDialog({ part, open, onClose }: PartEditDialogProps) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState<string>("Outros")
  const [cost, setCost] = useState("0")
  const [price, setPrice] = useState("0")
  const [stock, setStock] = useState("0")
  const [minStock, setMinStock] = useState("0")
  const [supplier, setSupplier] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!part) return
    setName(part.name ?? "")
    setSku(part.sku ?? "")
    setCategory(part.category ?? "Outros")
    setCost(String(part.cost ?? 0))
    setPrice(String(part.price ?? 0))
    setStock(String(part.stock ?? 0))
    setMinStock(String(part.minStock ?? 0))
    setSupplier(part.supplier ?? "")
    setError(null)
  }, [part])

  async function handleSave() {
    if (!tenantId || !part) return
    if (!name.trim()) { setError("Informe o nome da peça."); return }
    setSaving(true)
    setError(null)
    try {
      await updatePart(tenantId, part.id, {
        name, sku, category,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        supplier,
      })
      onClose()
    } catch {
      logger.error("estoque", "falha ao editar peça", { id: part.id })
      setError("Não foi possível salvar as alterações.")
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && part && (
        <motion.div className="fixed inset-0 z-[120] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={saving ? undefined : onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-xl border border-[--border] bg-[--popover] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[--foreground]">Editar peça</h2>
              <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-lg text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nome *</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-sku">SKU</Label>
                  <Input id="p-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cat">Categoria</Label>
                  <select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
                    {PART_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cost">Custo (R$)</Label>
                  <Input id="p-cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Venda (R$)</Label>
                  <Input id="p-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">Estoque</Label>
                  <Input id="p-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-min">Estoque mínimo</Label>
                  <Input id="p-min" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sup">Fornecedor</Label>
                <Input id="p-sup" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} loading={saving} disabled={saving}>Salvar alterações</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
