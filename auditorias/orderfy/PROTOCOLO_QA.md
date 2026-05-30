# Protocolo de Auditoria QA - Referencia Ordenfy

Este protocolo orienta a varredura manual/visual do sistema de referencia para gerar insumos de produto para o Smartloop/FixOS.

## Limites de atuacao

- Mapear fluxos, telas, entidades, regras de negocio observaveis, textos funcionais, estados de interface, permissoes e stack detectavel pelo navegador.
- Registrar comportamento esperado, comportamento real, oportunidades de melhoria e requisitos para implementacao propria.
- Nao extrair codigo-fonte proprietario, chaves, dados internos, segredos, listas privadas de clientes ou qualquer informacao fora do acesso normal concedido ao usuario informado.
- Nao tentar burlar autenticacao, limites, planos, permissoes, APIs internas ou protecoes do sistema.
- Nao reproduzir identidade visual, marca, textos proprietarios longos, layout pixel-perfect ou trade dress. O objetivo e criar uma versao propria com UX e identidade do Smartloop/FixOS.

## Credenciais

As credenciais foram fornecidas na conversa, mas nao devem ser persistidas neste repositorio. Qualquer novo acesso deve usar as credenciais diretamente da sessao segura do operador.

## Metodo de varredura

1. Entrar pelo link oficial fornecido pelo contratante.
2. Confirmar ambiente acessado, usuario logado, papel/permissao e contexto da loja/tenant.
3. Mapear menu principal, rotas, modais, acoes primarias e estados vazios.
4. Executar fluxos principais como usuario comum:
   - Login, logout e recuperacao de senha quando visivel.
   - Dashboard inicial.
   - Clientes.
   - Ordens de servico.
   - Orcamentos.
   - Produtos, pecas ou estoque.
   - Financeiro, caixa, vendas ou pagamentos.
   - Relatorios.
   - Configuracoes da loja, usuarios, permissoes e plano.
   - Notificacoes, WhatsApp, PDF, impressao, etiquetas e QR Code se existirem.
5. Para cada tela, registrar:
   - Objetivo da tela.
   - Campos e validacoes.
   - Acoes disponiveis.
   - Estados de erro, loading, vazio e sucesso.
   - Regras de negocio inferidas.
   - Dados que precisam existir no Smartloop/FixOS.
   - Ideias de melhoria sem copiar expressao visual proprietaria.
6. Observar stack pelo navegador apenas de forma passiva:
   - Titulo, metas, manifests, service worker, requests de rede, nomes de bundles, provedores de auth, storage e analytics quando expostos.
   - Sem chamadas forjadas, scraping agressivo ou testes de vulnerabilidade.

## Saidas geradas

- `RELATORIO_QA_ORDERFY.md`: relatorio humano detalhado para produto e engenharia.
- `feature_inventory.json`: inventario estruturado para consumo por LLM/dev agent.

