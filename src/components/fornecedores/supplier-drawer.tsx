"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import { createSupplier, updateSupplier, type Supplier } from "@/lib/data/suppliers"

interface SupplierDrawerProps {
  /** null = criar novo; objeto = editar. */
  supplier: Supplier | null
  open: boolean
  onClose: () => void
}

export function SupplierDrawer({ supplier, open, onClose }: SupplierDrawerProps) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const isEdit = !!supplier

  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(supplier?.name ?? "")
    setCity(supplier?.city ?? "")
    setPhone(supplier?.phone ?? "")
    setEmail(supplier?.email ?? "")
    setActive(supplier?.active ?? true)
    setError(null)
  }, [open, supplier])

  async function handleSave() {
    if (!tenantId) return
    if (!name.trim()) { setError("Informe o nome do fornecedor."); return }
    setSaving(true)
    setError(null)
    try {
      const data = { name, city, phone, email, active }
      if (isEdit && supplier) await updateSupplier(tenantId, supplier.id, data)
      else await createSupplier(tenantId, data)
      onClose()
    } catch {
      setError("Não foi possível salvar o fornecedor.")
      setSaving(false)
    }
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>{isEdit ? "Salvar alterações" : "Cadastrar"}</Button>
        </div>
      }
    >
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Nome / Razão social *</Label>
          <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Moisés Imperosa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-city">Cidade / UF</Label>
          <Input id="s-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Fortaleza, CE" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-phone">Telefone / WhatsApp</Label>
          <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-email">E-mail</Label>
          <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendas@fornecedor.com" />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[--primary]" />
          <span className="text-sm text-[--foreground]">Fornecedor ativo</span>
        </label>
      </div>
    </SideDrawer>
  )
}
