# Plano do MVP — SmartLoop (entrega 26/06/2026)

> Decisões travadas em 15/06/2026:
> - **Backend:** Firebase-first (Auth + Firestore + Storage + Security Rules). Supabase fica para Fase 2.
> - **Escopo:** completo (inclui PDV, financeiro e billing Stripe test). Billing é sequenciado por último como margem de segurança.
> - **Marco crítico:** núcleo utilizável até **23/06** (Pedro homologa 48h antes da entrega).

## Estado atual
- ✅ Casca visual completa: landing, login (UI), 13 telas do app, design system, sidebar animada, logger, deploy Firebase Hosting, loop de QA.
- ⚠️ **Tudo com dados mockados.** Auth é mock. Sem persistência.

## Sprints

### Sprint A — Fundação (15–16/jun)
- [ ] Config real do Firebase no `.env.local` (feito: app web criado).
- [ ] AuthContext + hook `useAuth` (onAuthStateChanged, login, Google, logout, signup, reset).
- [ ] Login ligado ao Firebase Auth real.
- [ ] Rotas protegidas (guard client-side, pois é static export).
- [ ] `/cadastro` — signup + criação do tenant (loja) no Firestore + onboarding.
- [ ] `/recuperar-senha` — reset por link de e-mail (nativo Firebase). Código de 6 dígitos = melhoria pós-núcleo.
- [ ] Logout na sidebar.

### Sprint B — Núcleo OS (17–19/jun)
- [ ] Camada de dados Firestore (coleções por tenant) + tipos.
- [ ] Clientes CRUD real + busca + histórico.
- [ ] OS: criar (wizard real), listar (kanban/lista do Firestore), detalhe `/os/[id]`, mudança de status.
- [ ] Estados vazios/loading/erro ligados a dados reais.

### Sprint C — Diferenciais (20–21/jun)
- [ ] Leitor de IMEI por câmera (WebRTC) + validação Luhn.
- [ ] Upload de fotos por QR Code: rota pública `/upload/[token]` + Firebase Storage.
- [ ] Orçamento ligado à OS + geração de PDF.
- [ ] Aprovação por link público `/orcamento/[token]` (sem login).
- [ ] Envio por WhatsApp (link/API).

### Sprint D — Operação (22–23/jun)
- [ ] Peças/estoque real + movimentação + alertas de mínimo.
- [ ] PDV/caixa real (abertura/fechamento, venda persistida).
- [ ] Financeiro real (contas a receber, lançamentos).
- [ ] Configurações da loja persistidas (dados, formas de pagamento).
- [ ] Níveis de acesso (proprietário/técnico/atendente) + enforcement.
- [ ] Firestore Security Rules (isolamento multi-tenant).

### Sprint E — Homologação & Polish (24–26/jun)
- [ ] Pedro usa; QA agent roda; correção de bugs.
- [ ] PWA (manifest + service worker + cache).
- [ ] Onboarding guiado (primeira OS, primeiro cliente).
- [ ] Billing Stripe (modo test) — assinatura, se o tempo permitir.
- [ ] **26/06: entrega do MVP.**

## Passos manuais no Firebase Console (responsável: Deyvid)
1. **Authentication → Sign-in method:** habilitar **E-mail/senha** e **Google**.
2. **Firestore Database:** criar banco (modo produção) na região `southamerica-east1`.
3. **Storage:** já provisionado (`smartloop-94a06.firebasestorage.app`); confirmar ativo.
4. (Sprint D) Publicar as Security Rules de Firestore/Storage que eu gerar.
