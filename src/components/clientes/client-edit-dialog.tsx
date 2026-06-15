"use client"

import { useEffect, useState } from "react"
import { AlertCircle, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import { updateCustomer, type Customer } from "@/lib/data/customers"
import { logger } from "@/lib/logger"

interface ClientEditDialogProps {
  customer: Customer | null
  open: boolean
  onClose: () => void
}

export function ClientEditDialog({ customer, open, onClose }: ClientEditDialogProps) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId

  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [cpf, setCpf] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customer) return
    setName(customer.name ?? "")
    setWhatsapp(customer.whatsapp ?? "")
    setPhone(customer.phone ?? "")
    setEmail(customer.email ?? "")
    setCpf(customer.cpf ?? "")
    setActive(customer.active ?? true)
    setError(null)
  }, [customer])

  async function handleSave() {
    if (!tenantId || !customer) return
    if (!name.trim()) { setError("Informe o nome do cliente."); return }
    setSaving(true)
    setError(null)
    try {
      await updateCustomer(tenantId, customer.id, { name, whatsapp, phone, email, cpf, active })
      onClose()
    } catch {
      logger.error("clientes", "falha ao editar cliente", { id: customer.id })
      setError("Não foi possível salvar as alterações.")
      setSaving(false)
    }
  }

  return (
    <SideDrawer
      open={open && !!customer}
      onClose={onClose}
      title="Editar cliente"
      description={customer?.name}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>Salvar alterações</Button>
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
          <Label htmlFor="edit-name">Nome *</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-whatsapp" className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-[#10b981]" /> WhatsApp
          </Label>
          <Input id="edit-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-phone">Telefone</Label>
          <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 0000-0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-email">E-mail</Label>
          <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-cpf">CPF/CNPJ</Label>
          <Input id="edit-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[--primary]" />
          <span className="text-sm text-[--foreground]">Cliente ativo</span>
        </label>
      </div>
    </SideDrawer>
  )
}
