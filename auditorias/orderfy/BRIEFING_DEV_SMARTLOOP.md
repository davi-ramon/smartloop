# Briefing para Dev Senior - Auditoria Ordemfy

Data da auditoria: 30/05/2026  
URL alvo: https://ordemfy.com.br/auth  
Conta usada: credenciais fornecidas na conversa, nao persistidas no repositorio  
Resultado: login autenticado com sucesso em `https://ordemfy.com.br/dashboard`

## Resumo executivo

O Ordemfy e um SaaS para assistencia tecnica com foco em OS, cadastros, PDV, orcamento rapido, produtos/estoque, financeiro, garantia, integracoes e configuracoes operacionais. A conta acessada aparece como tenant `Connect Assistencia`, papel `Admin da Empresa`, em periodo de teste com 12 dias restantes.

Para o Smartloop/FixOS, o melhor caminho e usar o Ordemfy como referencia de escopo funcional, mas construir uma experiencia propria:

- MVP deve priorizar OS, clientes, orcamento, PDV basico, produtos, financeiro basico, usuarios/permissoes e configuracoes da loja.
- Diferenciais do Smartloop/FixOS devem entrar cedo: leitor de IMEI, upload de fotos via QR Code, aprovacao de orcamento por link e banco de compatibilidade.
- Evitar copia visual/textual. Usar as entidades e fluxos como inspiracao de produto, com design system, UX e APIs proprias.

## Areas mapeadas

### Autenticacao e conta

- Login por email/senha confirmado.
- Apos login, redireciona para `/dashboard`.
- Usuario aparece online no topo/sidebar.
- Papel observado: `Admin da Empresa`.
- Existe CTA de assinatura/plano durante trial.

Requisitos Smartloop/FixOS:

- Login email/senha.
- Sessao persistente.
- Perfil do usuario e tenant.
- Controle de papeis: owner/admin, tecnico, atendente, financeiro.

### Dashboard

Rota: `/dashboard`

Elementos observados:

- Faturamento de hoje.
- Agenda da semana.
- Ordens recentes.
- Acoes rapidas.
- Atalhos: Nova OS, Nova Venda, Abrir PDV, Criar primeira OS, Cadastrar Cliente, Orcamento Rapido.
- Indicacao de trial/plano e notificacoes.

Requisitos Smartloop/FixOS:

- Dashboard operacional com cards de receita, OS abertas, agenda e atalhos.
- Estado vazio amigavel para primeira OS/primeiro cliente.
- Alertas de trial/plano apenas no SaaS production-ready.

### Clientes

Rotas:

- `/dashboard/customers`
- `/dashboard/customers/new`

Elementos observados:

- Lista de clientes com busca.
- Estado vazio: nenhum cliente.
- Acoes: Novo Cliente, Link de Cadastro, Importar.
- Paginacao/quantidade por pagina.
- Formulario de novo cliente com campos capturados:
  - Nome.
  - CPF/CNPJ.
  - Email.
  - Telefone.
  - WhatsApp.
  - Data de nascimento.
  - Cliente ativo.
  - CEP.
  - Logradouro.
  - Numero.
  - Bairro.
  - Cidade.
  - Observacoes.

Requisitos Smartloop/FixOS:

- CRUD de clientes.
- Busca por nome, documento e telefone.
- Campos separados para telefone e WhatsApp.
- Endereco opcional com CEP.
- Historico de OS por cliente.
- Link publico de cadastro pode ser fase 2.
- Importacao CSV/XLSX pode ser fase 2.

### Tecnicos

Rota: `/dashboard/technicians`

Elementos observados:

- Lista de tecnicos.
- Estado vazio: nenhum tecnico.
- Acao: Novo Tecnico.

Requisitos Smartloop/FixOS:

- Tecnico deve ser usuario ou perfil operacional vinculado ao tenant.
- Associar OS a tecnico responsavel.
- Prever comissao por servico/venda.

### Fornecedores

Rota: `/dashboard/suppliers`

Elementos observados:

- Lista de fornecedores.
- Estado vazio: nenhum fornecedor.
- Acao: Novo Fornecedor.

Requisitos Smartloop/FixOS:

- Cadastro de fornecedores para pecas/produtos.
- Vincular fornecedor ao catalogo e movimentacoes de estoque.

### Ordens de Servico

Rotas:

- `/dashboard/orders`
- `/dashboard/orders/new`

Elementos observados:

- Lista de OS com estado vazio: nenhuma OS encontrada.
- Criacao de OS inicia com pergunta "Quem e o cliente?".
- Campo inicial de busca: nome, CPF ou telefone.
- Acoes do dashboard levam para Nova OS/Nova Ordem de Servico.

Requisitos Smartloop/FixOS:

- Fluxo guiado: selecionar/criar cliente, selecionar/cadastrar aparelho, registrar IMEI, defeito, checklist, fotos e status.
- Status sugeridos: recebido, em analise, aguardando peca, pronto, entregue, cancelado.
- Criar OS deve permitir cliente existente ou novo cliente inline.
- Diferencial proprio: leitura de IMEI por camera e validacao Luhn.
- Diferencial proprio: upload de fotos por QR Code/token publico.

### PDV e vendas

Rotas:

- `/dashboard/pdv`
- `/dashboard/sales`

Elementos observados:

- PDV existe como modulo separado.
- Estado observado: caixa fechado.
- Relatorio/lista de vendas.
- Estado vazio: nenhuma venda encontrada.

Requisitos Smartloop/FixOS:

- Caixa com abertura/fechamento.
- Venda avulsa de produtos/pecas.
- Formas de pagamento.
- Associar venda a cliente opcional.
- Relatorio de vendas por periodo.

### Orcamento rapido

Rota: `/dashboard/quick-quotes`

Elementos observados:

- Tela dedicada de Orcamento Rapido.
- Estado vazio: nenhum orcamento cadastrado.
- Campo de IMEI: "Digite o IMEI (15 digitos)".
- Campo de busca por modelo/codigo tecnico.

Requisitos Smartloop/FixOS:

- Orcamento rapido separado da OS para atendimento agil.
- Busca por modelo/codigo tecnico.
- Campo IMEI com validacao.
- Converter orcamento rapido em OS ou venda.
- PDF e aprovacao por link devem ser diferenciais proprios.

### Produtos, catalogo e estoque

Rotas:

- `/dashboard/products` carregou.
- `/dashboard/stock` retornou 404.

Elementos observados:

- Cadastro de produtos.
- Estado vazio: nenhum produto.
- Configuracoes incluem categorias de produtos e peliculas compativeis.

Requisitos Smartloop/FixOS:

- Catalogo de produtos/pecas.
- SKU/codigo, categoria, custo, preco, estoque, estoque minimo e fornecedor.
- Movimentacao de entrada/saida.
- Compatibilidade por modelo como diferencial central.

### Financeiro

Rota: `/dashboard/financial`

Elementos observados:

- Dashboard financeiro.
- Calendario financeiro.
- Saldo em contas.
- Total a receber.
- Resultado do periodo.
- Recebido/pago.
- Configuracoes incluem metodos de pagamento, categorias financeiras, centros de custo e abertura/fechamento de caixa.

Requisitos Smartloop/FixOS:

- Contas a receber/pagar basicas.
- Receitas por OS/venda.
- Despesas por categoria.
- Relatorio de resultado.
- Centros de custo podem ficar para fase 2.

### Marketing

Rota: `/dashboard/marketing`

Elementos observados:

- Dashboard/visao geral de marketing.
- Acoes rapidas.

Requisitos Smartloop/FixOS:

- Nao e essencial para MVP.
- Pode virar area de campanhas WhatsApp, retorno de clientes, garantia vencendo e reativacao.

### Garantia

Rota: `/dashboard/warranty`

Elementos observados:

- Modulo de garantia.
- Garantias ativas.

Requisitos Smartloop/FixOS:

- Garantia vinculada a OS/servico.
- Prazo de garantia por tipo de servico.
- Alerta de garantia proxima do vencimento.
- Comprovante/termo de garantia em PDF.

### Relatorios

Observado:

- Menu "Relatorios Avancados" aparece.
- Rota direta `/dashboard/reports` retornou 404.
- Ajuda lista topico "Relatorios e Dashboards".

Requisitos Smartloop/FixOS:

- MVP: relatorio simples de OS, vendas, faturamento e estoque.
- Fase 2: relatorios avancados, exportacao PDF/Excel/CSV, filtros por periodo/status/tecnico.

### Fiscal

Observado:

- Menu "Fiscal" aparece.
- Rota direta `/dashboard/fiscal` retornou 404.
- Ajuda menciona NF-e, NFS-e, NFC-e.
- Assinatura lista notas fiscais como recurso incluso.

Requisitos Smartloop/FixOS:

- Fiscal nao deve entrar no MVP se prazo for apertado.
- Prever arquitetura para integracao futura com emissor fiscal.

### Integracoes

Rota: `/dashboard/integrations`

Integracoes observadas:

- Mercado Pago Point.
- Mercado Pago Conta.
- Banco Inter.
- Mercado Livre.
- OLX.
- E-commerce.
- API do Ordemfy.
- Controle por WhatsApp com tokens por tipo de usuario/perfil.

Requisitos Smartloop/FixOS:

- MVP: WhatsApp via link/API simples para envio de orcamento/status.
- Fase 2: Mercado Pago, Banco Inter, marketplace e e-commerce.
- API propria deve existir desde cedo em arquitetura, mesmo que privada.
- Tokens por perfil para automacao/IA sao um bom diferencial para Smartloop.

### Assinatura

Rota: `/dashboard/subscription`

Elementos observados:

- Plano Ordemfy Start em periodo de teste.
- Valor observado: R$ 49,99/mes.
- Proximo vencimento exibido.
- Limites observados:
  - Ate 2 usuarios.
  - 0/100 ordens de servico no mes.
  - 0.02MB/600MB de armazenamento.
- Recursos inclusos citados:
  - Ordens de Servico.
  - Cadastro de Clientes.
  - Painel do Tecnico.
  - PDV Completo.
  - Controle de Caixa.
  - Gestao de Estoque.
  - Financeiro Completo.
  - Notas Fiscais.
  - Peliculas Compativeis.
  - Garantia Estendida.
  - Orcamento Rapido.

Requisitos Smartloop/FixOS:

- Planos com quotas por usuarios, OS/mensal e armazenamento.
- Tela de assinatura e consumo.
- Billing pode ser Stripe/Mercado Pago conforme estrategia comercial.

### Configuracoes

Rota: `/dashboard/settings`

Grupos observados:

- Empresa & Sistema.
- Equipe e Permissoes.
- Ordens de Servico.
- Financeiro e Vendas.
- Catalogo de Produtos.
- Impressao e Documentos.
- Integracoes.

Itens observados:

- Dados da Empresa: logo, CNPJ, endereco e contato.
- Assinatura e Plano.
- Armazenamento.
- Politica de Privacidade.
- Zona de Perigo.
- Usuarios e Acesso.
- Comissoes.
- Tipos de Equipamentos.
- Campos Personalizados.
- Checklist de Entrada e Saida.
- Termos de Garantia.
- Orcamento Rapido.
- Videos de Servico.
- Metodos de Pagamento.
- Categorias Financeiras.
- Centros de Custo.
- Abertura e Fechamento de Caixa.
- Configuracoes Fiscais.
- Categorias de Produtos.
- Peliculas Compativeis.
- Central de Impressoes.
- Mercado Pago Point.
- OLX.
- E-commerce.
- Mercado Livre.
- API.

Requisitos Smartloop/FixOS:

- Configuracoes devem ser modeladas por dominio, nao como tela monolitica.
- Para MVP, priorizar: empresa, usuarios, tipos de equipamento, checklist, termos, metodos de pagamento e categorias de produtos.
- Central de impressoes e campos personalizados podem entrar depois, mas deixar modelagem preparada.

### Ajuda/documentacao

Rota: `/dashboard/support`

Topicos observados:

- Introducao.
- Acesso ao sistema.
- Conhecendo o dashboard.
- Criando OS.
- Gerenciando clientes.
- Configuracoes iniciais.
- PDV.
- Orcamento rapido.
- Estoque.
- Financeiro.
- Fiscal.
- Tecnicos.
- Fornecedores.
- Relatorios.
- Permissoes.
- Boas praticas.
- Canais de suporte.

Requisitos Smartloop/FixOS:

- Criar central de ajuda simples com artigos curtos.
- Incluir onboarding guiado no dashboard para primeira OS, primeiro cliente e primeira venda.

## Stack observavel

Observacao passiva feita pelo navegador:

- Aplicacao web autenticada em producao/public webapp.
- Service Worker API disponivel no navegador.
- Nao foi confirmado Next.js pelo detector automatico usado nesta passada.
- Nao houve inspecao de codigo-fonte, secrets, storage ou APIs privadas.

Recomendacao para Smartloop/FixOS:

- Manter stack propria ja definida no contexto: Next.js 16/React 19/TypeScript/Tailwind/Supabase/Firebase conforme repo atual.
- Validar instrucoes locais em `AGENTS.md`: este Next.js tem documentacao local em `node_modules/next/dist/docs/` e pode ter APIs diferentes do conhecimento comum.

## Priorizacao sugerida

### MVP essencial

1. Auth + tenant + usuario admin.
2. Dashboard com atalhos e estados vazios.
3. Clientes.
4. Tecnicos/usuarios basico.
5. OS com cliente, aparelho, IMEI, defeito, status e tecnico.
6. Orcamento rapido e orcamento vinculado a OS.
7. Produtos/pecas.
8. PDV/caixa basico.
9. Financeiro basico.
10. Configuracoes da empresa, formas de pagamento, checklist e termos.

### Diferenciais Smartloop/FixOS

1. Leitor de IMEI por camera.
2. Validacao IMEI por Luhn.
3. QR Code para upload de fotos do aparelho.
4. Aprovacao de orcamento por link sem login.
5. Compatibilidade de peliculas/pecas por modelo.
6. API propria com tokens por perfil para automacao/IA.

### Fase 2

1. Integracoes Mercado Pago/Banco Inter.
2. Marketplaces OLX/Mercado Livre.
3. E-commerce.
4. Fiscal NF-e/NFC-e/NFS-e.
5. Relatorios avancados e exportacoes.
6. Campos personalizados e central de impressoes.
7. Marketing/reativacao por WhatsApp.

## Rotas verificadas

Rotas carregadas:

- `/dashboard`
- `/dashboard/orders`
- `/dashboard/orders/new`
- `/dashboard/customers`
- `/dashboard/customers/new`
- `/dashboard/technicians`
- `/dashboard/suppliers`
- `/dashboard/pdv`
- `/dashboard/quick-quotes`
- `/dashboard/sales`
- `/dashboard/marketing`
- `/dashboard/products`
- `/dashboard/financial`
- `/dashboard/warranty`
- `/dashboard/integrations`
- `/dashboard/subscription`
- `/dashboard/settings`
- `/dashboard/support`

Rotas diretas que retornaram 404 nesta passada:

- `/dashboard/services`
- `/dashboard/stock`
- `/dashboard/finance`
- `/dashboard/reports`
- `/dashboard/fiscal`
- Subrotas diretas de settings testadas, como `/dashboard/settings/users`, `/dashboard/settings/company`, `/dashboard/settings/checklists`, etc.

Observacao: 404 em rota direta nao significa ausencia do recurso. Alguns recursos podem abrir por modal, dropdown, rota dinamica ou subestado da tela de configuracoes.

## Arquivos complementares

- `feature_inventory.json`: inventario estruturado com 264 labels/recursos observados, rotas, formularios e interacoes.
- `RELATORIO_QA_ORDERFY.md`: log incremental das passadas automatizadas.
- `PROTOCOLO_QA.md`: limites e metodo de auditoria.
- `scripts/run_orderfy_audit.mjs`: runner usado para varredura autenticada sem persistir credenciais.

