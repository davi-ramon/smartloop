# FixOS — Contexto Completo do Projeto
> **Para Claude Code:** Leia este arquivo inteiro antes de escrever qualquer código. Ele contém tudo o que aconteceu, o que foi negociado, o que foi pago e o que precisa ser construído.

---

## 🎯 O PRODUTO

**Nome do app:** **FixOS**  
**Tagline:** "A OS que resolve. O sistema que escala."  
**Domínio sugerido:** smartloop.app
**Tipo:** Micro SaaS — B2B — Assinatura mensal recorrente  
**Mercado-alvo:** Assistências técnicas de celulares e eletrônicos no Brasil  

### O que é o FixOS?
Um sistema de gestão completo para assistências técnicas, construído como SaaS multi-tenant. É um clone melhorado do sistema **Ordenfy** (referência de mercado), com diferenciais:

1. **Leitura de IMEI automática** — câmera do celular lê o IMEI do aparelho em tempo real
2. **Upload de fotos via QR Code** — técnico gera QR na OS, cliente abre no próprio celular e fotografa o aparelho
3. **Geração de orçamento em segundos** — com PDF + aprovação pelo cliente via link (sem login)
4. **Banco de compatibilidade** — películas, capinhas e peças compatíveis por modelo de celular
5. **Multi-tenant** — cada assistência tem seu ambiente isolado, com níveis de acesso separados
6. **PWA instalável** — funciona como app no iOS e Android sem passar por app store

---

## 🤝 AS PARTES

### CONTRATANTE
- **Razão Social:** 48.257.434 Pedro Victor Ribeiro Silva
- **Nome Fantasia:** Assistência Connect
- **CNPJ:** 48.257.434/0001-06
- **Natureza:** MEI (Microempreendedor Individual)
- **Endereço:** Rua Antonio Matos, S/N, Lote 20, Quadra 40 — Loteamento Maracanã, Araguaína/TO — CEP 77825-640
- **Instagram:** @negociosdopedao (18.100+ seguidores)
- **Papel no projeto:** Dono do produto, marketing, networking, cliente beta #1, investidor

#### Ativos do Pedro (por que ele é o parceiro ideal):
- 18.100 seguidores no Instagram no nicho de assistência técnica
- Acesso direto a **Moisés da Imperosa** (maior distribuidor de peças do Norte/Nordeste)
- Rede com técnicos de Araguaína — garante primeiros 20 assinantes
- Contato indireto com **Will Nery** (maior reparador do Estado do TO — potencial distribuidor nacional)
- Audiência orgânica: vídeos pegam de 1.500 a 3.000+ views, cresceu 1.200 seguidores em 2,5 semanas
- Sentiu a dor em primeira pessoa: usa sistema de R$909/ano que não tem IMEI reader, não tem QR Code, não tem níveis de acesso

### CONTRATADA
- **Razão Social:** 51.299.197 Deyvid Ramon Ferreira Amaral
- **Nome Fantasia:** Lazy Labs
- **CNPJ:** 51.299.197/0001-42
- **Natureza:** MEI
- **Endereço:** Rua São Paulo, 47 — Jardim Oriental, Imperatriz/MA — CEP 65907-020
- **Papel no projeto:** Desenvolvimento, arquitetura, DevOps, suporte técnico, co-fundador técnico

---

## 💰 ACORDO FINANCEIRO (O QUE FOI FECHADO)

### Negociação (reunião de 27/05/2026, 118 minutos)
- Proposta inicial de Deyvid: R$ 4.997
- Contraproposta do Pedro: R$ 3.000 + 10% do negócio
- **Acordo final aceito:** R$ 3.000 + 10% equity + 10% MRR líquido

### Estrutura financeira
| Item | Valor | Status |
|------|-------|--------|
| 1ª Parcela (honorários) | R$ 1.500,00 | ✅ **PAGO via PIX em 27/05/2026** |
| 2ª Parcela (entrega MVP) | R$ 1.500,00 | 🔲 Devida na entrega do MVP (até D+30) |
| Revenue Share | 10% do lucro líquido mensal | 🔄 A partir do 1º assinante pagante |
| Equity | 10% das ações/quotas da empresa | 📝 Formalizar em até 60 dias após v2.0 |

### Projeções financeiras acordadas
- **Ticket:** R$ 89,90/mês por assinante
- **Meta mês 1:** 100 a 200 assinantes (Pedro é otimista — tem audiência pré-aquecida)
- **Cenário conservador (98% prob.):** 10 assinantes = MRR R$ 899 → Revenue Share: ~R$ 62/mês
- **Cenário realista (50% prob.):** 50 assinantes = MRR R$ 4.495 → Revenue Share: ~R$ 314/mês
- **Cenário otimista (15% mês 1):** 100+ assinantes = MRR R$ 8.990 → Revenue Share: ~R$ 629/mês

---

## 📅 CRONOGRAMA

**Data de início:** 27/05/2026 (assinatura + PIX)  
**Deadline MVP:** 26/06/2026 (D+30)  
**Deadline Sistema Completo:** 26/07/2026 (D+60)  

### FASE 1 — MVP (D+1 a D+30)

#### Semana 1 — 28/mai a 03/jun: Fundação & Infraestrutura
- [ ] Repositório Git (monorepo Next.js + TypeScript)
- [ ] Firebase: Firestore, Auth, App Hosting, Functions
- [ ] Supabase: schema inicial (OS, clientes, aparelhos, usuários, peças)
- [ ] Autenticação: e-mail/senha + Google OAuth
- [ ] CI/CD: GitHub Actions → deploy automático em staging
- [ ] Design System: paleta FixOS, componentes base

#### Semana 2 — 04/jun a 10/jun: IMEI + Ordem de Serviço
- [ ] Leitor de IMEI via câmera (WebRTC, funciona em browser iOS/Android)
- [ ] Fallback: digitação manual com validação Luhn
- [ ] Cadastro de cliente (nome, telefone, e-mail, histórico)
- [ ] Abertura de OS: cliente → aparelho → IMEI → defeito → status
- [ ] Kanban de status: Entrada / Em análise / Aguardando peça / Pronto / Entregue
- [ ] Seed: 500+ modelos de celulares populares no Brasil

#### Semana 3 — 11/jun a 17/jun: QR Code + Orçamento
- [ ] QR Code upload: técnico gera QR na OS → cliente fotografa pelo celular
- [ ] Storage: Firebase Storage com tokens temporários por OS
- [ ] Geração de orçamento: peças + mão de obra → PDF
- [ ] Envio por WhatsApp: link do orçamento via WhatsApp API
- [ ] Aprovação do orçamento: cliente aprova/recusa pelo link (sem login)
- [ ] Catálogo de peças: nome, preço, estoque, fornecedor

#### Semana 4 — 18/jun a 26/jun: Billing + Polish + Deploy
- [ ] Billing básico: integração de pagamento para assinatura mensal
- [ ] Onboarding: tela de cadastro da loja (logo, CNPJ, WhatsApp, cor)
- [ ] Níveis de acesso: Proprietário / Técnico / Atendente
- [ ] Testes end-to-end: fluxo completo abertura → orçamento → aprovação → entrega
- [ ] Deploy produção: HTTPS, SSL, monitoramento
- [ ] Homologação: Pedro usa 48h antes da entrega oficial
- [ ] **26/jun: ENTREGA MVP + receber R$ 1.500**

---

### FASE 2 — SISTEMA COMPLETO (D+31 a D+60)

#### Semana 5 — 27/jun a 03/jul: Multi-tenancy & Escala
- [ ] Row Level Security no Supabase: isolamento total por tenant
- [ ] Planos: Básico / Pro / Premium com limites de OS e usuários
- [ ] Stripe Billing completo: trials, upgrades, cancelamentos, webhooks
- [ ] Super-admin: painel para gestão de todas as lojas
- [ ] Limites e quotas automáticos por plano
- [ ] Testes de escala: 200+ lojas simultâneas

#### Semana 6 — 04/jul a 10/jul: Dashboard & Relatórios
- [ ] Dashboard do proprietário: OS abertas, receita dia/mês, ticket médio
- [ ] Relatório financeiro: faturamento, peças mais usadas, lucro por período
- [ ] Relatório de OS: tempo médio de reparo, taxa de aprovação, modelos
- [ ] Histórico do cliente: timeline completa de todos os aparelhos
- [ ] Notificações automáticas: WhatsApp + e-mail a cada mudança de status
- [ ] Export: PDF e Excel

#### Semana 7 — 11/jul a 17/jul: Funcionalidades Avançadas
- [ ] Banco de compatibilidade: película, película câmera, capinha por modelo
- [ ] Controle de estoque: alertas de mínimo + histórico de movimentação
- [ ] Checklist de recepção: fotos + condição do aparelho na entrada
- [ ] Etiqueta de OS com QR Code para rastreio físico
- [ ] Garantia: controle de prazo pós-reparo com alertas
- [ ] PWA: FixOS instalável como app em iOS e Android

#### Semana 8 — 18/jul a 26/jul: Landing Page + QA + Lançamento
- [ ] Landing page fixos.app: copywriting, demo interativa, trial gratuito
- [ ] SEO + OG tags + sitemap
- [ ] Testes de carga: 200 usuários simultâneos, < 1s de resposta
- [ ] Segurança: rate limiting, proteção XSS/SQL injection
- [ ] Documentação: guia de uso + guia técnico
- [ ] **26/jul: ENTREGA SISTEMA COMPLETO v2.0 + início 30 dias de suporte**

---

## 🏗️ STACK TÉCNICO

### Decisão de infraestrutura
**Objetivo:** suportar 100 a 200 assinantes com custo zero ou mínimo de infra.  
**Estratégia:** usar free tiers ao máximo na fase MVP; migrar gradualmente para planos pagos conforme o MRR cobrir os custos.

### Stack escolhida

```
Frontend:
  - Next.js 14 (App Router) + TypeScript
  - TailwindCSS + shadcn/ui
  - PWA (manifest.json + service worker)
  - React Server Components para performance

Backend:
  - Next.js API Routes + Server Actions
  - Firebase Functions (edge functions para webhooks Stripe/WhatsApp)
  - Supabase Edge Functions (alternativa)

Banco de dados:
  - Supabase (PostgreSQL) — dados relacionais, RLS para multi-tenancy
  - Firestore — sessões, realtime (status de OS ao vivo)

Autenticação:
  - Firebase Auth (e-mail + Google OAuth)
  - Supabase Auth como alternativa

Storage:
  - Firebase Storage — fotos de aparelhos (QR Code upload)
  - Tokens temporários com expiração por OS

Pagamentos:
  - Stripe Billing (recorrência mensal)
  - Webhooks: Firebase Functions interceptam eventos Stripe

Deploy & CI/CD:
  - Vercel (frontend Next.js) — free tier
  - Firebase Hosting como fallback
  - GitHub Actions: push → test → deploy automático

Monitoramento:
  - Sentry (erros) — free tier
  - Vercel Analytics (performance)

WhatsApp:
  - Evolution API (self-hosted) ou Z-API para envio de orçamentos
  - Templates pré-aprovados para notificações de status
```

### Schema do banco (Supabase/PostgreSQL)

```sql
-- Tenants (lojas/assinantes)
create table tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  fantasy_name text,
  cnpj text unique,
  phone text,
  whatsapp text,
  logo_url text,
  plan text default 'basic' check (plan in ('basic','pro','premium')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  status text default 'trial' check (status in ('trial','active','suspended','cancelled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Usuários por tenant (com níveis de acesso)
create table users (
  id uuid references auth.users primary key,
  tenant_id uuid references tenants not null,
  name text,
  email text,
  role text default 'technician' check (role in ('owner','technician','attendant')),
  created_at timestamptz default now()
);

-- Clientes da assistência
create table customers (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants not null,
  name text not null,
  phone text,
  email text,
  cpf text,
  created_at timestamptz default now()
);

-- Ordens de Serviço
create table service_orders (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants not null,
  number serial, -- número sequencial por tenant
  customer_id uuid references customers not null,
  device_brand text,
  device_model text,
  imei text,
  imei_2 text,
  color text,
  problem_description text,
  condition_notes text, -- condição na entrada
  status text default 'received' check (status in ('received','analyzing','waiting_part','ready','delivered','cancelled')),
  technician_id uuid references users,
  received_at timestamptz default now(),
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fotos das OSs (via QR Code upload)
create table service_order_photos (
  id uuid default gen_random_uuid() primary key,
  service_order_id uuid references service_orders not null,
  url text not null,
  type text default 'device' check (type in ('device','part','receipt')),
  uploaded_by text default 'customer', -- 'customer' ou 'technician'
  created_at timestamptz default now()
);

-- Orçamentos
create table quotes (
  id uuid default gen_random_uuid() primary key,
  service_order_id uuid references service_orders not null,
  tenant_id uuid references tenants not null,
  status text default 'pending' check (status in ('pending','approved','rejected','expired')),
  total_parts numeric(10,2) default 0,
  total_labor numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total numeric(10,2) generated always as (total_parts + total_labor - discount) stored,
  pdf_url text,
  approval_token text unique, -- token para aprovação sem login
  expires_at timestamptz default (now() + interval '3 days'),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- Itens do orçamento
create table quote_items (
  id uuid default gen_random_uuid() primary key,
  quote_id uuid references quotes not null,
  part_id uuid references parts,
  description text not null,
  quantity integer default 1,
  unit_price numeric(10,2) not null,
  type text default 'part' check (type in ('part','labor','other'))
);

-- Catálogo de peças por tenant
create table parts (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants not null,
  name text not null,
  sku text,
  price numeric(10,2) not null,
  stock integer default 0,
  min_stock integer default 2,
  supplier text,
  compatible_models text[], -- array de modelos
  created_at timestamptz default now()
);

-- Banco de compatibilidade (global, seed)
create table device_compatibility (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  model text not null,
  product_type text check (product_type in ('screen_protector','camera_protector','case','battery','screen')),
  compatible_sku text,
  compatible_name text
);

-- RLS: cada tenant só vê seus dados
alter table customers enable row level security;
alter table service_orders enable row level security;
alter table quotes enable row level security;
alter table parts enable row level security;

create policy "tenant_isolation" on customers
  using (tenant_id = (select tenant_id from users where id = auth.uid()));
-- (replicar para todas as tabelas)
```

---

## 📋 FUNCIONALIDADES DETALHADAS

### 1. Leitura de IMEI
- Usar `@zxing/library` ou `html5-qrcode` para leitura via câmera
- Validação do IMEI com algoritmo de Luhn
- Fallback: digitação manual com formatação automática (XX XXXXXX XXXXXX X)
- Ao ler IMEI: auto-preenche marca e modelo via API IMEI (imeicheck.net ou similar)

### 2. QR Code Upload de Fotos
- Técnico clica "Solicitar fotos" na OS → sistema gera QR Code
- QR Code leva para URL pública temporária: `fixos.app/upload/[token]`
- Cliente abre no celular → interface simples: tirar foto ou escolher da galeria
- Fotos vão direto para Firebase Storage
- Técnico vê as fotos em tempo real na OS (Firestore realtime)
- Token expira em 24h

### 3. Geração de Orçamento
- Técnico seleciona peças do catálogo + adiciona mão de obra
- Sistema calcula total automaticamente
- Gera PDF com: logo da loja, dados do cliente, aparelho, IMEI, itens, total, validade
- Envia link de aprovação por WhatsApp: "Olá [Nome], seu orçamento está pronto: [link]"
- Cliente acessa sem login, vê o orçamento e clica Aprovar ou Recusar
- Sistema atualiza status da OS automaticamente

### 4. Banco de Compatibilidade
- Seed inicial com dados de películas compatíveis para modelos populares BR
- Técnico digita modelo → sistema sugere películas e peças compatíveis
- Proprietário pode adicionar peças próprias vinculadas a modelos
- Reduz erro de "pegar película por uma para ver qual encaixa"

### 5. Notificações Automáticas
Eventos que disparam mensagem WhatsApp para o cliente:
- OS recebida → "Recebemos seu celular! OS #[número] aberta."
- Orçamento pronto → "Seu orçamento está pronto. Clique aqui para aprovar."
- Reparo concluído → "Seu celular está pronto para retirada!"
- Garantia vencendo → "A garantia do seu reparo vence em 7 dias."

### 6. Multi-Tenancy
- Cada loja tem seu subdomínio: `connect.fixos.app` (personalizável)
- Isolamento completo via RLS no Supabase
- Planos:
  - **Básico:** até 100 OS/mês, 2 usuários → R$ 69,90/mês
  - **Pro:** OS ilimitadas, 5 usuários, relatórios → R$ 89,90/mês ← **ticket principal**
  - **Premium:** OS ilimitadas, usuários ilimitados, API, white-label → R$ 149,90/mês

---

## 🎪 CONTEXTO DE MERCADO

### Referência de mercado
- **Ordenfy:** sistema atual de referência do nicho. Preço: ~R$ 119/mês. Não tem IMEI reader nem QR Code upload.
- **Agenda Boa:** sistema que Pedro usa hoje. R$ 909/ano (~R$ 75/mês). Não tem níveis de acesso, sem IMEI, sem compatibilidade.
- **Oportunidade:** o Ordenfy lançou há 2 meses e já tem tração. FixOS entra com mais funcionalidades e networking de Pedro.

### Estratégia de lançamento (acordada na reunião)
1. **Fase beta:** Pedro usa na Assistência Connect por 30 dias (mês 1)
2. **Fase expansão local:** vender para 20 técnicos de Araguaína que Pedro conhece (prova social)
3. **Fase escala:** apresentar para Will Nery + Moisés da Imperosa → distribuição nacional
4. **Plano de conteúdo:** Pedro posta vídeos diários com o sistema em uso → orgânico convertendo em assinantes

---

## 🔑 CREDENCIAIS E CONFIGURAÇÕES (a configurar)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://fixos.app
NEXT_PUBLIC_APP_NAME=FixOS
```

---

## 📁 ESTRUTURA DE PASTAS SUGERIDA

```
fixos/
├── apps/
│   ├── web/                    # Next.js 14 (app principal)
│   │   ├── app/
│   │   │   ├── (auth)/         # login, cadastro, onboarding
│   │   │   ├── (dashboard)/    # área autenticada
│   │   │   │   ├── os/         # ordens de serviço
│   │   │   │   ├── clientes/   # gestão de clientes
│   │   │   │   ├── estoque/    # peças e estoque
│   │   │   │   ├── relatorios/ # dashboard e relatórios
│   │   │   │   └── configuracoes/
│   │   │   ├── upload/[token]/ # QR Code upload (público)
│   │   │   ├── orcamento/[token]/ # aprovação de orçamento (público)
│   │   │   └── (landing)/      # fixos.app (landing page)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui base
│   │   │   ├── os/             # componentes de OS
│   │   │   ├── imei/           # leitor de IMEI
│   │   │   └── qrcode/         # gerador/leitor QR
│   │   └── lib/
│   │       ├── supabase/       # client + server
│   │       ├── firebase/       # config
│   │       ├── stripe/         # billing
│   │       └── whatsapp/       # envio de mensagens
├── packages/
│   ├── database/               # types gerados do Supabase
│   ├── ui/                     # componentes compartilhados
│   └── config/                 # eslint, tsconfig, tailwind
└── supabase/
    ├── migrations/             # migrations SQL
    └── seed.sql                # dados iniciais
```

---

## ✅ PROMPT DE INÍCIO PARA CLAUDE CODE

```
Você é o desenvolvedor principal do FixOS, um Micro SaaS de gestão para assistências técnicas de celulares no Brasil.

CONTEXTO: Este projeto foi contratado por Pedro Victor Ribeiro Silva (Assistência Connect, Araguaína/TO) e desenvolvido por Deyvid Ramon Ferreira Amaral (Lazy Labs, Imperatriz/MA). O contrato foi assinado em 27/05/2026 com pagamento de R$1.500 já realizado. O MVP precisa ser entregue em 30 dias (até 26/06/2026).

STACK: Next.js 14 + TypeScript + TailwindCSS + Supabase + Firebase + Stripe

PRIMEIRA TAREFA: Inicializar o projeto. Execute:
1. `npx create-next-app@latest fixos --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Configure Supabase (instale @supabase/supabase-js e @supabase/ssr)
3. Configure Firebase (instale firebase)
4. Execute as migrations iniciais do banco de dados (schema completo está no arquivo CONTEXTO_FIXOS.md)
5. Configure autenticação com Firebase Auth + integração Supabase
6. Crie o layout base do dashboard

Siga rigorosamente o cronograma: Semana 1 = infraestrutura. Não pule etapas. Cada commit deve ser descritivo. Crie testes para as funções críticas (IMEI validation, quote calculation, tenant isolation).

Prioridade máxima: o sistema precisa funcionar com 200 assinantes simultâneos desde o dia 1. Use RLS no Supabase corretamente desde a primeira migration.
```

---

## 📌 PONTOS DE ATENÇÃO

1. **IMEI reader:** testar em iOS Safari (restrições de câmera mais rígidas que Android Chrome)
2. **QR Code upload:** o link público precisa funcionar sem autenticação — apenas o token valida a sessão
3. **Multi-tenancy:** implementar RLS **antes** de colocar dados em produção, não depois
4. **Stripe:** usar modo `test` durante desenvolvimento; só mudar para `live` na entrega do MVP
5. **WhatsApp:** usar Evolution API (open source, self-hosted) para não ter custo de mensagens
6. **PWA:** `manifest.json` + service worker precisam ser configurados antes do deploy para iOS
7. **Naming:** no Brasil, "Ordem de Serviço" = OS. Usar sempre esta terminologia na UI.

---

## 📞 COMUNICAÇÃO

- Pedro prefere comunicação via WhatsApp
- Updates semanais todo domingo com print do progresso
- Pedro homologa o MVP em 48h antes da entrega oficial (acordado em reunião)
- Reunião de feedback marcada para a semana 4 (antes do deploy em produção)

---

*Documento gerado em 28/05/2026 por Lazy Labs. Versão 1.0.*
