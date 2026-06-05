"use client"

import { useRef, useState } from "react"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import {
  Wrench, ArrowRight, Check, X, Star, Zap, Shield,
  BarChart2, Users, ClipboardList, Package, Smartphone,
  ChevronDown, Globe, Mail, Phone, Link2, ExternalLink,
  CheckCircle2, AlertTriangle, TrendingUp, Clock,
  MessageSquare, QrCode, Scan, FileText, CreditCard,
  Menu, Sparkles,
} from "lucide-react"

/* ───────────────────────────────────────────
   Motion helpers
─────────────────────────────────────────── */
const FU = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: "easeOut" as const } },
})
const FS = (delay = 0) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay, duration: 0.4 } },
})
const SC = (stagger = 0.09) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
})

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} variants={FU(delay)} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  )
}

function RevealGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} variants={SC()} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  )
}

/* ───────────────────────────────────────────
   Navbar
─────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  const bg = useTransform(scrollY, [0, 80], ["rgba(6,9,24,0)", "rgba(6,9,24,0.95)"])
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])

  return (
    <motion.header
      style={{ backgroundColor: bg }}
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-md"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute inset-x-0 bottom-0 h-px bg-white/10"
      />
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#7c3aed]">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-white">
            Smart<span className="text-[#60a5fa]">Loop</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {["Funcionalidades", "Preços", "Sobre", "Blog"].map((item) => (
            <Link key={item} href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
              {item}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2">
            Entrar
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Começar grátis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
          <Menu className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/10 bg-[#060918]/98 px-6 py-4 space-y-3"
        >
          {["Funcionalidades", "Preços", "Sobre"].map(item => (
            <Link key={item} href="#" className="block text-sm text-slate-300 py-2">{item}</Link>
          ))}
          <Link href="/login" className="block rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-5 py-2.5 text-center text-sm font-semibold text-white">
            Começar grátis
          </Link>
        </motion.div>
      )}
    </motion.header>
  )
}

/* ───────────────────────────────────────────
   Hero
─────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#060918] flex flex-col items-center justify-center pt-16">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb-1 absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-[#7c3aed]/25 blur-[100px]" />
        <div className="orb-2 absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-[#2563eb]/30 blur-[90px]" />
        <div className="orb-3 absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-[#06b6d4]/20 blur-[80px]" />
        {/* Dot grid */}
        <div
          className="animate-grid absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#60a5fa]" />
          <span className="text-xs font-medium text-slate-300">
            Sistema completo para assistências técnicas
          </span>
          <span className="ml-1 rounded-full bg-[#2563eb]/30 px-2 py-0.5 text-[10px] font-bold text-[#60a5fa]">
            NOVO
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl"
        >
          Pare de perder{" "}
          <span
            className="animate-shimmer bg-gradient-to-r from-[#60a5fa] via-[#a78bfa] to-[#34d399] bg-clip-text text-transparent"
            style={{ backgroundSize: "200% auto" }}
          >
            OS, dinheiro
          </span>
          <br />e controle.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
        >
          O <strong className="text-white">SmartLoop</strong> unifica toda a operação da sua assistência técnica —
          OS, clientes, financeiro, equipe e estoque — em uma única plataforma inteligente.{" "}
          <span className="text-slate-300">Do celular do técnico ao relatório do dono.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_32px_rgba(124,58,237,0.4)] hover:shadow-[0_0_48px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300"
          >
            Começar grátis por 14 dias
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#funcionalidades"
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all"
          >
            Ver como funciona
            <ChevronDown className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Social proof mini */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500"
        >
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />14 dias grátis</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />Sem cartão de crédito</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />Cancele quando quiser</span>
        </motion.div>
      </div>

      {/* Dashboard mockup */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="animate-float relative z-10 mx-auto mt-16 max-w-5xl w-full px-6"
      >
        {/* Glow */}
        <div className="absolute inset-x-8 -bottom-8 h-16 rounded-full bg-[#7c3aed]/30 blur-2xl" />
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1526]/90 shadow-2xl backdrop-blur-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[#ef4444]/70" />
            <div className="h-3 w-3 rounded-full bg-[#f59e0b]/70" />
            <div className="h-3 w-3 rounded-full bg-[#10b981]/70" />
            <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">
              app.smartloop.com.br/os
            </div>
          </div>
          {/* Dashboard preview */}
          <div className="flex h-72 md:h-96">
            {/* Sidebar mini */}
            <div className="hidden md:flex w-14 flex-col items-center gap-4 border-r border-white/5 bg-white/3 py-5">
              {[ClipboardList, Users, Package, BarChart2].map((Icon, i) => (
                <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? "bg-[#2563eb]" : "bg-white/5"}`}>
                  <Icon className="h-4 w-4 text-white/60" />
                </div>
              ))}
            </div>
            {/* Content */}
            <div className="flex-1 p-5 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
                {[
                  { label: "OS abertas", value: "12", color: "from-[#2563eb]/20 to-[#2563eb]/5" },
                  { label: "Faturamento", value: "R$ 4.890", color: "from-[#10b981]/20 to-[#10b981]/5" },
                  { label: "Prontas", value: "3", color: "from-[#f59e0b]/20 to-[#f59e0b]/5" },
                  { label: "Clientes", value: "127", color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5" },
                ].map((card) => (
                  <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.color} border border-white/5 p-3`}>
                    <p className="text-[10px] text-slate-500 mb-1">{card.label}</p>
                    <p className="text-base font-bold text-white">{card.value}</p>
                  </div>
                ))}
              </div>
              {/* Kanban preview */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {["Recebido", "Em análise", "Aguardando", "Pronto", "Entregue"].map((col, i) => (
                  <div key={col} className="rounded-lg border border-white/5 bg-white/3 p-2">
                    <div className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold
                      ${i === 0 ? "bg-[#6366f1]/20 text-[#a5b4fc]"
                        : i === 1 ? "bg-[#f59e0b]/20 text-[#fcd34d]"
                        : i === 2 ? "bg-[#ef4444]/20 text-[#fca5a5]"
                        : i === 3 ? "bg-[#10b981]/20 text-[#6ee7b7]"
                        : "bg-white/10 text-slate-500"}`}
                    >
                      {col}
                    </div>
                    {i < 3 && (
                      <div className="space-y-1.5">
                        {[...Array(i === 1 ? 2 : 1)].map((_, j) => (
                          <div key={j} className="rounded-md bg-white/5 p-2">
                            <div className="h-1.5 w-12 rounded bg-white/20 mb-1" />
                            <div className="h-1.5 w-8 rounded bg-white/10" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-12 mb-8 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="flex h-9 w-5 items-start justify-center rounded-full border-2 border-white/20 pt-1.5"
        >
          <div className="h-1.5 w-1 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Pain Section
─────────────────────────────────────────── */
const PAINS = [
  {
    emoji: "📋",
    title: "OS anotadas em papel ou caderno",
    desc: "Clientes ligando perguntando o status do aparelho. Técnico sem saber o que fazer. OS desaparecendo.",
  },
  {
    emoji: "💸",
    title: "Sem saber quanto entrou hoje",
    desc: "Fim do dia e você não sabe se lucrou ou perdeu. Dinheiro no caixa, mas contas chegando. Financeiro no feeling.",
  },
  {
    emoji: "🗂️",
    title: "Dados espalhados em mil lugares",
    desc: "Planilha, caderno, WhatsApp, notas do celular. Quando você mais precisa de uma informação, ela some.",
  },
  {
    emoji: "👤",
    title: "Técnico novo, caos total",
    desc: "Cada técnico tem seu próprio jeito. Não existe processo. Onboarding? Qual onboarding?",
  },
  {
    emoji: "📈",
    title: "Crescendo, mas sem estrutura",
    desc: "Segunda filial abrindo, mais técnicos chegando, mais OS — e você gerenciando tudo no braço.",
  },
  {
    emoji: "🔧",
    title: "Sistema incompleto ou quebrado",
    desc: "Pagando por 3 ferramentas diferentes que não conversam entre si. Funcionalidade que você precisa? Não tem.",
  },
]

function PainSection() {
  return (
    <section className="bg-[#060918] py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 mb-6">
            <AlertTriangle className="h-3.5 w-3.5" />
            A realidade de quem cresce sem sistema
          </span>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl leading-tight">
            Reconhece alguma<br />
            <span className="text-slate-500">dessas situações?</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Se você é dono de assistência técnica em crescimento, pelo menos uma dessas situações te acompanha todo dia.
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAINS.map((pain) => (
            <motion.div
              key={pain.title}
              variants={FU()}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-white/5 to-white/2 p-6 backdrop-blur-sm hover:border-red-500/30 hover:from-red-500/8 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-transparent transition-all duration-500" />
              <span className="text-3xl">{pain.emoji}</span>
              <h3 className="mt-3 text-base font-bold text-white">{pain.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{pain.desc}</p>
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-5">
            <span className="text-2xl">😤</span>
            <p className="text-slate-300 text-sm">
              <strong className="text-white">Você não está sozinho.</strong>{" "}
              87% dos donos de assistências técnicas relatam pelo menos 3 desses problemas.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Solution Section
─────────────────────────────────────────── */
function SolutionSection() {
  return (
    <section className="relative overflow-hidden bg-white py-28 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-px w-full max-w-3xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#2563eb]/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center mb-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#2563eb]/30 bg-[#2563eb]/8 px-4 py-1.5 text-xs font-semibold text-[#2563eb] mb-6">
            <Zap className="h-3.5 w-3.5" />
            A solução
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl md:text-5xl leading-tight">
            Tudo que sua assistência precisa.<br />
            <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">
              Em um lugar só.
            </span>
          </h2>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-slate-500 leading-relaxed">
            O SmartLoop foi construído do zero para assistências técnicas brasileiras.
            Da abertura da OS ao dinheiro no caixa — tudo conectado, tudo em tempo real.
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              color: "text-[#2563eb]",
              bg: "bg-[#2563eb]/10",
              title: "OS do jeito certo",
              desc: "Abra, acompanhe e conclua ordens de serviço com fotos, IMEI, orçamento e aprovação do cliente — tudo em menos de 2 minutos.",
            },
            {
              icon: BarChart2,
              color: "text-[#7c3aed]",
              bg: "bg-[#7c3aed]/10",
              title: "Financeiro em tempo real",
              desc: "Saiba exatamente quanto entrou, quanto vai entrar e quanto saiu. PDV integrado, formas de pagamento e relatórios automáticos.",
            },
            {
              icon: Users,
              color: "text-[#10b981]",
              bg: "bg-[#10b981]/10",
              title: "Equipe alinhada",
              desc: "Cada técnico vê exatamente o que precisa fazer. Proprietário vê tudo. Atendente registra. Hierarquia de acesso por papel.",
            },
          ].map((item) => (
            <motion.div key={item.title} variants={FU()} className="flex flex-col items-start">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} mb-5`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Features Section
─────────────────────────────────────────── */
const FEATURES = [
  {
    id: "os",
    tab: "Ordens de Serviço",
    icon: ClipboardList,
    headline: "Da abertura ao encerramento. Sem perder nada.",
    items: [
      "Leitor de IMEI via câmera (iOS e Android)",
      "Upload de fotos do aparelho via QR Code",
      "Kanban de status em tempo real",
      "Orçamento com PDF e aprovação por link",
      "Notificações WhatsApp automáticas ao cliente",
      "Histórico completo de cada aparelho",
    ],
    mockup_color: "from-[#2563eb]/20 to-[#6366f1]/10",
  },
  {
    id: "financeiro",
    tab: "Financeiro",
    icon: BarChart2,
    headline: "Sabe quanto ganhou hoje. Exatamente.",
    items: [
      "PDV com carrinho e múltiplas formas de pagamento",
      "Contas a receber com alertas de vencimento",
      "Relatório de faturamento por dia/semana/mês",
      "Controle de despesas por categoria",
      "Margem de lucro por serviço automaticamente",
      "Dashboard financeiro em tempo real",
    ],
    mockup_color: "from-[#7c3aed]/20 to-[#8b5cf6]/10",
  },
  {
    id: "estoque",
    tab: "Estoque",
    icon: Package,
    headline: "Nunca mais ficar sem peça na hora errada.",
    items: [
      "Catálogo de peças com SKU e fornecedor",
      "Alertas automáticos de estoque mínimo",
      "Compatibilidade de película e peças por modelo",
      "Movimentação de entrada e saída rastreada",
      "Custo vs. preço de venda e margem",
      "Banco de modelos de celulares do Brasil",
    ],
    mockup_color: "from-[#10b981]/20 to-[#06b6d4]/10",
  },
  {
    id: "equipe",
    tab: "Equipe",
    icon: Users,
    headline: "Gerencie sua equipe. Sem microgerenciar.",
    items: [
      "Perfis: Proprietário, Técnico, Atendente",
      "Cada técnico vê apenas suas OS",
      "Histórico de desempenho por técnico",
      "Comissões automáticas por serviço",
      "Múltiplas filiais no mesmo painel",
      "Acesso via PWA — funciona como app",
    ],
    mockup_color: "from-[#f97316]/20 to-[#fbbf24]/10",
  },
]

function FeaturesSection() {
  const [active, setActive] = useState("os")
  const feature = FEATURES.find(f => f.id === active)!

  return (
    <section id="funcionalidades" className="bg-slate-50 py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl md:text-5xl">
            Funcionalidades pensadas<br />
            <span className="text-slate-400">para quem repara celular</span>
          </h2>
        </Reveal>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active === f.id
                  ? "bg-slate-900 text-white shadow-lg"
                  : "border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
              }`}
            >
              <f.icon className="h-4 w-4" />
              {f.tab}
            </button>
          ))}
        </div>

        {/* Feature content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center"
        >
          {/* Left — text */}
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-6 leading-snug">
              {feature.headline}
            </h3>
            <ul className="space-y-3.5">
              {feature.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10">
                    <Check className="h-3 w-3 text-[#2563eb]" />
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors">
              Ver na prática
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right — visual mockup */}
          <div className="animate-float-slow relative">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.mockup_color} blur-3xl opacity-60`} />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50">
              {/* Mini kanban/table mockup */}
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <div className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${feature.mockup_color}`} />
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-2 rounded-full bg-slate-200`} style={{ width: `${60 + i * 10}%` }} />
                      <div className="h-1.5 w-1/2 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <div className="flex-1 h-8 rounded-lg bg-gradient-to-r from-[#2563eb] to-[#7c3aed] opacity-80" />
                <div className="w-24 h-8 rounded-lg border border-slate-200" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Differentials
─────────────────────────────────────────── */
const DIFFS = [
  { icon: Scan,        title: "Leitor de IMEI",        desc: "Câmera lê o IMEI do aparelho em tempo real — sem digitar nada." },
  { icon: QrCode,      title: "Fotos via QR Code",     desc: "Técnico gera QR. Cliente fotografa o aparelho pelo próprio celular." },
  { icon: FileText,    title: "Aprovação por link",    desc: "Cliente aprova o orçamento pelo WhatsApp, sem criar conta." },
  { icon: Smartphone,  title: "PWA instalável",        desc: "Funciona como app no iOS e Android. Sem app store." },
  { icon: TrendingUp,  title: "Multi-filial",          desc: "Gerencie várias lojas no mesmo painel, com dados isolados." },
  { icon: Zap,         title: "Notificações auto.",    desc: "WhatsApp automático ao receber, ao ficar pronto, ao entregar." },
]

function DifferentialsSection() {
  return (
    <section className="bg-[#060918] py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-4 py-1.5 text-xs font-semibold text-[#a78bfa] mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            O que nenhum outro sistema tem
          </span>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
            Diferenciais que fazem<br />
            <span className="text-slate-400">a diferença no dia a dia</span>
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {DIFFS.map((d) => (
            <motion.div
              key={d.title}
              variants={FU()}
              className="group rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/8 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb]/20 to-[#7c3aed]/20">
                <d.icon className="h-5 w-5 text-[#a78bfa] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{d.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{d.desc}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Stats
─────────────────────────────────────────── */
function StatsSection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <RevealGroup className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          {[
            { value: "2.400+", label: "OS gerenciadas/mês" },
            { value: "98%",    label: "Taxa de satisfação" },
            { value: "3h",     label: "Economizadas por técnico/dia" },
            { value: "R$ 0",   label: "Para começar" },
          ].map((s) => (
            <motion.div key={s.label} variants={FU()}>
              <p className="text-4xl font-black text-slate-900 leading-none">{s.value}</p>
              <p className="mt-2 text-sm text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Pricing
─────────────────────────────────────────── */
const PLANS = [
  {
    name: "Básico",
    price: "69,90",
    desc: "Para quem está começando",
    features: ["Até 100 OS/mês", "2 usuários", "Clientes e OS básico", "Estoque básico", "Suporte por e-mail"],
    missing: ["PDV e caixa", "Relatórios avançados", "Multi-filial"],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "89,90",
    desc: "Para quem quer crescer",
    features: ["OS ilimitadas", "5 usuários", "PDV completo", "Financeiro avançado", "Relatórios e dashboards", "Notificações WhatsApp", "Garantia digital", "Suporte prioritário"],
    missing: ["API pública", "White-label"],
    cta: "Começar grátis — mais popular",
    highlight: true,
  },
  {
    name: "Premium",
    price: "149,90",
    desc: "Para redes e franquias",
    features: ["Tudo do Pro", "Usuários ilimitados", "Multi-filial", "API pública + webhooks", "White-label", "Integração Mercado Pago", "Onboarding dedicado", "SLA garantido"],
    missing: [],
    cta: "Falar com especialista",
    highlight: false,
  },
]

function PricingSection() {
  return (
    <section id="precos" className="bg-slate-50 py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Preço justo para o tamanho<br className="hidden sm:block" />
            <span className="text-slate-400"> da sua operação</span>
          </h2>
          <p className="mt-4 text-slate-500">14 dias grátis em todos os planos. Sem cartão de crédito.</p>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={FU()}
              className={`relative flex flex-col rounded-2xl p-7 ${
                plan.highlight
                  ? "bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] text-white shadow-2xl shadow-[#7c3aed]/20 ring-2 ring-[#7c3aed]/50 scale-[1.02]"
                  : "border border-slate-200 bg-white"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-lg">
                  ⭐ Mais escolhido
                </div>
              )}
              <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-[#a78bfa]" : "text-[#2563eb]"}`}>
                {plan.name}
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  R$ {plan.price}
                </span>
                <span className={`mb-1 text-sm ${plan.highlight ? "text-slate-400" : "text-slate-400"}`}>/mês</span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-[#34d399]" : "text-[#10b981]"}`} />
                    <span className={plan.highlight ? "text-slate-300" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm opacity-40">
                    <X className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-slate-400 line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white hover:opacity-90 hover:scale-[1.02] shadow-[0_0_24px_rgba(124,58,237,0.4)]"
                    : "border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal className="mt-10 text-center text-sm text-slate-500">
          Precisa de algo diferente?{" "}
          <Link href="#" className="text-[#2563eb] font-medium hover:underline">
            Fale com nossa equipe
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Testimonial
─────────────────────────────────────────── */
function TestimonialSection() {
  return (
    <section className="bg-white py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-14">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            O que donos de assistência dizem
          </h2>
        </Reveal>
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { name: "Pedro Victor", role: "Assistência Connect — Araguaína, TO", text: "Antes eu perdia OS toda semana. Agora tudo está no SmartLoop. Meu faturamento subiu 30% no segundo mês." },
            { name: "Marcos Lima", role: "TechFix — São Luís, MA", text: "A funcionalidade de aprovação de orçamento pelo WhatsApp é genial. Cliente aprova em segundos e eu começo o serviço." },
            { name: "Fernanda Reis", role: "Celulares & Cia — Goiânia, GO", text: "Abri a segunda filial com confiança porque o SmartLoop gerencia as duas no mesmo lugar. Antes seria impossível." },
          ].map((t) => (
            <motion.div key={t.name} variants={FU()} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />)}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────
   Final CTA
─────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#060918] py-28 px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/15 blur-[120px]" />
      </div>
      <Reveal className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#7c3aed] mb-8 shadow-[0_0_48px_rgba(124,58,237,0.5)]">
          <Wrench className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl leading-tight">
          Sua assistência merece<br />
          <span className="bg-gradient-to-r from-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
            um sistema à altura.
          </span>
        </h2>
        <p className="mt-6 text-lg text-slate-400 leading-relaxed">
          Comece hoje. 14 dias grátis, sem cartão, sem burocracia.<br />
          Se não resolver sua vida, cancele sem perguntas.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:shadow-[0_0_60px_rgba(124,58,237,0.7)] hover:scale-105 transition-all duration-300"
          >
            Começar grátis agora
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-600">
          ✓ Sem cartão &nbsp;·&nbsp; ✓ 14 dias grátis &nbsp;·&nbsp; ✓ Cancele quando quiser
        </p>
      </Reveal>
    </section>
  )
}

/* ───────────────────────────────────────────
   Footer
─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#030712] border-t border-white/5 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563eb] to-[#7c3aed]">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold text-white">
                Smart<span className="text-[#60a5fa]">Loop</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sistema de gestão completo para assistências técnicas no Brasil.
            </p>
            <div className="mt-5 flex gap-3">
              {[Link2, ExternalLink, Globe].map((Icon, i) => (
                <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Produto",
              links: ["Funcionalidades", "Preços", "Changelog", "Roadmap", "Status"],
            },
            {
              title: "Empresa",
              links: ["Sobre nós", "Blog", "Carreiras", "Imprensa", "Parceiros"],
            },
            {
              title: "Suporte",
              links: ["Central de Ajuda", "Documentação", "API", "Fale conosco", "Comunidade"],
            },
            {
              title: "Legal",
              links: ["Termos de Uso", "Privacidade", "Cookies", "LGPD"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-white/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            © 2026 SmartLoop — uma iniciativa da{" "}
            <span className="text-slate-400 font-medium">Connect Assistência</span>
            {" "}·{" "}
            <span className="text-slate-500">Desenvolvido por Lazy Labs</span>
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Mail,  text: "suporte@smartloop.com.br" },
              { icon: Phone, text: "(99) 99999-9999" },
            ].map(({ icon: Icon, text }) => (
              <a key={text} href="#" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-white transition-colors">
                <Icon className="h-3.5 w-3.5" />
                {text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ───────────────────────────────────────────
   Page
─────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainSection />
        <SolutionSection />
        <FeaturesSection />
        <DifferentialsSection />
        <StatsSection />
        <PricingSection />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
