"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Mail, Loader2, Send, XCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SideDrawer } from "@/components/shared/side-drawer"
import { useAuth } from "@/lib/firebase/auth-context"
import {
  createTechnician, updateTechnician, deleteTechnician,
  TECH_ROLES, type Technician, type TechRole,
} from "@/lib/data/technicians"
import { inviteTechnician, revokeTechnician } from "@/lib/firebase/technicians"
import { logger } from "@/lib/logger"
import { useToast } from "@/components/bio/editor/use-toast"

interface Props {
  technician: Technician | null
  open: boolean
  onClose: () => void
}

export function TechnicianDrawer({ technician, open, onClose }: Props) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId
  const isEdit = !!technician
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [role, setRole] = useState<TechRole>(TECH_ROLES[0])
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [revokeBusy, setRevokeBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(technician?.name ?? "")
    setRole((technician?.role as TechRole) ?? TECH_ROLES[0])
    setEmail(technician?.email ?? "")
    setPhone(technician?.phone ?? "")
    setActive(technician?.active ?? true)
    setError(null)
  }, [open, technician])

  function validate(): string | null {
    if (!name.trim()) return "Informe o nome do tecnico."
    if (!email.trim() || !email.includes("@")) return "Informe um e-mail valido."
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return "E-mail invalido."
    return null
  }

  async function handleSave() {
    if (!tenantId) return
    const v = validate()
    if (v) { setError(v); return }
    setSaving(true); setError(null)
    try {
      const data = { name: name.trim(), role, email: email.trim().toLowerCase(), phone, active }
      if (isEdit && technician) {
        await updateTechnician(tenantId, technician.id, data)
        logger.info("tecnicos", "tecnico atualizado", { id: technician.id, email: data.email })
      } else {
        await createTechnician(tenantId, data)
        logger.info("tecnicos", "tecnico criado", { name: data.name, email: data.email })
      }
      onClose()
    } catch {
      setError("Nao foi possivel salvar o tecnico.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSendInvite() {
    if (!technician) return
    if (!technician.email) { setError("Defina um e-mail antes de convidar."); return }
    setInviteBusy(true); setError(null)
    try {
      await inviteTechnician(technician.id, technician.email)
      logger.info("tecnicos", "convite enviado/reenviado", { id: technician.id, email: technician.email })
      toast({ title: "Convite enviado", description: `E-mail enviado para ${technician.email}.`, variant: "success" })
    } catch (err) {
      logger.error("tecnicos", "falha ao enviar convite", err)
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message) : "Nao foi possivel enviar o convite."
      setError(msg)
      toast({ title: "Falha ao enviar convite", description: msg, variant: "error" })
    } finally {
      setInviteBusy(false)
    }
  }

  async function handleRevoke() {
    if (!technician) return
    if (!confirm("Revogar acesso deste tecnico? O usuario sera desativado e nao podera mais entrar.")) return
    setRevokeBusy(true); setError(null)
    try {
      await revokeTechnician(technician.id)
      logger.info("tecnicos", "tecnico revogado", { id: technician.id })
      toast({ title: "Tecnico revogado", description: "Acesso desativado.", variant: "success" })
      onClose()
    } catch (err) {
      logger.error("tecnicos", "falha ao revogar", err)
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message) : "Nao foi possivel revogar."
      setError(msg)
    } finally {
      setRevokeBusy(false)
    }
  }

  async function handleDelete() {
    if (!technician || !tenantId) return
    if (!confirm("Excluir este tecnico? (O acesso ja foi revogado, isto remove o registro do tenant.)")) return
    setSaving(true); setError(null)
    try {
      await deleteTechnician(tenantId, technician.id)
      logger.info("tecnicos", "tecnico excluido", { id: technician.id })
      onClose()
    } catch {
      setError("Nao foi possivel excluir o tecnico.")
    } finally {
      setSaving(false)
    }
  }

  const inviteStatus = technician?.inviteStatus ?? "pending"

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar tecnico" : "Novo tecnico"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving || inviteBusy || revokeBusy}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving} disabled={saving || inviteBusy || revokeBusy}>
            {isEdit ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      }
    >
      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-[--destructive]/30 bg-[--destructive]/10 px-3 py-2.5 text-sm text-[--destructive]">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Status do convite (so quando edicao) */}
      {isEdit && (
        <div className={cnInviteBadge(inviteStatus)}>
          {inviteStatus === "active" && <><CheckCircle2 className="h-3.5 w-3.5" /> Ativo — aceito em {formatDate(technician?.acceptedAt)}</>}
          {inviteStatus === "pending" && <><Mail className="h-3.5 w-3.5" /> Convite enviado — aguardando o tecnico ativar</>}
          {inviteStatus === "revoked" && <><XCircle className="h-3.5 w-3.5" /> Acesso revogado</>}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tn" className="text-[--foreground]">Nome *</Label>
          <Input id="tn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carlos Eduardo" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temail" className="text-[--foreground]">E-mail *</Label>
          <Input
            id="temail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carlos@loja.com.br"
            disabled={inviteStatus === "active"} // nao deixa trocar email apos ativado
          />
          {inviteStatus === "active" && (
            <p className="text-[10px] text-[--muted-foreground]">
              E-mail do tecnico ja ativo. Para trocar, revogue e cadastre novamente.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr" className="text-[--foreground]">Funcao</Label>
          <select
            id="tr"
            value={role}
            onChange={(e) => setRole(e.target.value as TechRole)}
            className="flex h-10 w-full rounded-md border border-[--input] bg-[--background] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ring]"
          >
            {TECH_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tp" className="text-[--foreground]">Telefone / WhatsApp</Label>
          <Input id="tp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-[--primary]"
          />
          <span className="text-sm text-[--foreground]">Tecnico ativo</span>
        </label>
      </div>

      {/* Acoes de convite / revogacao (so no edit) */}
      {isEdit && (
        <div className="mt-6 space-y-2 border-t border-[--border] pt-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[--muted-foreground]">
            Acesso ao sistema
          </p>
          {inviteStatus !== "active" && technician?.email && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSendInvite}
              loading={inviteBusy}
              disabled={inviteBusy || revokeBusy || saving || !technician.email}
            >
              <Send className="h-4 w-4" />
              {inviteStatus === "revoked" ? "Reenviar convite" : "Enviar/Reenviar convite"}
            </Button>
          )}
          {inviteStatus === "active" && (
            <Button
              type="button"
              variant="outline"
              className="w-full text-[--destructive] hover:bg-[--destructive]/10"
              onClick={handleRevoke}
              loading={revokeBusy}
              disabled={revokeBusy || inviteBusy || saving}
            >
              <XCircle className="h-4 w-4" /> Revogar acesso
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-[--muted-foreground] hover:text-[--destructive]"
            onClick={handleDelete}
            disabled={saving || inviteBusy || revokeBusy}
          >
            Excluir registro do tecnico
          </Button>
        </div>
      )}
    </SideDrawer>
  )
}

function cnInviteBadge(status: string): string {
  const base = "mb-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
  if (status === "active") return `${base} bg-[#10b981]/10 text-[#10b981]`
  if (status === "revoked") return `${base} bg-[#ef4444]/10 text-[#ef4444]`
  return `${base} bg-[#f59e0b]/10 text-[#f59e0b]`
}

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== "function") return "data desconhecida"
  try {
    return ts.toDate().toLocaleDateString("pt-BR")
  } catch {
    return "data desconhecida"
  }
}