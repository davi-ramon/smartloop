# Relatorio QA/Product Discovery - Ordenfy

## Status

- Alvo: pendente de URL oficial.
- Usuario de teste: fornecido na conversa, nao persistido neste arquivo.
- Senha: fornecida na conversa, nao persistida neste arquivo.
- Ambiente acessado: pendente.
- Papel/permissao do usuario: pendente.
- Inicio da auditoria autenticada: pendente.

## Objetivo

Levantar, como usuario comum autorizado, as funcionalidades e recursos observaveis do sistema de referencia Ordenfy para orientar a criacao do Smartloop/FixOS com implementacao, design, UX, documentacao e APIs proprias.

Esta auditoria nao tem como objetivo copiar codigo, marca, textos extensos, identidade visual ou segredos do sistema de referencia.

## Contexto do Smartloop/FixOS

O produto planejado e um micro SaaS B2B para assistencias tecnicas de celulares e eletronicos no Brasil, com foco em:

- Ordem de Servico (OS) completa.
- Cadastro de clientes, aparelhos, IMEI e historico.
- Orcamentos com PDF e aprovacao por link.
- Upload de fotos via QR Code.
- Leitura de IMEI por camera.
- Estoque/pecas e compatibilidade por modelo.
- Multi-tenancy, usuarios e permissoes.
- PWA instalavel.
- WhatsApp e notificacoes operacionais.

## Log em tempo real

| Horario | Area | Acao | Observacao | Evidencia |
|---|---|---|---|---|
| pendente | Acesso | Aguardando URL oficial | As credenciais foram informadas, mas falta o link exato do sistema alvo. | N/A |

## Mapa de navegacao

| Menu/Rota | Tipo | Objetivo | Acoes principais | Observacoes |
|---|---|---|---|---|
| pendente | pendente | pendente | pendente | pendente |

## Inventario de funcionalidades

### Autenticacao e conta

Status: pendente de varredura.

Pontos a verificar:

- Login por e-mail/senha.
- Recuperacao de senha.
- Sessao, logout e expiracao.
- Perfil do usuario.
- Papeis e permissoes.

### Dashboard

Status: pendente de varredura.

Pontos a verificar:

- Indicadores principais.
- Filtros de periodo.
- Atalhos para OS, clientes, orcamentos e financeiro.
- Graficos, alertas e cards operacionais.

### Clientes

Status: pendente de varredura.

Pontos a verificar:

- Cadastro, edicao, busca e exclusao.
- Campos obrigatorios e validacoes.
- Historico de atendimentos.
- Vinculo com aparelhos e OS.

### Ordens de servico

Status: pendente de varredura.

Pontos a verificar:

- Criacao de OS.
- Status/kanban/lista.
- Dados do aparelho, defeito, IMEI, acessorios e observacoes.
- Fotos, anexos, checklist, assinatura e comprovante.
- Impressao, PDF, etiqueta e QR Code.

### Orcamentos

Status: pendente de varredura.

Pontos a verificar:

- Itens, servicos, pecas, mao de obra, desconto e total.
- Envio ao cliente.
- Aprovacao, rejeicao e validade.
- PDF e mensagem WhatsApp.

### Estoque, produtos e pecas

Status: pendente de varredura.

Pontos a verificar:

- Cadastro de produtos/pecas.
- Controle de estoque.
- Entrada/saida/movimentacao.
- Alertas de minimo.
- Compatibilidade por modelo.

### Financeiro

Status: pendente de varredura.

Pontos a verificar:

- Caixa, vendas, recebimentos e despesas.
- Formas de pagamento.
- Relatorios financeiros.
- Exportacao.

### Relatorios

Status: pendente de varredura.

Pontos a verificar:

- Relatorios operacionais.
- Relatorios financeiros.
- Exportacao PDF/Excel/CSV.
- Filtros por periodo, tecnico, status e cliente.

### Configuracoes

Status: pendente de varredura.

Pontos a verificar:

- Dados da loja.
- Logo, cores, documentos e impressao.
- Usuarios e permissoes.
- Plano, assinatura e cobranca.
- Integracoes.

## Stack observavel

Status: pendente de varredura.

Itens a registrar:

- Framework frontend inferido.
- Provedores de autenticacao.
- APIs ou dominios externos visiveis.
- Analytics/monitoramento.
- PWA/manifest/service worker.
- Bibliotecas detectaveis de UI, QR Code, PDF, mapas ou pagamentos.

## Requisitos derivados para Smartloop/FixOS

| Prioridade | Requisito | Origem observada | Decisao Smartloop/FixOS |
|---|---|---|---|
| Alta | Criar OS com cliente e aparelho | Contexto do projeto | Implementar como fluxo central do MVP |
| Alta | Gerar orcamento com itens e total | Contexto do projeto | Implementar com PDF e aprovacao por link |
| Alta | Controle de status da OS | Contexto do projeto | Implementar lista/kanban com historico |
| Media | Upload de fotos por QR Code | Diferencial planejado | Implementar como melhoria propria |
| Media | Leitor de IMEI | Diferencial planejado | Implementar como melhoria propria |

## Evidencias e screenshots

Screenshots devem ser salvos ou referenciados apenas quando nao expuserem dados sensiveis de clientes reais. Antes de registrar evidencias, mascarar dados pessoais quando necessario.

| ID | Area | Descricao | Arquivo/Referencia | Sensibilidade |
|---|---|---|---|---|
| pendente | pendente | pendente | pendente | pendente |

## Pendencias

- Receber a URL oficial do sistema alvo.
- Confirmar se o acesso informado e ambiente demo/teste ou loja real.
- Confirmar se pode criar dados ficticios durante a varredura.



## Varredura automatizada inicial - 2026-05-30T02:44:44.344Z

- URL oficial: https://ordemfy.com.br/auth
- Resultado do login: acesso autenticado ou dashboard alcancado
- Titulo antes do login: Ordemfy — Sistema para Assistência Técnica de Celular e Eletrônicos
- URL apos login: https://ordemfy.com.br/dashboard
- Menus/rotas internas observadas: 7
- Candidatos de funcionalidades capturados: 119
- Evidencia nao autenticada: `auditorias/orderfy/evidencias/01-login.png`

### Rotas observadas

- Clientes: https://ordemfy.com.br/dashboard/customers
- Técnicos: https://ordemfy.com.br/dashboard/technicians
- Fornecedores: https://ordemfy.com.br/dashboard/suppliers
- Integrações: https://ordemfy.com.br/dashboard/integrations
- Assinatura: https://ordemfy.com.br/dashboard/subscription
- Configurações: https://ordemfy.com.br/dashboard/settings
- Ajuda: https://ordemfy.com.br/dashboard/support

### Labels e acoes candidatas

- Dashboard
- Clientes
- Técnicos
- Fornecedores
- Integrações
- Assinatura
- Configurações
- Ajuda
- Fay
- Faturamento de Hoje
- Agenda da Semana
- Ordens Recentes
- Ações Rápidas
- Vendas
- Serviços
- Marketing
- Estoque
- Financeiro
- Garantia
- Relatórios Avançados
- Buscar...
- 0 notificações pendentes
- Nova OS
- Nova Venda
- Abrir PDV
- 0 operações
- Ver Calendário
- SEX 29 -
- SÁB 30 -
- DOM 31 -
- SEG 1 -
- TER 2 -
- QUA 3 -
- QUI 4 -
- Ver Todas
- Criar primeira OS
- Nova Ordem de Serviço
- Cadastrar Cliente
- Orçamento Rápido
- Saiba mais sobre o Dashboard
- Nenhum cliente
- Fiscal
- Ver Planos
- Fechar
- Link de Cadastro
- Importar
- 10
- Nenhum técnico
- Nenhum fornecedor
- Mercado Pago Point
- Mercado Pago Conta
- Banco Inter
- Mercado Livre
- OLX
- E-commerce
- API do Ordemfy
- Controle por WhatsApp
- Todos
- Pagamentos
- Marketplaces
- API
- Automação
- Conectar
- Gerenciar Assinatura
- Ordemfy Start Período de Teste
- Precisa de ajuda?
- Trocar Plano
- EMPRESA & SISTEMA
- EQUIPE E PERMISSÕES
- ORDENS DE SERVIÇO
- FINANCEIRO E VENDAS
- CATÁLOGO DE PRODUTOS
- IMPRESSÃO E DOCUMENTOS
- INTEGRAÇÕES
- Dados da Empresa Logo, CNPJ, endereço e contato
- Assinatura e Plano Consumo de OS e limites
- Armazenamento Gerenciar espaço e arquivos
- Política de Privacidade Termos e política de privacidade
- Zona de Perigo Ações irreversíveis de limpeza
- Usuários e Acesso Gerenciar usuários e permissões
- Comissões Gestão de comissões de vendas
- Tipos de Equipamentos Tipos de dispositivos aceitos
- Campos Personalizados Campos extras nas OS
- Checklist de Entrada e Saída Verificações ao criar e finalizar OS
- Termos de Garantia Textos e condições de garantia
- Orçamento Rápido Garantia e parcelamento padrão
- Vídeos de Serviço Vídeos para serem usados em orçamento rápido
- Métodos de Pagamento Formas de pagamento e taxas
- Categorias Financeiras Categorias de receitas e despesas
- Centros de Custo Organização e relatórios
- Abertura e Fechamento de Caixa Modo de conferência no fechamento
- Configurações Fiscais NF-e, NFC-e, NFS-e
- Categorias de Produtos Organização de produtos
- Películas Compatíveis Modelos de películas
- Central de Impressões Layout, papel, margens e auto-impressão em um só lugar
- Mercado Pago Point Maquininhas de cartão integradas
- OLX Anúncios de smartphones na OLX
- E-commerce Sincronize produtos, estoque e pedidos
- Mercado Livre Conecte sua conta para publicar e gerenciar anúncios
- API do Ordemfy Conecte sistemas externos e agentes de IA
- Central de Ajuda
- Todos os Tópicos
- Introdução ao Ordemfy Primeiros Passos
- Acesso ao Sistema Primeiros Passos
- Conhecendo o Dashboard Visão Geral
- Criando Ordem de Serviço Ordem de Serviço
- Gerenciando Clientes Cadastros
- Configurações Iniciais Configurações
- Ponto de Venda (PDV) Vendas
- Orçamento Rápido Vendas
- Controle de Estoque Estoque
- Gestão Financeira Financeiro
- Emissão de Notas Fiscais Fiscal
- Gestão de Técnicos Cadastros
- Controle de Fornecedores Cadastros
- Relatórios e Dashboards Relatórios
- Sistema de Permissões Configurações
- Dicas e Boas Práticas Dicas
- Canais de Suporte Ajuda



## Varredura automatizada inicial - 2026-05-30T02:47:49.887Z

- URL oficial: https://ordemfy.com.br/auth
- Resultado do login: acesso autenticado ou dashboard alcancado
- Titulo antes do login: Ordemfy — Sistema para Assistência Técnica de Celular e Eletrônicos
- URL apos login: https://ordemfy.com.br/dashboard
- Menus/rotas internas observadas: 7
- Interacoes de menu testadas: 16
- Formularios/acoes seguras abertas: 6
- Candidatos de funcionalidades capturados: 201
- Evidencia nao autenticada: `auditorias/orderfy/evidencias/01-login.png`

### Rotas observadas

- Clientes: https://ordemfy.com.br/dashboard/customers
- Técnicos: https://ordemfy.com.br/dashboard/technicians
- Fornecedores: https://ordemfy.com.br/dashboard/suppliers
- Integrações: https://ordemfy.com.br/dashboard/integrations
- Assinatura: https://ordemfy.com.br/dashboard/subscription
- Configurações: https://ordemfy.com.br/dashboard/settings
- Ajuda: https://ordemfy.com.br/dashboard/support

### Menus clicados

- Dashboard: https://ordemfy.com.br/dashboard
- Clientes: https://ordemfy.com.br/dashboard/customers
- Técnicos: https://ordemfy.com.br/dashboard/technicians
- Fornecedores: https://ordemfy.com.br/dashboard/suppliers
- Vendas: https://ordemfy.com.br/dashboard/suppliers
- Serviços: https://ordemfy.com.br/dashboard/suppliers
- Marketing: https://ordemfy.com.br/dashboard/suppliers
- Estoque: https://ordemfy.com.br/dashboard/suppliers
- Financeiro: https://ordemfy.com.br/dashboard/suppliers
- Garantia: https://ordemfy.com.br/dashboard/suppliers
- Relatórios Avançados: https://ordemfy.com.br/dashboard/suppliers
- Fiscal: https://ordemfy.com.br/dashboard/suppliers
- Integrações: https://ordemfy.com.br/dashboard/integrations
- Assinatura: https://ordemfy.com.br/dashboard/subscription
- Configurações: https://ordemfy.com.br/dashboard/settings
- Ajuda: https://ordemfy.com.br/dashboard/support

### Acoes seguras abertas sem salvar

- Nova OS: https://ordemfy.com.br/dashboard/orders/new | campos: Nome, CPF ou telefone...
- Nova Ordem de Serviço: https://ordemfy.com.br/dashboard/orders/new | campos: Nome, CPF ou telefone...
- Cadastrar Cliente: https://ordemfy.com.br/dashboard/customers/new | campos: Nome *, CPF/CNPJ, Email, Telefone, WhatsApp, Data de Nascimento, Cliente Ativo, CEP, Logradouro, Número, Bairro, Cidade, Estado, Nome completo, [cpf], [email], (00) 00000-0000, 00000-000, Rua, Avenida..., Nº, Observações sobre o cliente...
- Nova Venda: https://ordemfy.com.br/dashboard/pdv | campos: sem campos capturados
- Abrir PDV: https://ordemfy.com.br/dashboard/pdv | campos: sem campos capturados
- Orçamento Rápido: https://ordemfy.com.br/dashboard/quick-quotes | campos: Digite o IMEI (15 dígitos), Buscar por modelo ou código técnico (ex: iPhone 7 ou A1778)...

### Labels e acoes candidatas

- Dashboard
- Clientes
- Técnicos
- Fornecedores
- Integrações
- Assinatura
- Configurações
- Ajuda
- Fay
- Faturamento de Hoje
- Ordens Recentes
- Ações Rápidas
- Vendas
- Serviços
- Marketing
- Estoque
- Financeiro
- Garantia
- Relatórios Avançados
- Fiscal
- Buscar...
- Nova OS
- Nova Venda
- Abrir PDV
- 0 operações
- Ver Todas
- Nova Ordem de Serviço
- Cadastrar Cliente
- Orçamento Rápido
- Saiba mais sobre o Dashboard
- Nenhum cliente
- 0 notificações pendentes
- Ver Planos
- Fechar
- Link de Cadastro
- Importar
- 10
- Nenhum técnico
- Nenhum fornecedor
- Mercado Pago Point
- Mercado Pago Conta
- Banco Inter
- Mercado Livre
- OLX
- E-commerce
- API do Ordemfy
- Controle por WhatsApp
- Todos
- Pagamentos
- Marketplaces
- API
- Automação
- Conectar
- Gerenciar Assinatura
- Ordemfy Start Período de Teste
- Precisa de ajuda?
- Trocar Plano
- EMPRESA & SISTEMA
- EQUIPE E PERMISSÕES
- ORDENS DE SERVIÇO
- FINANCEIRO E VENDAS
- CATÁLOGO DE PRODUTOS
- IMPRESSÃO E DOCUMENTOS
- INTEGRAÇÕES
- Dados da Empresa Logo, CNPJ, endereço e contato
- Assinatura e Plano Consumo de OS e limites
- Armazenamento Gerenciar espaço e arquivos
- Política de Privacidade Termos e política de privacidade
- Zona de Perigo Ações irreversíveis de limpeza
- Usuários e Acesso Gerenciar usuários e permissões
- Comissões Gestão de comissões de vendas
- Tipos de Equipamentos Tipos de dispositivos aceitos
- Campos Personalizados Campos extras nas OS
- Checklist de Entrada e Saída Verificações ao criar e finalizar OS
- Termos de Garantia Textos e condições de garantia
- Orçamento Rápido Garantia e parcelamento padrão
- Vídeos de Serviço Vídeos para serem usados em orçamento rápido
- Métodos de Pagamento Formas de pagamento e taxas
- Categorias Financeiras Categorias de receitas e despesas
- Centros de Custo Organização e relatórios
- Abertura e Fechamento de Caixa Modo de conferência no fechamento
- Configurações Fiscais NF-e, NFC-e, NFS-e
- Categorias de Produtos Organização de produtos
- Películas Compatíveis Modelos de películas
- Central de Impressões Layout, papel, margens e auto-impressão em um só lugar
- Mercado Pago Point Maquininhas de cartão integradas
- OLX Anúncios de smartphones na OLX
- E-commerce Sincronize produtos, estoque e pedidos
- Mercado Livre Conecte sua conta para publicar e gerenciar anúncios
- API do Ordemfy Conecte sistemas externos e agentes de IA
- Central de Ajuda
- Todos os Tópicos
- Introdução ao Ordemfy Primeiros Passos
- Acesso ao Sistema Primeiros Passos
- Conhecendo o Dashboard Visão Geral
- Criando Ordem de Serviço Ordem de Serviço
- Gerenciando Clientes Cadastros
- Configurações Iniciais Configurações
- Ponto de Venda (PDV) Vendas
- Orçamento Rápido Vendas
- Controle de Estoque Estoque
- Gestão Financeira Financeiro
- Emissão de Notas Fiscais Fiscal
- Gestão de Técnicos Cadastros
- Controle de Fornecedores Cadastros
- Relatórios e Dashboards Relatórios
- Sistema de Permissões Configurações
- Dicas e Boas Práticas Dicas
- Canais de Suporte Ajuda
- Agenda da Semana
- Ver Calendário
- SEX 29 -
- SÁB 30 -
- DOM 31 -
- SEG 1 -
- TER 2 -
- QUA 3 -
- QUI 4 -
- Criar primeira OS
- PDV



## Varredura automatizada inicial - 2026-05-30T02:52:38.910Z

- URL oficial: https://ordemfy.com.br/auth
- Resultado do login: acesso autenticado ou dashboard alcancado
- Titulo antes do login: Ordemfy — Sistema para Assistência Técnica de Celular e Eletrônicos
- URL apos login: https://ordemfy.com.br/dashboard
- Menus/rotas internas observadas: 7
- Interacoes de menu testadas: 16
- Formularios/acoes seguras abertas: 6
- Rotas diretas verificadas: 32
- Candidatos de funcionalidades capturados: 264
- Evidencia nao autenticada: `auditorias/orderfy/evidencias/01-login.png`

### Rotas observadas

- Clientes: https://ordemfy.com.br/dashboard/customers
- Técnicos: https://ordemfy.com.br/dashboard/technicians
- Fornecedores: https://ordemfy.com.br/dashboard/suppliers
- Integrações: https://ordemfy.com.br/dashboard/integrations
- Assinatura: https://ordemfy.com.br/dashboard/subscription
- Configurações: https://ordemfy.com.br/dashboard/settings
- Ajuda: https://ordemfy.com.br/dashboard/support

### Menus clicados

- Dashboard: https://ordemfy.com.br/dashboard
- Clientes: https://ordemfy.com.br/dashboard/customers
- Técnicos: https://ordemfy.com.br/dashboard/technicians
- Fornecedores: https://ordemfy.com.br/dashboard/suppliers
- Vendas: https://ordemfy.com.br/dashboard/suppliers
- Serviços: https://ordemfy.com.br/dashboard/suppliers
- Marketing: https://ordemfy.com.br/dashboard/suppliers
- Estoque: https://ordemfy.com.br/dashboard/suppliers
- Financeiro: https://ordemfy.com.br/dashboard/suppliers
- Garantia: https://ordemfy.com.br/dashboard/suppliers
- Relatórios Avançados: https://ordemfy.com.br/dashboard/suppliers
- Fiscal: https://ordemfy.com.br/dashboard/suppliers
- Integrações: https://ordemfy.com.br/dashboard/integrations
- Assinatura: https://ordemfy.com.br/dashboard/subscription
- Configurações: https://ordemfy.com.br/dashboard/settings
- Ajuda: https://ordemfy.com.br/dashboard/support

### Acoes seguras abertas sem salvar

- Nova OS: https://ordemfy.com.br/dashboard/orders/new | campos: Nome, CPF ou telefone...
- Nova Ordem de Serviço: https://ordemfy.com.br/dashboard/orders/new | campos: Nome, CPF ou telefone...
- Cadastrar Cliente: https://ordemfy.com.br/dashboard/customers/new | campos: Nome *, CPF/CNPJ, Email, Telefone, WhatsApp, Data de Nascimento, Cliente Ativo, CEP, Logradouro, Número, Bairro, Cidade, Estado, Nome completo, [cpf], [email], (00) 00000-0000, 00000-000, Rua, Avenida..., Nº, Observações sobre o cliente...
- Nova Venda: https://ordemfy.com.br/dashboard/pdv | campos: sem campos capturados
- Abrir PDV: https://ordemfy.com.br/dashboard/pdv | campos: sem campos capturados
- Orçamento Rápido: https://ordemfy.com.br/dashboard/quick-quotes | campos: Digite o IMEI (15 dígitos), Buscar por modelo ou código técnico (ex: iPhone 7 ou A1778)...

### Rotas diretas verificadas

- OK /dashboard: https://ordemfy.com.br/dashboard | Dashboard / Fay / Faturamento de Hoje / Agenda da Semana
- OK /dashboard/orders: https://ordemfy.com.br/dashboard/orders | Ordem de Serviço / Ordens de Serviço / Nenhuma OS encontrada
- OK /dashboard/orders/new: https://ordemfy.com.br/dashboard/orders/new | Dashboard / Nova OS / Quem é o cliente?
- OK /dashboard/customers: https://ordemfy.com.br/dashboard/customers | Clientes / Nenhum cliente
- OK /dashboard/customers/new: https://ordemfy.com.br/dashboard/customers/new | Dashboard / Novo Cliente / Informações Básicas / Endereço
- OK /dashboard/technicians: https://ordemfy.com.br/dashboard/technicians | Técnicos / Nenhum técnico
- OK /dashboard/suppliers: https://ordemfy.com.br/dashboard/suppliers | Fornecedores / Nenhum fornecedor
- OK /dashboard/pdv: https://ordemfy.com.br/dashboard/pdv | PDV / Caixa Fechado
- OK /dashboard/quick-quotes: https://ordemfy.com.br/dashboard/quick-quotes | Orçamento Rápido / Nenhum orçamento cadastrado
- OK /dashboard/sales: https://ordemfy.com.br/dashboard/sales | Relatório de Vendas / Vendas / Nenhuma venda encontrada
- N/A /dashboard/services: https://ordemfy.com.br/dashboard/services | 404
- OK /dashboard/marketing: https://ordemfy.com.br/dashboard/marketing | Dashboard / Marketing / Visão geral do Marketing / Ações rápidas
- N/A /dashboard/stock: https://ordemfy.com.br/dashboard/stock | 404
- OK /dashboard/products: https://ordemfy.com.br/dashboard/products | Cadastro de Produtos / Produtos / Nenhum produto
- OK /dashboard/financial: https://ordemfy.com.br/dashboard/financial | Dashboard Financeiro / Financeiro / Calendário Financeiro / Saldo em Contas
- N/A /dashboard/finance: https://ordemfy.com.br/dashboard/finance | 404
- OK /dashboard/warranty: https://ordemfy.com.br/dashboard/warranty | Dashboard / Módulo de Garantia / Garantias Ativas (0)
- N/A /dashboard/reports: https://ordemfy.com.br/dashboard/reports | 404
- N/A /dashboard/fiscal: https://ordemfy.com.br/dashboard/fiscal | 404
- OK /dashboard/integrations: https://ordemfy.com.br/dashboard/integrations | Integrações / Mercado Pago Point / Mercado Pago Conta / Banco Inter
- OK /dashboard/subscription: https://ordemfy.com.br/dashboard/subscription | Assinatura / Gerenciar Assinatura / Ordemfy Start Período de Teste / Precisa de ajuda?
- OK /dashboard/settings: https://ordemfy.com.br/dashboard/settings | Configurações / EMPRESA & SISTEMA / EQUIPE E PERMISSÕES / ORDENS DE SERVIÇO
- N/A /dashboard/settings/users: https://ordemfy.com.br/dashboard/settings/users | 404
- N/A /dashboard/settings/company: https://ordemfy.com.br/dashboard/settings/company | 404
- N/A /dashboard/settings/equipment-types: https://ordemfy.com.br/dashboard/settings/equipment-types | 404
- N/A /dashboard/settings/custom-fields: https://ordemfy.com.br/dashboard/settings/custom-fields | 404
- N/A /dashboard/settings/checklists: https://ordemfy.com.br/dashboard/settings/checklists | 404
- N/A /dashboard/settings/payment-methods: https://ordemfy.com.br/dashboard/settings/payment-methods | 404
- N/A /dashboard/settings/product-categories: https://ordemfy.com.br/dashboard/settings/product-categories | 404
- N/A /dashboard/settings/compatible-films: https://ordemfy.com.br/dashboard/settings/compatible-films | 404
- N/A /dashboard/settings/prints: https://ordemfy.com.br/dashboard/settings/prints | 404
- OK /dashboard/support: https://ordemfy.com.br/dashboard/support | Ajuda / Central de Ajuda / Todos os Tópicos / Introdução ao Ordemfy Primeiros Passos

### Labels e acoes candidatas

- Dashboard
- Clientes
- Técnicos
- Fornecedores
- Integrações
- Assinatura
- Configurações
- Ajuda
- Fay
- Faturamento de Hoje
- Ordens Recentes
- Ações Rápidas
- Vendas
- Serviços
- Marketing
- Estoque
- Financeiro
- Garantia
- Relatórios Avançados
- Fiscal
- Buscar...
- Nova OS
- Nova Venda
- Abrir PDV
- 0 operações
- Ver Todas
- Nova Ordem de Serviço
- Cadastrar Cliente
- Orçamento Rápido
- Saiba mais sobre o Dashboard
- Nenhum cliente
- 0 notificações pendentes
- Ver Planos
- Fechar
- Link de Cadastro
- Importar
- 10
- Nenhum técnico
- Nenhum fornecedor
- Mercado Pago Point
- Mercado Pago Conta
- Banco Inter
- Mercado Livre
- OLX
- E-commerce
- API do Ordemfy
- Controle por WhatsApp
- Todos
- Pagamentos
- Marketplaces
- API
- Automação
- Conectar
- Gerenciar Assinatura
- Ordemfy Start Período de Teste
- Precisa de ajuda?
- Trocar Plano
- EMPRESA & SISTEMA
- EQUIPE E PERMISSÕES
- ORDENS DE SERVIÇO
- FINANCEIRO E VENDAS
- CATÁLOGO DE PRODUTOS
- IMPRESSÃO E DOCUMENTOS
- INTEGRAÇÕES
- Dados da Empresa Logo, CNPJ, endereço e contato
- Assinatura e Plano Consumo de OS e limites
- Armazenamento Gerenciar espaço e arquivos
- Política de Privacidade Termos e política de privacidade
- Zona de Perigo Ações irreversíveis de limpeza
- Usuários e Acesso Gerenciar usuários e permissões
- Comissões Gestão de comissões de vendas
- Tipos de Equipamentos Tipos de dispositivos aceitos
- Campos Personalizados Campos extras nas OS
- Checklist de Entrada e Saída Verificações ao criar e finalizar OS
- Termos de Garantia Textos e condições de garantia
- Orçamento Rápido Garantia e parcelamento padrão
- Vídeos de Serviço Vídeos para serem usados em orçamento rápido
- Métodos de Pagamento Formas de pagamento e taxas
- Categorias Financeiras Categorias de receitas e despesas
- Centros de Custo Organização e relatórios
- Abertura e Fechamento de Caixa Modo de conferência no fechamento
- Configurações Fiscais NF-e, NFC-e, NFS-e
- Categorias de Produtos Organização de produtos
- Películas Compatíveis Modelos de películas
- Central de Impressões Layout, papel, margens e auto-impressão em um só lugar
- Mercado Pago Point Maquininhas de cartão integradas
- OLX Anúncios de smartphones na OLX
- E-commerce Sincronize produtos, estoque e pedidos
- Mercado Livre Conecte sua conta para publicar e gerenciar anúncios
- API do Ordemfy Conecte sistemas externos e agentes de IA
- Central de Ajuda
- Todos os Tópicos
- Introdução ao Ordemfy Primeiros Passos
- Acesso ao Sistema Primeiros Passos
- Conhecendo o Dashboard Visão Geral
- Criando Ordem de Serviço Ordem de Serviço
- Gerenciando Clientes Cadastros
- Configurações Iniciais Configurações
- Ponto de Venda (PDV) Vendas
- Orçamento Rápido Vendas
- Controle de Estoque Estoque
- Gestão Financeira Financeiro
- Emissão de Notas Fiscais Fiscal
- Gestão de Técnicos Cadastros
- Controle de Fornecedores Cadastros
- Relatórios e Dashboards Relatórios
- Sistema de Permissões Configurações
- Dicas e Boas Práticas Dicas
- Canais de Suporte Ajuda
- Agenda da Semana
- Ver Calendário
- SEX 29 -
- SÁB 30 -
- DOM 31 -
- SEG 1 -
- TER 2 -
- QUA 3 -
- QUI 4 -
- Criar primeira OS
- PDV

