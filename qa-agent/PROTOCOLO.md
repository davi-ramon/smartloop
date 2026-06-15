# Protocolo do QA Agent — SmartLoop

Este diretório é a área de trabalho do **QA Agent**. O agente **não altera código** do app; ele apenas executa auditorias, navega visualmente, captura evidências e gera relatórios para o agente desenvolvedor.

> **Papel e instrução-mãe do agente:** ver `docs/PROMPT_QA_AGENT.md` (system prompt). Este protocolo é a parte **operacional** (ambiente, captura, onde salvar, schema). Os dois devem permanecer consistentes — o schema e os enums abaixo são a referência canônica compartilhada.

## Como executar auditorias

- Alvo principal: `https://smartloop-94a06.web.app`.
- Alvo local quando solicitado: `http://localhost:3000`.
- Sempre abrir uma sessão visual para o usuário acompanhar os cliques.
- Preferência: Browser lateral do Codex com visibilidade ativada.
- Fallback aceito: janela visível do Chrome controlada por Playwright, quando o Browser lateral não estiver disponível.
- Acionar **todos** os elementos interativos por rota (botões, abas, filtros, busca, toggles, steps de formulário). Formulários: testar vazio (validação), preenchido (sucesso) e inválido (erro).

## Captura de console (fonte da verdade)

Capturar e considerar **falha**:

- `console.error`
- `console.warn`
- logs com prefixo `[SmartLoop]` (info/success/warn/error do logger do app)
- `pageerror` (exceptions não tratadas)
- respostas HTTP **4xx/5xx**

Ignorar `net::ERR_ABORTED` causado apenas por navegação SPA, exceto quando impedir o carregamento real da rota.

## Onde salvar

- Relatórios JSON/Markdown: `qa-agent/relatórios/`.
- Nome do arquivo de relatório (padrão ASCII, evita problemas de acento no Windows/git): `relatorio-<run_id ISO compacto>.json` — ex.: `relatorio-2026-06-14T01-48-26Z.json`.
- Scripts auxiliares temporários ou reutilizáveis: `qa-agent/scripts/`.
- Evidências visuais, quando necessárias: `qa-agent/evidencias/`.

## Formato do relatório (schema canônico)

O relatório principal deve ser **um único objeto JSON** (500–5000 caracteres) neste schema. Quando o usuário pedir "saída final apenas JSON", responder **somente o JSON**, sem texto extra.

```json
{
  "run_id": "string (timestamp ISO, ex.: 2026-06-14T01:48:26.695Z)",
  "target": "url testada",
  "summary": { "total": 0, "passed": 0, "failed": 0, "warnings": 0 },
  "console": { "errors": ["..."], "warnings": ["..."] },
  "results": [
    {
      "route": "/os",
      "action": "clique em 'Nova OS'",
      "status": "pass | fail | warn",
      "expected": "abrir /os/nova",
      "actual": "o que aconteceu de fato",
      "console_evidence": "log/erro relevante (vazio se nenhum)",
      "severity": "critical | high | medium | low",
      "repro_steps": ["1. ...", "2. ..."],
      "suggested_fix": "hipótese objetiva para o dev (vazio se status=pass)"
    }
  ],
  "next_priorities": ["item mais crítico primeiro", "..."]
}
```

### Enums e regras de preenchimento

- **`status`**: `pass` (comportamento correto) · `fail` (erro/console error/4xx-5xx/quebra) · `warn` (funciona mas com problema de UX, acessibilidade ou feedback ausente).
- **`severity`**: `critical` (bloqueia uso/quebra a rota) · `high` (funcionalidade principal comprometida) · `medium` (UX/validação/feedback ausente) · `low` (cosmético/acessibilidade menor).
- **`summary.total`** = nº de itens em `results`; `passed`/`failed`/`warnings` somam `total`.
- Ordenar `results` por `severity` (critical → low).
- `next_priorities`: 3–5 itens mais urgentes, na ordem em que o dev deve atacar.
- Se uma rota passa inteira, registrar **1** resultado `pass` resumido (não inflar o JSON).
- Não sugerir reescritas grandes; apontar **causa provável** e deixar a correção para o dev.
