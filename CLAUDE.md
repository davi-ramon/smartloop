# FixOS — Instruções para Claude Code

## O que é este projeto
**FixOS** é um Micro SaaS B2B de gestão para assistências técnicas de celulares no Brasil.
Desenvolvido por Deyvid Ramon (Lazy Labs) para Pedro Victor (Assistência Connect).

Leia `CONTEXTO_FIXOS.md` para o contexto completo do projeto, acordo financeiro e cronograma.

## Stack
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** — sem `tailwind.config.js`, usa `@theme` em `globals.css`
- **shadcn/ui** — componentes em `src/components/ui/`, configurado em `components.json`
- **Supabase** — banco PostgreSQL com RLS. Clientes em `src/lib/supabase/`
- **Firebase** — Auth (email + Google) + Firestore (realtime) + Storage. Config em `src/lib/firebase/`
- **Stripe** — billing em modo `test` durante desenvolvimento
- **React Hook Form + Zod** — validação de formulários

## Estrutura de rotas
```
src/app/
├── (auth)/login/          # tela de login
├── (dashboard)/           # área autenticada (sidebar inclusa no layout)
│   ├── os/                # Ordens de Serviço — tela principal
│   ├── clientes/          # gestão de clientes
│   ├── estoque/           # catálogo de peças
│   ├── relatorios/        # dashboard e métricas
│   └── configuracoes/     # dados da loja + plano
├── upload/[token]/        # upload de fotos via QR Code (público, sem auth)
└── orcamento/[token]/     # aprovação de orçamento pelo cliente (público)
```

## Terminologia obrigatória (UI em PT-BR)
- **OS** = Ordem de Serviço (nunca "ticket" ou "work order")
- **Orçamento** (nunca "quote" em texto visível ao usuário)
- **Estoque** (nunca "inventory")
- **Peças** (nunca "parts" em texto visível)

## Status das OS
`received` → `analyzing` → `waiting_part` → `ready` → `delivered` | `cancelled`

Cores definidas em `globals.css` como variáveis CSS (`--status-received`, etc.).

## Regras técnicas críticas
1. **RLS no Supabase ANTES de qualquer dado em produção** — toda tabela tem policy `tenant_isolation`
2. **Stripe em modo `test`** até a entrega do MVP (26/06/2026)
3. **iOS Safari para IMEI reader** — usar `@zxing/library`, testar no iOS
4. **QR Code upload** — rota `/upload/[token]` funciona sem autenticação
5. **Firebase Storage** — tokens temporários para fotos, expiração de 24h

## Design system FixOS
- **Azul primário:** `#2563eb` (`--primary`)
- **Laranja accent:** `#ea580c` (`--accent`)
- **Sidebar:** fundo `#1e293b` (slate-800)
- **Radius:** `0.5rem`
- Usar variáveis CSS (`var(--primary)`) ou classes Tailwind mapeadas (`bg-[--primary]`)
- Componentes em `src/components/ui/` seguem padrão shadcn/ui

## Cronograma restante do MVP (deadline 26/06/2026)
- **Semana 2** (04–10/jun): leitor IMEI via câmera + cadastro OS + Kanban funcional
- **Semana 3** (11–17/jun): QR Code upload + geração de orçamento PDF + WhatsApp
- **Semana 4** (18–26/jun): billing Stripe + onboarding + níveis de acesso + deploy

## Comandos úteis
```bash
npm run dev        # dev server (localhost:3000)
npm run build      # build de produção
npm run lint       # eslint
```
