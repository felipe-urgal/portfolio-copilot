# Próxima Atividade — Investment Engine: Portfolio Fit, radar e ranking explicável

**Status:** READY

## Issue canônica

- #42 — `Investment Engine: Portfolio Fit, radar e ranking explicável`

## Objetivo

Combinar contexto da carteira com as dimensões analíticas do Investment Engine sem esconder Quality, Opportunity e aderência à carteira dentro de um score opaco.

## Dependências concluídas após este PR

- #39 — Asset Master canônico e resolução de identidade;
- #40 — Market Data com provenance, freshness e quality gates;
- #41 — scoring/valuation determinístico com metodologias versionadas.

## Escopo

- definir `Portfolio Fit` como dimensão própria;
- considerar gaps de alocação e concentração já modelados pelo Portfolio Engine;
- respeitar restrições de aporte existentes;
- combinar sinais preservando os componentes individuais;
- construir radar/ranking de candidatos;
- produzir reason codes e decomposição do ranking;
- criar snapshots imutáveis para resultados materiais;
- versionar metodologia de Portfolio Fit/ranking;
- manter estados explícitos quando faltarem dados;
- testar estabilidade, empate e dados incompletos.

## Fora de escopo

- alterar fórmulas de Quality/Opportunity/Dividend da #41;
- IA generativa como fonte da classificação;
- execução automática de ordens;
- recomendação patrocinada;
- novos providers de Market Data;
- integração de corretora/Open Finance.

## Critérios de aceite

- Quality, Opportunity e Portfolio Fit continuam separáveis e auditáveis;
- ranking nunca depende de fórmula opaca não documentada;
- cada posição no ranking possui decomposição/reason codes suficientes para explicação;
- missing/stale/conflito permanece explícito e não vira nota neutra;
- empates possuem ordenação determinística;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #42;
- ADR-0024 — Investment Engine scoring e valuation;
- `docs/FINANCIAL-METHODOLOGY.md`;
- `docs/INVESTMENT-ENGINE-METHODOLOGY.md`;
- `docs/ROADMAP.md` — Fase 5 / Investment Engine.
