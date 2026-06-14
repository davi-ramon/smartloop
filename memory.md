# SmartLoop — Memória & Contexto do Projeto

> **Para a IA que está lendo:** este arquivo é a fonte da verdade de contexto do projeto **SmartLoop**.
> Leia-o por completo antes de produzir qualquer output. Ele descreve o produto, as pessoas, o
> acordo comercial, a stack técnica, o estado atual do código e o fluxo de trabalho multi-agente.
> Atualizado em: **13/06/2026**.

---

## 1. O PRODUTO

- **Nome comercial / marca:** **SmartLoop** (domínio em produção: `smartloop-94a06.web.app`; domínio alvo: `smartloop.com.br`).
- **Nome interno / legado:** **FixOS** (ainda aparece em `CLAUDE.md`, `CONTEXTO_FIXOS.md` e em alguns textos — é o **mesmo produto**; a marca pública é SmartLoop).
- **Tipo:** Micro-SaaS B2B, multi-tenant, assinatura mensal recorrente.
- **Mercado-alvo:** assistências técnicas de celulares e eletrônicos no Brasil.
- **Tagline:** "A OS que resolve. O sistema que escala."
- **Pitch:** sistema de gestão completo para assistência técnica — OS, clientes, financeiro, estoque, PDV, equipe — tudo unificado e em tempo real. Referência de mercado: **Ordemfy** (auditado em `auditorias/orderfy/`) e Agenda Boa.

### Diferenciais (o que nenhum concorrente tem)
1. **Leitor de IMEI por câmera** (WebRTC) + validação por algoritmo de **Luhn**.
2. **Upload de fotos do aparelho via QR Code** — token público, sem login.
3. **Aprovação de orçamento por link** (cliente aprova pelo WhatsApp, sem conta).
4. **Banco de compatibilidade** de películas/peças por modelo.
5. **PWA instalável** (iOS/Android, sem app store).
6. **Multi-tenant** com isolamento por loja e níveis de acesso.

---

## 2. AS PARTES

### Contratante / dono do produto
- **Pessoa:** **Pedro Victor Ribeiro Silva**.
- **Empresa:** **Connect Assistência** (Nome Fantasia: Assistência Connect) — MEI, CNPJ `48.257.434/0001-06`.
- **Local:** Araguaína/TO.
- **Instagram:** @negociosdopedao (18.100+ seguidores no nicho de assistência técnica).
- **Papel:** dono do produto, marketing, networking, **cliente beta #1**, investidor. **É o autor/idealizador do produto** (junto com a Lazy Labs no desenvolvimento).
- **Ativos estratégicos:** audiência orgânica pré-aquecida; acesso a **Moisés (Imperosa)** — grande distribuidor de peças do Norte/Nordeste; rede de técnicos em Araguaína (garante os primeiros ~20 assinantes); contato indireto com **Will Nery** (grande reparador do TO, potencial distribuidor nacional). Sentiu a dor em 1ª pessoa: usava sistema de R$909/ano sem IMEI reader, sem QR Code, sem níveis de acesso.

### Contratada / desenvolvimento
- **Pessoa:** **Deyvid Ramon Ferreira Amaral**.
- **Empresa:** **Lazy Labs** — MEI, CNPJ `51.299.197/0001-42`.
- **Local:** Imperatriz/MA.
- **Papel:** desenvolvimento, arquitetura, DevOps, suporte, **co-fundador técnico**.
- **Comunicação:** WhatsApp; updates semanais aos domingos com print do progresso.

---

## 3. A REUNIÃO E O ACORDO (27/05/2026)

- Reunião de **118 minutos** em 27/05/2026; contrato assinado e PIX no mesmo dia.
- Negociação: proposta inicial de Deyvid R$4.997 → contraproposta de Pedro R$3.000 + 10% do negócio.
- **Acordo final:** **R$3.000 + 10% equity + 10% do MRR líquido**.

| Item | Valor | Status |
|------|-------|--------|
| 1ª parcela (honorários) | R$1.500 | ✅ **PAGO via PIX 27/05/2026** |
| 2ª parcela (entrega MVP) | R$1.500 | 🔲 Devida na entrega do MVP (até 26/06/2026) |
| Revenue share | 10% do lucro líquido mensal | 🔄 A partir do 1º assinante pagante |
| Equity | 10% das quotas | 📝 Formalizar até 60 dias após v2.0 |

- **Ticket do produto:** R$89,90/mês (plano Pro). Meta otimista de Pedro: 100–200 assinantes no mês 1.

---

## 4. CRONOGRAMA

- **Início:** 27/05/2026. **Deadline MVP:** 26/06/2026 (D+30). **Sistema completo v2.0:** 26/07/2026 (D+60).
- **Semana 1** (28/mai–03/jun): infraestrutura ✅ — repo, Next.js, design system, libs, layout.
- **Semana 2** (04–10/jun): leitor IMEI por câmera + cadastro de OS + Kanban funcional.
- **Semana 3** (11–17/jun): QR Code upload + orçamento PDF + WhatsApp.
- **Semana 4** (18–26/jun): billing + onboarding + níveis de acesso + deploy de produção.
- **Fase 2** (semanas 5–8): multi-tenancy/RLS, dashboard, relatórios, compatibilidade, PWA, landing.

---

## 5. STACK TÉCNICA (definitiva)

**Frontend** — bonito, elegante, moderno, minimalista **e** rápido (missão inegociável):
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** (sem `tailwind.config.js`; usa `@theme` em `globals.css`).
- **Radix UI** (primitives) + **shadcn/ui** (padrão de componentes) — `src/components/ui/`.
- **Lucide React** — ícones flat, monocromáticos.
- **Motion** (ex-Framer Motion) — animações sutis, hover, cards interativos, background animado.
- **React Hook Form** + **Zod** — formulários e validação.
- **TanStack Table** + virtualização — tabelas/listas grandes.
- **Zustand** — estado local/client-side (ex.: `src/store/sidebar.ts`).

**Dados / Backend:**
- **Firebase Firestore** (snapshots) — dados em tempo real (status de OS ao vivo).
- **Firebase Authentication** — auth (e-mail/senha + Google).
- **Firebase Storage** — fotos, anexos, comprovantes, logs.
- **Supabase (PostgreSQL + RLS)** — dados relacionais e isolamento multi-tenant (schema em `CONTEXTO_FIXOS.md`).
- **Cloud Functions / Cloud Run / Webhooks** — backend e integrações (Stripe, WhatsApp).
- **Stripe** — billing (modo `test` até a entrega do MVP).

**Observabilidade / PWA:**
- **Firebase Performance Monitoring, Analytics, Crashlytics**.
- **PWA**: `manifest.json` + Service Worker + cache estratégico.

**Estilo visual:**
- Tema **Dark + Light**, **padrão Light**.
- **Sidebar animada** recolhível/expansível: colapsada (64px, só ícones) → expande ao **hover** (240px, ícones + labels). Botão de fixar (pin).
- App separado por **rotas** (`/os`, `/clientes`, …) para carregamento rápido.

---

## 6. ESTADO ATUAL DO CÓDIGO (o que já existe)

Repositório local: `C:\dev\smarthloop` (git inicializado, branch `master`). Build estático (`output: "export"`) deployado no **Firebase Hosting**: **https://smartloop-94a06.web.app**.

Páginas implementadas (UI com dados mockados, prontas para ligar a dados reais):
- **Landing page** (`/`): estilo Stripe — hero dark com orbs animados, dores do dono de AT, solução, features em tabs, diferenciais, pricing (3 planos), depoimentos, CTA, footer.
- **Login** (`/login`): e-mail/senha + Google (UI).
- **App autenticado** (grupo `(dashboard)`, com sidebar animada):
  - `/os` — Kanban (5 colunas) + lista tabelada + busca/filtro.
  - `/os/nova` — formulário multi-step (cliente → aparelho → IMEI/câmera/QR → defeito).
  - `/clientes`, `/tecnicos`, `/fornecedores`, `/estoque` (alertas de estoque mínimo),
    `/pdv` (carrinho + pagamentos), `/orcamento-rapido`, `/financeiro`, `/garantia`,
    `/relatorios`, `/configuracoes` (tabs por domínio).

Infra de código: `src/lib/supabase/` (client+server), `src/lib/firebase/config.ts`, `src/types/database.ts` (tipos do schema), design system completo em `src/app/globals.css`.

Firebase: projeto **`smartloop-94a06`** (nº `716043222051`), conta `ads.deyvid@gmail.com`. Configs: `.firebaserc`, `firebase.json` (public `out/`, rewrites SPA).

> ⚠️ Pendências conhecidas: dados ainda mockados (sem persistência real); RLS/Firestore rules não configurados; IMEI reader, QR upload e billing ainda não implementados (Semanas 2–4).

---

## 7. TERMINOLOGIA OBRIGATÓRIA (UI em PT-BR)

- **OS** = Ordem de Serviço (nunca "ticket"/"work order").
- **Orçamento** (nunca "quote" visível). **Estoque** (nunca "inventory"). **Peças** (nunca "parts").
- **Status da OS:** `received` → `analyzing` → `waiting_part` → `ready` → `delivered` | `cancelled`.

---

## 8. DESIGN SYSTEM

- Azul primário `#2563eb`; laranja accent `#f97316`/`#ea580c`; radius `0.5rem`.
- Tokens como variáveis CSS em `globals.css` (`--primary`, `--accent`, `--status-*`, sidebar etc.).
- Tema Light padrão, Dark via classe `.dark`.

---

## 9. FLUXO DE TRABALHO MULTI-AGENTE (generator–evaluator loop / "GAN de agentes")

Três IAs colaboram, inspiradas no padrão **GAN** (gerador vs. avaliador) e em **agentes reflexivos**:

1. **Reescritor Técnico (ChatGPT)** — recebe a transcrição de voz (PT-BR, informal) de Deyvid + prints + anexos e a reescreve como **prompt técnico, objetivo e estruturado** em Markdown para o agente Dev. Faz engenharia de prompt; **não escreve código**.
2. **Dev Full-Stack (Claude / este agente)** — implementa features e corrige bugs com base nos prompts reescritos e no feedback do QA. **Fonte da verdade dos bugs = log do console.**
3. **QA Agent (Codex)** — abre o app, faz login, clica nos fluxos, observa **console logs** e comportamento, e **gera um JSON estruturado (500–5000 chars)** com o resultado dos testes. **Não altera código.** Deyvid repassa esse JSON ao Dev, que corrige — e o ciclo se repete até convergir.

**Disciplina de logging (obrigatória no código do Dev):** tratamento de erro robusto em toda função/chamada crítica; logar **acertos e erros** no console com contexto (prefixos como `[SmartLoop][modulo]`, IDs, payloads resumidos); **nunca** engolir erro silenciosamente (sem `catch` vazio). O console é o canal primário de QA.
