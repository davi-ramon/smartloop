import Link from "next/link"
import { Wrench, ArrowLeft } from "lucide-react"

/** Moldura visual das páginas legais (mesma identidade da landing). */
export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060918] text-slate-300">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#7c3aed]">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold text-white">Smart<span className="text-[#60a5fa]">Loop</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Última atualização: {updated}</p>
        <div className="legal-prose mt-10 space-y-6 text-sm leading-relaxed text-slate-400">
          {children}
        </div>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm">
          <Link href="/termos" className="text-slate-400 hover:text-white">Termos de Uso</Link>
          <Link href="/privacidade" className="text-slate-400 hover:text-white">Privacidade</Link>
          <Link href="/cookies" className="text-slate-400 hover:text-white">Cookies</Link>
          <Link href="/lgpd" className="text-slate-400 hover:text-white">LGPD</Link>
        </div>
      </main>
    </div>
  )
}

/** Título de seção reutilizável. */
export function LegalH2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 text-lg font-bold text-white">{children}</h2>
}
