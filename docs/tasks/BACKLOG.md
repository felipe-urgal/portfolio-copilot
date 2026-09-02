# Backlog

Backlog macro **ainda aberto**. Entregas concluídas pertencem a `DONE.md`; detalhes executáveis pertencem às issues do GitHub.

A prioridade corrente está sempre em `NEXT.md`. Este arquivo não substitui `docs/ROADMAP.md`.

## UX/UI — iniciativa #69

A fundação visual R0–R8 está concluída; o gate final do R8 foi reconciliado no PR #111 e o CI pós-merge #577 ficou verde. Permanecem:

- #81 — R9: acessibilidade, responsividade e visual fidelity QA — prioridade atual;
- R10 — gate final e fechamento da #69.

## IA assistiva

- #45 — copiloto explicável sobre dados estruturados e recomendações determinísticas;
- #46 — suíte de segurança, prompt injection, factualidade e alucinação.

A fundação de ingestão segura de conteúdo externo (#44) já foi concluída. UI de IA não deve criar sistema visual paralelo durante a #69.

## Convergência do MVP

- #47 — fechar jornada ponta a ponta de carteira, transações e aporte do mês depois do gate visual final da #69, salvo priorização explícita diferente.

Os contratos de domínio, ledger, contribuição, persistência, autenticação e estados transversais R8 já existem. O trabalho restante é integração de jornada e acabamento, não reconstrução dessas fundações.

## Simulação e backtesting

- #48 — cenários, inflação, reinvestimento, reconstrução histórica e backtesting sem look-ahead.

Requer dados históricos apropriados e metodologia versionada; não deve inventar séries ausentes.

## Integrações financeiras

- #49 — integrações read-only/Open Finance/importação/reconciliação, somente após gates de segurança, consentimento e regulatório.

## Produto público

- #50 — Regulatory Gate, LGPD, tenancy, observabilidade/SLO, suporte, backup/DR, segurança independente, termos e eventual billing.

A produção **pessoal/privada** em Vercel + Neon foi preparada em #97 / PR #98 e ativada em #99 / PR #100. Esse marco operacional já está concluído e não pertence ao backlog, mas **não satisfaz nem reduz automaticamente o gate público da #50**: exposição pública, multi-tenancy, operação para terceiros, monetização e as revisões regulatórias/independentes continuam bloqueadas até critérios próprios serem atendidos.

## Extensões futuras ainda sem vertical priorizado

- ampliar cobertura produtiva de providers de preço/fundamentals/FX quando houver fonte/licença definida;
- alertas úteis derivados de estados reais como stale, concentração, tese sem revisão ou evento material;
- PWA instalável quando houver valor de produto e estratégia de cache/offline compatível com dados financeiros.

## Fora de escopo até decisão explícita

- execução automática de ordens;
- custódia;
- day trade;
- derivativos/alavancagem;
- copy trading;
- feed social;
- recomendação/ranking patrocinado;
- promessa de retorno.
