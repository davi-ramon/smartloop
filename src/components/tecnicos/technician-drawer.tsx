"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import { createTechnician, updateTechnician, TECH_ROLES, type Technician } from "@/lib/data/technicians"

interface Props {
  technician: Technician | null
  open: boolean
  onClose: () => void
}

export function TechnicianDrawer({ technician, open, onClose }: Props) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const isEdit = !!technician

  const [name, setName] = useState("")
  const [role, setRole] = useState<string>(TECH_ROLES[0])
  const [phone, setPhone] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(technician?.name ?? "")
    setRole(technician?.role ?? TECH_ROLES[0])
    setPhone(technician?.phone ?? "")
    setActive(technician?.active ?? true)
    setError(null)
  }, [open, technician])

  async function handleSave() {
    if (!tenantId) return
    if (!name.trim()) { setError("Informe o nome do técnico."); return }
    setSaving(true); setError(null)
    try {
      const data = { name, role, phone, active }
      if (isEdit && technician) await updateTechnician(tenantId, technician.id, data)
      else await createTechnician(tenantId, data)
      onClose()
    } catch {
      setError("Não foi possível salvar o técnico.")
      setSaving(false)
    }
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar técnico" : "Novo técnico"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>{isEdit ? "Salvar" : "Cadastrar"}</Button>
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
          <Label htmlFor="tn">Nome *</Label>
          <Input id="tn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carlos Eduardo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr">Função</Label>
          <select id="tr" value={role} onChange={(e) => setRole(e.target.value)} className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]">
            {TECH_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp">Telefone / WhatsApp</Label>
          <Input id="tp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[--primary]" />
          <span className="text-sm text-[--foreground]">Técnico ativo</span>
        </label>
      </div>
    </SideDrawer>
  )
}
