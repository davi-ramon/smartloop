# Protocolo do QA Agent - SmartLoop

Este diretório é a área de trabalho do QA Agent. O agente não altera código do app; ele apenas executa auditorias, navega visualmente, captura evidências e gera relatórios para o agente desenvolvedor.

## Como executar auditorias

- Alvo principal: `https://smartloop-94a06.web.app`.
- Alvo local quando solicitado: `http://localhost:3000`.
- Sempre abrir uma sessão visual para o usuário acompanhar os cliques.
- Preferência: Browser lateral do Codex com visibilidade ativada.
- Fallback aceito: janela visível do Chrome controlada por Playwright, quando o Browser lateral não estiver disponível.
- Capturar console:
  - `console.error`
  - `console.warn`
  - logs com prefixo `[SmartLoop]`
  - `pageerror`
  - responses HTTP 4xx/5xx
- Ignorar `net::ERR_ABORTED` causado apenas por navegação SPA, exceto quando impedir carregamento real da rota.

## Onde salvar

- Relatórios JSON/Markdown: `qa-agent/relatórios/`.
- Scripts auxiliares temporários ou reutilizáveis: `qa-agent/scripts/`.
- Evidências visuais, quando necessárias: `qa-agent/evidencias/`.

## Formato do relatório

O relatório principal deve ser um único objeto JSON com:

- `run_id`
- `target`
- `summary`
- `console`
- `results`
- `next_priorities`

Quando o usuário pedir "saída final apenas JSON", responder somente o JSON, sem texto extra.

