# Próxima Atividade — Market Data: preços, FX, macro, provenance, freshness e quality gates

**Status:** READY

## Issue canônica

- #40 — `Market Data: preços, FX, macro, provenance, freshness e quality gates`

## Objetivo

Criar a camada confiável de Market Data que abasteça carteira, valuation e Investment Engine sem inventar dados e preservando origem, tempo de referência e qualidade.

## Dependência concluída

- #39 — Asset Master canônico e resolução de identidade.

## Escopo

- definir adapter de preços substituível;
- representar FX;
- integrar indicadores macro oficiais relevantes;
- usar snapshots com `asOf` explícito;
- registrar provenance por dado material;
- definir freshness/TTL por categoria;
- criar cache com invalidação explícita;
- representar quality flags para ausência, atraso e conflito;
- permitir fallback entre provedores somente por regras explícitas;
- criar contract tests por adapter;
- adicionar observabilidade sem logar dados pessoais ou segredos;
- documentar fontes e restrições de licença.

## Fora de escopo

- fundamentals e valuation completos;
- ranking/recomendação de investimento;
- IA assistiva;
- execução de ordens;
- importação de corretora/Open Finance;
- matching probabilístico de identidade de ativos.

## Critérios de aceite

- todo dado material informa origem e `asOf`;
- dado stale ou ausente nunca é apresentado como atual;
- adapters são substituíveis e cobertos por contrato;
- falha de provedor degrada de forma explícita;
- cache e fallback não escondem freshness ou conflito;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #40;
- ADR-0022 — Asset Master canônico e resolução de identidade;
- `docs/DATA-SOURCES.md`;
- `docs/ROADMAP.md` — Fase 4 / Market Data.
