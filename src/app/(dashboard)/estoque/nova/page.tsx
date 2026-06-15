"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-context"
import { createPart, PART_CATEGORIES } from "@/lib/data/parts"
import { logger } from "@/lib/logger"

export default function NovaPecaPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const tenantId = profile?.tenantId

  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState<string>("Telas")
  const [cost, setCost] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("2")
  const [supplier, setSupplier] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Informe o nome da peça."); return }
    if (!tenantId) { setError("Sessão ainda carregando. Tente novamente."); return }
    setSaving(true)
    setError(null)
    try {
      await createPart(tenantId, {
        name, sku, category,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        supplier,
      })
      router.push("/estoque")
    } catch {
      logger.error("estoque", "falha ao cadastrar peça")
      setError("Não foi possível salvar a peça. Tente novamente.")
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Nova Peça" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-xl">
          <Link href="/estoque" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[--muted-foreground] hover:text-[--foreground]">
            <ArrowLeft className="h-4 w-4" />
            Voltar para estoque
          </Link>

          <Card className="border-[--border] shadow-none">
            <CardContent className="p-6">
              {error && (
                <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome da peça *</Label>
                  <Input id="name" placeholder="ex: Tela iPhone 14 Pro OLED" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="TL-IP14P" value={sku} onChange={(e) => setSku(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cat">Categoria</Label>
                    <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
                      {PART_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cost">Custo (R$)</Label>
                    <Input id="cost" type="number" min="0" step="0.01" placeholder="0,00" value={cost} onChange={(e) => setCost(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Preço de venda (R$)</Label>
                    <Input id="price" type="number" min="0" step="0.01" placeholder="0,00" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stock">Quantidade em estoque</Label>
                    <Input id="stock" type="number" min="0" placeholder="0" value={stock} onChange={(e) => setStock(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="min">Estoque mínimo</Label>
                    <Input id="min" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sup">Fornecedor</Label>
                  <Input id="sup" placeholder="Nome do fornecedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" asChild><Link href="/estoque">Cancelar</Link></Button>
                  <Button type="submit" loading={saving} disabled={saving}>Salvar peça</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
