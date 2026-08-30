# Próxima Atividade — Teses e eventos: InvestmentThesis e critérios de invalidação

**Status:** READY

## Issue canônica

- #43 — `Teses e eventos: InvestmentThesis, drivers, riscos e critérios de invalidação`

## Objetivo

Criar a camada versionada de tese de investimento para registrar o racional de cada ativo ao longo do tempo, separar fatos de opinião analítica e detectar quando uma tese precisa ser revisada ou invalidada.

## Dependências concluídas após este PR

- #39 — Asset Master canônico e resolução de identidade;
- #40 — Market Data com provenance, freshness e quality gates;
- #41 — scoring/valuation determinístico com metodologias versionadas;
- #42 — Portfolio Fit e ranking explicável por carteira.

## Escopo

- modelar `InvestmentThesis` versionada;
- registrar drivers principais;
- registrar riscos principais;
- definir indicadores monitorados;
- definir critérios explícitos de invalidação;
- associar eventos/resultados à tese;
- manter timeline auditável;
- suportar revisão periódica;
- sinalizar tese desatualizada;
- preservar provenance dos fatos usados;
- testar lifecycle, revisão e versionamento.

## Fora de escopo

- alterar fórmulas de Quality/Opportunity/Portfolio Fit;
- usar IA generativa como fonte de verdade dos fatos;
- sobrescrever versões históricas de tese;
- execução automática de ordens;
- integração de corretora/Open Finance.

## Critérios de aceite

- tese nunca sobrescreve histórico relevante;
- mudança material gera nova versão ou revisão auditável;
- fatos, opinião analítica e critérios de invalidação ficam separados;
- eventos associados preservam provenance e temporalidade;
- revisão periódica e estado de tese desatualizada são explícitos;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #43;
- ADR-0024 — Investment Engine scoring e valuation;
- ADR-0025 — Portfolio Fit e ranking explicável;
- `docs/INVESTMENT-ENGINE-METHODOLOGY.md`;
- `docs/ROADMAP.md` — Fase 6.
