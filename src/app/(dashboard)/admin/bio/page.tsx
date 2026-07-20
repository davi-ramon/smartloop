"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ShieldAlert, Loader2, Save, AlertCircle } from "lucide-react"
import { Header } from "@/components/layout/header"
import { useAuth } from "@/lib/firebase/auth-context"
import { isAdmin } from "@/lib/admins"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import {
  watchBioPage,
  saveBioPage,
  PROFILE_DEFAULTS,
  type BioLink, type BioProfile,
} from "@/lib/data/bio"
import { BioProfileForm } from "@/components/bio/editor/bio-profile-form"
import { BioThemeForm } from "@/components/bio/editor/bio-theme-form"
import { BioLinksForm } from "@/components/bio/editor/bio-links-form"
import { BioOgForm } from "@/components/bio/editor/bio-og-form"
import { BioPreview } from "@/components/bio/editor/bio-preview"
import { useToast } from "@/components/bio/editor/use-toast"

export default function AdminBioPage() {
  // ToastProvider agora fica no layout raiz do dashboard (src/app/(dashboard)/layout.tsx).
  return <AdminBioPageInner />
}

function AdminBioPageInner() {
  const { user } = useAuth()
  const admin = isAdmin(user?.email)
  const [profile, setProfile] = React.useState<BioProfile>({ ...PROFILE_DEFAULTS })
  const [links, setLinks] = React.useState<BioLink[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  // snapshot dos valores remotos (para o save saber o diff)
  const originalRef = React.useRef<{ profile: BioProfile; links: BioLink[] } | null>(null)

  React.useEffect(() => {
    if (!admin) return
    logger.info("bio", "editor aberto", { uid: user?.uid })
    const unsub = watchBioPage(
      (data) => {
        setProfile(data.profile)
        setLinks(data.links)
        originalRef.current = { profile: data.profile, links: data.links }
        setLoaded(true)
        setDirty(false)
      },
      (err) => {
        logger.error("bio", "watch falhou no editor", err)
        setError(true)
        setLoaded(true)
      },
    )
    return () => unsub()
  }, [admin, user?.uid])

  function setProfilePatch(patch: Partial<BioProfile>) {
    setProfile((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }
  function setLinksNext(next: BioLink[]) {
    setLinks(next)
    setDirty(true)
  }

  async function handleSave() {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const current = originalRef.current ?? { profile: { ...PROFILE_DEFAULTS }, links: [] }
      await saveBioPage(
        { profile, links },
        current,
        user?.email ?? undefined,
      )
      // atualiza o snapshot com o novo estado
      originalRef.current = { profile, links }
      setDirty(false)
      toast({ title: "Bio publicada", description: "As alterações já estão visíveis em /bio.", variant: "success" })
      logger.success("bio", "editor salvou", { links: links.length })
    } catch (err) {
      logger.error("bio", "falha ao salvar", err)
      toast({ title: "Não foi possível salvar", description: "Verifique sua conexão e tente novamente.", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (!admin) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Bio" description="Configure sua página pública" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <ShieldAlert className="h-10 w-10 text-[--muted-foreground]" />
          <p className="text-sm font-medium text-[--foreground]">Acesso restrito</p>
          <p className="max-w-xs text-xs text-[--muted-foreground]">
            Esta área é exclusiva para administradores e desenvolvedores do SmartLoop.
          </p>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Bio" description="Configure sua página pública" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[--primary]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Bio" description="Configure sua página pública" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-[--ef4444]" />
          <p className="text-sm font-medium text-[--foreground]">Falha ao carregar a Bio</p>
          <p className="max-w-xs text-xs text-[--muted-foreground]">Verifique sua conexão ou permissões de admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Bio" description="Configure sua página pública" />

      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Coluna esquerda: editor */}
          <div className="min-w-0">
            <Tabs defaultValue="links">
              <TabsList>
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="tema">Tema</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="compartilhamento">Compartilhamento</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil">
                <BioProfileForm value={profile} onChange={setProfilePatch} />
              </TabsContent>
              <TabsContent value="tema">
                <BioThemeForm value={profile} onChange={setProfilePatch} />
              </TabsContent>
              <TabsContent value="links">
                <BioLinksForm links={links} onChange={setLinksNext} />
              </TabsContent>
              <TabsContent value="compartilhamento">
                <BioOgForm value={profile} onChange={setProfilePatch} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Coluna direita: preview sticky */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <BioPreview profile={profile} links={links} />
          </div>
        </div>
      </div>

      {/* Barra de publicação (sticky bottom) */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[--border] bg-[--card]/95 px-6 py-3 backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dirty ? "bg-[#f59e0b]" : "bg-[#10b981]",
            )}
          />
          <span className="font-medium text-[--foreground]">
            {dirty ? "Não publicado" : "Publicado"}
          </span>
          <span className="hidden text-[--muted-foreground] sm:inline">
            · {links.length} link{links.length === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar e publicar
        </Button>
      </motion.div>
    </div>
  )
}