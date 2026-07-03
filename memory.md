# SmartLoop — Memória & Contexto do Projeto (`memory.md`)

> **Para a IA/dev que está lendo:** este é o **contexto persistente e fonte única de verdade** do projeto **SmartLoop**. Leia por completo antes de qualquer output. Reflete o estado real do código, arquitetura, integrações, decisões e evolução — de forma que qualquer nova sessão entenda o projeto **sem depender do histórico do chat**.
>
> **Atualizado em:** 03/07/2026 · **Versão do doc:** 2.0 · **Mantido incrementalmente** (adicionar/atualizar; preservar histórico útil).

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Arquivos Importantes](#5-arquivos-importantes)
6. [Configurações](#6-configurações)
7. [Integrações](#7-integrações)
8. [IDs Importantes](#8-ids-importantes)
9. [Tokens e Secrets](#9-tokens-e-secrets)
10. [Banco de Dados](#10-banco-de-dados)
11. [Fluxos](#11-fluxos)
12. [Histórico de Alterações](#12-histórico-de-alterações-changelog)
13. [Últimos Deploys](#13-últimos-deploys)
14. [Bugs Conhecidos / Pendências](#14-bugs-conhecidos--pendências)
15. [TODO](#15-todo)
16. [Decisões Arquiteturais](#16-decisões-arquiteturais)
17. [Convenções](#17-convenções)
18. [Dependências](#18-dependências)
19. [Contexto Atual](#19-contexto-atual)
20. [Próximos Passos](#20-próximos-passos)
- [Apêndice A — Pessoas & Acordo Comercial](#apêndice-a--pessoas--acordo-comercial)
- [Apêndice B — Fluxo Multi-Agente](#apêndice-b--fluxo-de-trabalho-multi-agente)

---

## 1. Visão Geral

- **Nome / marca:** **SmartLoop** (nome interno legado: **FixOS** — mesmo produto; aparece em `CLAUDE.md`/`CONTEXTO_FIXOS.md`).
- **Objetivo:** Micro-SaaS B2B de **gestão completa para assistências técnicas** de celulares/eletrônicos no Brasil — OS, clientes, financeiro, estoque, PDV, equipe — unificado e em tempo real.
- **Problema que resolve:** donos de AT perdem OS, não sabem o faturamento, dados espalhados (papel/planilha/WhatsApp), sem processo para equipe. SmartLoop centraliza tudo.
- **Público-alvo:** assistências técnicas de celular no Brasil (do técnico ao dono).
- **Modelo:** assinatura mensal recorrente, **multi-tenant** (1 dono = 1 loja), trial de 14 dias.
- **Status atual:** **MVP funcional em produção**, em fase **beta** pré-lançamento. Landing, billing (Stripe live), app completo e canal de bugs no ar.
- **Versão atual:** MVP+ (pós-deadline 26/06/2026; refinamentos de lançamento em jul/2026).
- **Domínio oficial:** **https://smartloop.com.br** (conectado, SSL ativo). Fallback: `https://smartloop-94a06.web.app`.
- **Roadmap resumido:** [fechar trial com cartão no início] → [2FA opcional] → [App Check] → [formulário de qualificação do plano Personalizado] → v2.0 (multi-filial avançado, API pública, white-label).

Diferenciais: leitor de IMEI por câmera (WebRTC + Luhn), upload de fotos por QR Code (sem login), aprovação de orçamento por link/WhatsApp, PWA instalável, multi-tenant com isolamento por loja.

---

## 2. Arquitetura

**Modelo geral:** SPA estática (Next.js `output: export`) hospedada no Firebase Hosting + **todo o backend em Cloud Functions v2** (não há SSR/rotas de servidor no Next). Dados em tempo real via Firestore (`onSnapshot`).

- **Frontend:** Next.js 16 App Router, **static export**. Sem middleware/SSR — guardas de rota são **client-side** (`src/components/auth/protected.tsx`). Dados realtime via listeners Firestore compartilhados num Context (`WorkspaceProvider`).
- **Backend:** **Firebase Cloud Functions v2**, região `southamerica-east1`, Node 20. `onCall` (operações autenticadas), `onRequest` (webhooks/públicos, com `cors`), `onSchedule` (cron), `onDocumentCreated` (trigger Firestore). Guardrail `maxInstances: 10` (anti-DoS de custo).
- **Banco:** **Firebase Firestore** (default DB, `southamerica-east1`, modo produção) — é o banco principal. Multi-tenant: dados em `tenants/{tenantId}/...` onde **`tenantId == uid do dono`**.
- **Auth:** Firebase Authentication (e-mail/senha + Google). Reset de senha por **código de 6 dígitos** (não link nativo).
- **Autorização:** Firestore Security Rules decidem acesso por `request.auth.uid == tenantId` (não por campo editável). Admin do repositório de bugs por `request.auth.token.email` (allowlist).
- **Storage:** Firebase Storage (bucket US) — logos, fotos de produto/OS, anexos de bug.
- **Billing:** Stripe (Checkout Sessions, Billing Portal, Webhooks). **Modo LIVE** (produção).
- **Integrações/automação:** Telegram Bot API + Gmail SMTP (nodemailer) para notificações de release e digests; webhook Stripe para sincronizar assinatura.
- **Cache/filas:** não há Redis/filas. Realtime = snapshots Firestore. Agendamento = Cloud Scheduler (via `onSchedule`).

---

## 3. Stack Tecnológica

**Frontend**
- Next.js 16 (App Router, static export) · React 19 · TypeScript 5
- Tailwind CSS v4 (`@theme` em `globals.css`, sem `tailwind.config.js`)
- Radix UI + shadcn/ui (`src/components/ui/`) · Lucide React (ícones)
- **motion** (ex-Framer Motion) v12 — animações
- React Hook Form + Zod · TanStack Table · Zustand (`src/store/`)
- cmdk (command palette / busca global) · jsPDF (PDF de orçamento) · qrcode / react-qr-code · @zxing (IMEI, planejado)

**Backend / Infra**
- Firebase: Firestore, Auth, Storage, Cloud Functions v2, Secret Manager, Hosting, Cloud Scheduler, Eventarc (Blaze plan)
- Node 20 · nodemailer (Gmail SMTP) · stripe (SDK) · firebase-admin
- Stripe (billing) · Telegram Bot API (notificações)
- Supabase (`@supabase/*` presente em `src/lib/supabase/`, mas **praticamente não usado** — Firestore é o banco)

**Ferramentas:** ESLint 9 + eslint-config-next · GitHub CLI (`gh`) · Firebase CLI · git.

---

## 4. Estrutura de Diretórios

```
C:\dev\smarthloop\
├── src/
│   ├── app/
│   │   ├── (auth)/            # login, cadastro, recuperar-senha
│   │   ├── (dashboard)/       # área autenticada (layout com Sidebar + Header + WorkspaceProvider + BugReportWidget)
│   │   │   ├── home/ os/ clientes/ tecnicos/ fornecedores/
│   │   │   ├── pdv/ orcamento-rapido/ estoque/ financeiro/
│   │   │   ├── garantia/ relatorios/ configuracoes/
│   │   │   └── relatorios-bugs/   # repositório de bugs (só admin)
│   │   ├── onboarding/        # onboarding obrigatório (Typeform-like)
│   │   ├── orcamento/         # aprovação pública de orçamento (?token=)
│   │   ├── termos/ privacidade/ cookies/ lgpd/   # páginas legais
│   │   ├── page.tsx           # LANDING PAGE
│   │   └── globals.css        # design system (tokens CSS @theme)
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── layout/            # sidebar, header, page-transition, global-search, notifications
│   │   ├── home/ charts/      # dashboard: period-filter, mini-charts (SVG)
│   │   ├── billing/           # subscription-blocked, subscription-banner
│   │   ├── bug-report/        # bug-report-widget (botão flutuante + painel Typeform)
│   │   ├── landing/ legal/    # cookie-consent, legal-shell
│   │   ├── auth/ shared/      # protected, side-drawer, animated-card, confirm-dialog
│   │   └── clientes/ os/ pdv/ estoque/ fornecedores/ tecnicos/
│   ├── lib/
│   │   ├── firebase/          # config, auth-context, workspace-context, firestore, billing, password-reset, public-quote
│   │   ├── data/              # camadas de dados por domínio (ver §5)
│   │   ├── supabase/          # client/server (legado, pouco uso)
│   │   ├── admins.ts period.ts landing-checkout.ts os-status.ts logger.ts utils.ts
│   ├── store/                 # zustand (sidebar)
│   └── types/                 # database.ts (tipos do schema)
├── functions/                 # Cloud Functions (index.js, package.json)
├── public/                    # estáticos / PWA
├── docs/  auditorias/  qa-agent/   # documentação, auditoria Ordemfy, protocolos QA
├── firestore.rules  storage.rules  firestore.indexes.json  firebase.json
├── CLAUDE.md  AGENTS.md  CONTEXTO_FIXOS.md  README.md  memory.md
```

Responsabilidades-chave:
- `src/lib/data/*` — cada arquivo é a **camada de acesso** (watch/CRUD) de um domínio: `service-orders.ts`, `customers.ts`, `parts.ts`, `products.ts`, `sales.ts`, `finance.ts`, `technicians.ts`, `suppliers.ts`, `quotes.ts`, `tenant.ts`, `bug-reports.ts`, `product-io.ts`, `quote-pdf.ts`.
- `src/lib/firebase/workspace-context.tsx` — **um único** conjunto de listeners realtime de todas as coleções, consumido por Home, busca global e notificações.

---

## 5. Arquivos Importantes

| Arquivo | Função |
|---|---|
| `functions/index.js` | **Todo o backend** — 15 Cloud Functions (ver §7/§11) |
| `firestore.rules` | Isolamento multi-tenant + regras de `bugReports` |
| `storage.rules` | Acesso a arquivos por tenant + anexos de bug |
| `firebase.json` / `.firebaserc` | Hosting (`out/`), functions, rules; projeto `smartloop-94a06` |
| `src/lib/firebase/config.ts` | Init do Firebase (env vars públicas) |
| `src/lib/firebase/auth-context.tsx` | Sessão, login/cadastro, timeout de sessão |
| `src/lib/firebase/workspace-context.tsx` | Listeners realtime compartilhados |
| `src/lib/firebase/billing.ts` | `startCheckout`, `openPortal`, `accessState` (gate trial/assinatura) |
| `src/lib/landing-checkout.ts` | Checkout direto da landing (cobrança imediata) |
| `src/lib/logger.ts` | Logger estruturado `[SmartLoop][modulo]` |
| `src/lib/os-status.ts` | Metadados/cores dos status de OS + ordem Kanban |
| `src/lib/admins.ts` | Allowlist de e-mails admin/dev |
| `src/app/page.tsx` | Landing page (hero, pricing, legais, cookies) |
| `src/components/bug-report/bug-report-widget.tsx` | Canal de reporte de bugs (beta) |
| `next.config.ts` | `output: "export"` (static) |

---

## 6. Configurações

- **Region das Functions:** `southamerica-east1`. **`APP_URL`** (constante em `functions/index.js`) = `https://smartloop.com.br`.
- **Domínios:** oficial `smartloop.com.br` (SSL ok, IP Firebase `199.36.158.100`); fallback `smartloop-94a06.web.app`.
- **Planos (centavos, BRL)** — em `functions/index.js` (`PLANS`) e `src/lib/firebase/billing.ts` + `src/app/page.tsx`:
  - `basic` = **4990** (R$49,90) · `pro` = **8990** (R$89,90) · `premium` = **14990** (R$149,90).
- **Trial:** 14 dias. In-app (`createCheckoutSession`) alinha `trial_end` a `tenant.trialEndsAt`. Direto (`createDirectCheckout`) = **sem trial, cobrança imediata**.
- **Cupons Stripe:** `SMART50` (50%), `SMART75` (75%), `SMART100` (100% = 1 mês grátis), `duration: once`. Campo de cupom habilitado (`allow_promotion_codes`).
- **Timeout de sessão:** `tenant.sessionTimeoutHours` (padrão 3h; 0 = indefinido).
- **Digest de OS:** `dailyOsDigest` roda **09:00 America/Sao_Paulo**; envia se houver OS atrasada (>`tenant.overdueDays ?? 3` dias) ou pronta.
- **Endpoints Cloud Functions (base):** `https://southamerica-east1-smartloop-94a06.cloudfunctions.net/<fn>`.
- **Frontend env (`.env.local`, `NEXT_PUBLIC_*`):** `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID` (chave web é pública por design).

---

## 7. Integrações

| Integração | Uso | Onde |
|---|---|---|
| **Stripe** (LIVE) | Assinaturas, checkout, portal, cupons, webhook | `createCheckoutSession`, `createDirectCheckout`, `createPortalSession`, `stripeWebhook`, `setupCoupons` |
| **Firebase** | Auth, Firestore, Storage, Functions, Hosting, Scheduler | todo o projeto |
| **Telegram Bot API** | Avisos de release + novos bugs no grupo | `notifyRelease`, `getTelegramChatId`, `onBugReportCreated` |
| **Gmail SMTP** (nodemailer) | Códigos de reset, digest de OS, e-mails de release/bug | `requestPasswordResetCode`, `dailyOsDigest`, `notifyRelease`, `onBugReportCreated` |
| **WhatsApp** (wa.me links) | Aprovação de orçamento, "falar com especialista", suporte | landing, orçamento público |
| **GitHub** | Versionamento/portfólio (push a cada release) | repo `davi-ramon/smartloop` |
| **Supabase** | Presente mas ~inativo (Firestore é o banco) | `src/lib/supabase/` |

---

## 8. IDs Importantes

| ID | Valor | Finalidade |
|---|---|---|
| Firebase Project ID | `smartloop-94a06` | Projeto Firebase/GCP |
| Firebase Project Number | `716043222051` | Nº do projeto GCP |
| Region das Functions | `southamerica-east1` | Deploy das Cloud Functions |
| Storage bucket | `smartloop-94a06.firebasestorage.app` | Arquivos |
| Conta Firebase/Google | `ads.deyvid@gmail.com` | Owner do projeto |
| Telegram group chat_id | `-5405925760` | Grupo "SmartLoop - Atualizações" |
| GitHub repo | `github.com/davi-ramon/smartloop` (público, branch `main`) | Código/portfólio |
| E-mails admin/dev | `ads.deyvid@gmail.com`, `deyvid.win7@gmail.com`, `pvrgeral@gmail.com` | Acesso ao repositório de bugs |
| Cupons | `SMART50`, `SMART75`, `SMART100` | Descontos no checkout |

---

## 9. Tokens e Secrets

**Nunca** commitar valores. `.env*`, `*.pem` e chaves estão no `.gitignore` (auditado: nenhum segredo versionado).

**Google Secret Manager (Cloud Functions):**
| Nome | Finalidade | Usado em |
|---|---|---|
| `GMAIL_EMAIL` | Remetente Gmail (`assistenciaconnect07@gmail.com`) | reset, digest, notify, bug |
| `GMAIL_PASSWORD` | Senha de app do Gmail | idem |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe (**LIVE**) | checkout, portal, webhook, coupons |
| `STRIPE_WEBHOOK_SECRET` | Assinatura do webhook Stripe | `stripeWebhook` |
| `TELEGRAM_BOT_TOKEN` | Token do bot (Claude Code Bot) | notify, getChatId, bug |
| `NOTIFY_SECRET` | Protege endpoints `notifyRelease`/`runOsDigestNow`/`getTelegramChatId` (valor no scratchpad da sessão) | idem |

**Frontend (`.env.local`, públicas):** `NEXT_PUBLIC_FIREBASE_*` (ver §6). A API key web do Firebase é pública por design (segurança vem das rules).

**Constantes não-sigilosas em `functions/index.js`:** `TELEGRAM_CHAT_ID`, `TELEGRAM_THREAD_ID` (vazio), `RELEASE_EMAILS`, `APP_URL`, `PLANS`, allowlist de admins.

---

## 10. Banco de Dados

**Firestore** (coleções):
- `users/{uid}` — perfil: `{ uid, tenantId, name, email, role }`. `tenantId` imutável = uid.
- `tenants/{tenantId}` — loja (`tenantId == ownerId == uid`). Campos: nome/fantasyName/cnpj/whatsapp/email/city/logoUrl, `paymentMethods[]`, `productCategories[]`, `sessionTimeoutHours`, `warrantyDays`, `overdueDays`, `onboardingDone`, `trialEndsAt`, billing (`stripeCustomerId`, `subscriptionId`, `subscriptionStatus`, `currentPeriodEnd`), `osCounter`.
  - **Subcoleções:** `customers`, `serviceOrders`, `parts`, `products`, `sales`, `transactions`, `technicians`, `suppliers`, `quotes`.
- `passwordResetCodes/{email}` — `{ codeHash, expiresAt, attempts, createdAt }` (TTL 5min, cooldown 60s).
- `bugReports/{id}` — `{ type, module, description, attachments[], rating, status, userId, userEmail, tenantId, path, createdAt }`. Restrito a admins.

**Índices:** `firestore.indexes.json` — fieldOverride `quotes.approvalToken` (COLLECTION_GROUP) para busca do orçamento público.

**Regras (`firestore.rules`):** acesso por `request.auth.uid == tenantId`; `tenantId`/`ownerId` imutáveis; `delete` negado nos docs raiz; `bugReports` create por qualquer logado, read/update só admin (por e-mail).

**Storage (`storage.rules`):**
- `tenants/{tenantId}/**` — write se `uid == tenantId` (imagem <5MB); **read público** (logos/orçamento). ⚠️ inclui fotos de OS (ver §14).
- `bugReports/{uid}/**` — write do autor (<10MB); read autor ou admin.

---

## 11. Fluxos

- **Cadastro/Login:** `/cadastro` (e-mail/senha/Google) → cria `users` + `tenants` (tenantId=uid, trial 14d) → onboarding obrigatório → dashboard. Reset por código de 6 dígitos (`/recuperar-senha`).
- **Onboarding:** `/onboarding` (Typeform-like), campos obrigatórios validados; `onboardingDone=true` libera o app (guard em `protected.tsx`).
- **OS:** criar (`/os/nova`, número sequencial via transação em `tenant.osCounter`) → Kanban `/os` (received→analyzing→waiting_part→ready→delivered|cancelled) → drawer de detalhes.
- **Orçamento:** gerar → link público `/orcamento?token=` (Cloud Function `getPublicQuote`, Admin SDK) → cliente aprova/recusa (`respondPublicQuote`) → PDF (jsPDF).
- **Checkout (2 fluxos):**
  1. **"Escolher este plano"** (landing) → `createDirectCheckout` → Stripe **cobrança imediata**.
  2. **"Começar grátis 14 dias"** → `/cadastro` → conta + trial; assinatura/cartão via `createCheckoutSession` (in-app, trial alinhado) e tela de bloqueio pós-trial (`subscription-blocked`).
- **Webhook Stripe:** `stripeWebhook` valida assinatura → `updateTenantSubscription` grava `subscriptionStatus` no tenant → `accessState` decide acesso (ok/trial/past_due/blocked).
- **Dashboard (Home):** KPIs + gráficos SVG + filtros de período + busca global (⌘K) + notificações (estoque baixo, orçamentos pendentes, OS aguardando peça/prontas/paradas).
- **Digest diário:** `dailyOsDigest` (9h) → e-mail por loja com OS atrasadas/prontas.
- **Reporte de bug (beta):** botão flutuante → painel Typeform (tipo → módulo → descrição ≥90 chars / voz Web Speech API → anexos → NPS) → `bugReports` + Storage → `onBugReportCreated` avisa admins (Telegram+e-mail) → repositório `/relatorios-bugs`.
- **Notificação de release (rotina do dev):** implementar → `git commit` → `git push` (GitHub) → `notifyRelease` (Telegram + e-mail). Payload **sempre via arquivo UTF-8** (acentos).

---

## 12. Histórico de Alterações (changelog)

> Ordem cronológica recente no topo. Ver `git log` para detalhe fino.

- **2026-07-03** — `fix(dominio)`: `APP_URL` e links dos e-mails/checkout migrados de `.web.app` para **smartloop.com.br** (corrige "voltar" do checkout). *(commit `8adeed5`)*
- **2026-07-02/03** — `feat(landing)`: Básico R$49,90, CTAs "Escolher este plano" → checkout direto (cobrança imediata), 4º plano Personalizado (WhatsApp), removido "sem cartão", páginas legais (/termos /privacidade /cookies /lgpd), consentimento de cookies, rodapé (suporte@smartloop.com.br, (63) 99108-9086). *(`1f68e3b`)*
- **2026-07-02** — `feat(beta)`: canal de reporte de bugs (painel Typeform + voz + anexos) + repositório admin + `onBugReportCreated`. *(`0073d28`)*
- **2026-07-02** — `feat(seguranca)`: digest diário de OS por e-mail + `maxInstances=10` (anti-DoS). Auditoria de segurança OK, multi-tenant confirmado. *(`04fcef9`)*
- **2026-07-02** — `chore(notify)` + `feat(notify)`: canal de release Telegram+e-mail (`notifyRelease`, `getTelegramChatId`), grupo conectado. *(`59a6d87`, `dc7ef0c`)*
- **2026-07-02** — `feat(home)`: dashboard vivo — KPIs, filtros de período, gráficos SVG, busca global (cmdk), notificações, WorkspaceProvider. *(`7f7b715`)*
- **2026-07-02** — `feat(billing)`: preço Básico R$49,90 + cupons SMART50/75/100 + campo de cupom. *(`8775dca`)*
- **2026-07-01/02** — `feat(billing)`: Stripe checkout (trial 14d + cartão), portal, webhook, bloqueio pós-trial. *(`0cfe66b`)*
- **2026 (antes)** — SEC-1 (fechar escalonamento entre tenants nas rules), SEC-2 (cooldown reset), recuperação por código, onboarding obrigatório, PDV, relatórios reais, PDF de orçamento, técnicos, camada Firestore de todos os módulos.

---

## 13. Últimos Deploys

- **Ambiente:** produção (Firebase `smartloop-94a06`).
- **Hosting:** `smartloop.com.br` + `smartloop-94a06.web.app` — última release estável (landing + billing + bugs + domínio).
- **Functions (todas `southamerica-east1`, deployadas):** `requestPasswordResetCode`, `confirmPasswordResetCode`, `getPublicQuote`, `respondPublicQuote`, `createCheckoutSession`, `createDirectCheckout`, `createPortalSession`, `stripeWebhook`, `setupCoupons`, `notifyRelease`, `getTelegramChatId`, `dailyOsDigest`, `runOsDigestNow`, `onBugReportCreated`.
- **Rules:** firestore.rules + storage.rules liberadas.
- **Último commit:** `8adeed5` (03/07/2026). Push OK em `origin/main`.
- **Resultado:** ✅ tudo funcional; checkout direto testado (retorna `cs_live_`), notify Telegram+e-mail OK, digest OK (0 envios = sem OS acionável).

---

## 14. Bugs Conhecidos / Pendências

| Item | Impacto | Prioridade | Solução |
|---|---|---|---|
| Trial **não exige cartão no início** (só mensagem correta) | Trial sem garantia de conversão | Alta | Redirecionar pós-onboarding para `createCheckoutSession` (trial). Testar com cuidado (Pedro em produção) |
| Stripe exibe **"Connect"** no topo do checkout | Branding | Média | Stripe → Settings → Business → Public business name = "SmartLoop" (painel, não código) |
| Storage `read: if true` inclui **fotos de OS** | Privacidade | Média | Separar `tenants/{id}/public/**` (logos) de `private/**` (fotos OS) — é migração de path |
| **App Check** não habilitado | Abuso/DDoS no backend | Média | Criar reCAPTCHA site key + ligar App Check |
| **2FA** (TOTP/SMS) ausente | Segurança opcional | Média | Requer **Identity Platform** (pago) — aguarda decisão do Deyvid |
| Verificar `smartloop.com.br` em **Auth → Authorized domains** | Login Google no domínio novo | Baixa | Firebase costuma auto-adicionar; confirmar |
| ~26 warnings lint `react-hooks/set-state-in-effect` | Nenhum (build passa) | Baixa | Drawers sincronizando props→state; refatorar aos poucos |
| `NEXT_PUBLIC_FIREBASE_*` — trial via chave **LIVE** do Stripe | Cobra dinheiro real em testes | Info | Trocar para `sk_test_` se for testar sem cobrar |

---

## 15. TODO

**Alta**
- [ ] Fechar fluxo comercial: exigir cartão no início do trial (signup → checkout trial).
- [ ] Trocar nome público da conta Stripe para "SmartLoop".
- [ ] Confirmar/ligar login Google no `smartloop.com.br`.

**Média**
- [ ] App Check (reCAPTCHA) para proteger Functions/Firestore.
- [ ] 2FA opcional (TOTP) — depende de habilitar Identity Platform.
- [ ] Separar Storage público (logos) de privado (fotos de OS).
- [ ] Formulário de qualificação do plano Personalizado (hoje só WhatsApp).

**Baixa**
- [ ] Reduzir warnings de lint (`set-state-in-effect`).
- [ ] Remetente de e-mail com domínio próprio (`no-reply@smartloop.com.br`) no lugar do Gmail.
- [ ] Leitor de IMEI por câmera (@zxing) e QR upload — validar em iOS Safari.

---

## 16. Decisões Arquiteturais

- **Static export + Cloud Functions** (sem SSR): simplicidade/custo e deploy no Firebase Hosting. Consequência: guardas de rota e toda lógica sensível vão para Functions.
- **`tenantId == uid do dono`**: 1 dono = 1 loja no MVP. Simplifica rules (acesso por `request.auth.uid`), evita escalonamento entre tenants. Alternativa descartada: campo `tenantId` editável (inseguro — foi o bug SEC-1).
- **Firestore como banco principal** (Supabase quase não usado): realtime nativo (status de OS ao vivo) e integração direta com Auth/Storage/Functions.
- **`price_data` inline no Stripe** (sem objetos Price fixos): mudar preço é só mudar o código; sem recriar produto. Cupons via Coupons+Promotion Codes.
- **Notificações reutilizam Gmail existente** (rápido) em vez de SMTP de domínio (deferido).
- **Repositório de bugs dentro do app** + push imediato (Telegram/e-mail) em vez de consulta periódica.
- **Transcrição por Web Speech API** (grátis, zero-infra) em vez de Whisper/Google STT (custo) — com fallback para anexo.
- **`maxInstances=10`** como guardrail de custo (DoS) — Hosting já tem CDN/DDoS do Google.

---

## 17. Convenções

- **UI em PT-BR obrigatória:** OS (Ordem de Serviço, nunca "ticket"), Orçamento (nunca "quote"), Estoque (nunca "inventory"), Peças (nunca "parts"). Sem emojis na UI.
- **Status de OS:** `received → analyzing → waiting_part → ready → delivered | cancelled` (cores em `os-status.ts`/`globals.css`).
- **Logging:** `logger.info/success/warn/error("modulo", "mensagem", {dados})`; backend `logger.info("[SmartLoop][modulo] ...")`. Nunca `catch` vazio; logar acertos e erros com contexto; **não logar dados sensíveis** (cartão/token/secret).
- **Design:** primário `#2563eb`, accent `#ea580c`/`#f97316`, radius `0.5rem`. Tema Light padrão, Dark via `.dark`. **`bg-[--var]` NÃO renderiza para fills sólidos** → usar hex ou `style={{ backgroundColor: "var(--x)" }}` em painéis opacos (`text-[--x]` funciona).
- **Commits:** Conventional Commits (`feat`/`fix`/`chore`/`docs(...)`) em PT-BR; rodapé `Co-Authored-By: Claude ...`.
- **Rotina de release:** commit → push (GitHub `main`) → `notifyRelease` (Telegram+e-mail) via arquivo UTF-8.
- **Componentes:** shadcn/ui em `src/components/ui/`; camadas de dados em `src/lib/data/*` com `watch*(tenantId, onData, onError)` retornando unsubscribe.

---

## 18. Dependências

**Principais (`package.json`):** next 16.2.6, react 19.2.4, typescript 5, tailwindcss 4, motion ^12.40, firebase ^12.14, @supabase/* , @radix-ui/* , @tanstack/react-table ^8.21, cmdk ^1.1, react-hook-form ^7.76, zod ^4.4, jspdf ^4.2, qrcode/react-qr-code, zustand ^5, lucide-react ^1.17, date-fns ^4.3, class-variance-authority, clsx, tailwind-merge.

**Functions (`functions/package.json`, Node 20):** firebase-admin ^12.6, firebase-functions ^5.1, nodemailer ^6.9, stripe ^17.5.

---

## 19. Contexto Atual

- **Etapa:** MVP em produção, **fase beta** pré-lançamento comercial. Pedro (cliente #1) operando; lançamento próximo.
- **O que já funciona:** landing completa (preços corretos, checkout direto live, legais, cookies), app inteiro com dados reais (OS/Kanban, clientes, técnicos, fornecedores, estoque, PDV, orçamento+PDF+link público, financeiro, relatórios, garantia, configurações), onboarding, dashboard vivo (KPIs/gráficos/busca/notificações), billing Stripe (trial + assinatura + portal + webhook + cupons + bloqueio pós-trial), recuperação por código, digest diário de OS, canal de bugs beta, notificações de release (Telegram+e-mail), domínio oficial `smartloop.com.br`, versionamento no GitHub.
- **O que ainda não funciona / falta:** cartão exigido no início do trial (só mensagem); 2FA; App Check; separação de Storage público/privado; nome "SmartLoop" no checkout Stripe; formulário do plano Personalizado.
- **Próximo objetivo:** fechar 100% o fluxo comercial (cartão no trial) e endurecer segurança (App Check / 2FA) conforme decisão do Deyvid.

---

## 20. Próximos Passos

1. **Trial com cartão no início** — wiring signup/onboarding → `createCheckoutSession` (com Deyvid presente, sem risco ao Pedro).
2. **Stripe branding** — nome público "SmartLoop" + logo/cor no painel (modo test e live).
3. **Segurança** — decidir Identity Platform (2FA), habilitar App Check, separar Storage OS-fotos.
4. **Plano Personalizado** — construir o formulário de qualificação e roteamento (e-mail/WhatsApp do Pedro).
5. Manter a **rotina de release** (commit → push → notify) a cada entrega relevante.

---

## Apêndice A — Pessoas & Acordo Comercial

**Dono do produto:** Pedro Victor Ribeiro Silva — **Connect Assistência** (MEI, CNPJ `48.257.434/0001-06`), Araguaína/TO. Instagram @negociosdopedao (18k+). Cliente beta #1, marketing/networking, idealizador. E-mail `pvrgeral@gmail.com`.

**Desenvolvimento:** Deyvid Ramon Ferreira Amaral — **Lazy Labs** (MEI, CNPJ `51.299.197/0001-42`), Imperatriz/MA. Arquitetura/dev/DevOps, co-fundador técnico. E-mail `ads.deyvid@gmail.com`.

**Acordo (27/05/2026):** R$3.000 + 10% equity + 10% do MRR líquido. 1ª parcela R$1.500 **paga** (PIX 27/05); 2ª R$1.500 na entrega do MVP. Deadline MVP 26/06/2026; v2.0 26/07/2026. Ticket Pro R$89,90/mês.

## Apêndice B — Fluxo de Trabalho Multi-Agente

Padrão gerador–avaliador ("GAN de agentes"):
1. **Reescritor Técnico (ChatGPT)** — transforma a voz/prints do Deyvid em prompt técnico estruturado (Markdown). Não escreve código.
2. **Dev Full-Stack (Claude / este agente)** — implementa/corrige. **Fonte da verdade dos bugs = console/log.**
3. **QA Agent (Codex)** — testa o app, observa console, gera JSON estruturado de resultados. Não altera código.

Logging obrigatório e contextualizado é o canal primário de QA (ver §17).

---

*Fim do `memory.md`. Atualize incrementalmente a cada mudança relevante — preserve o histórico útil, remova o obsoleto.*
