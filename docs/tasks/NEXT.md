# Próxima Atividade — Investment Engine: Quality, Opportunity, Dividend Score e valuation

**Status:** READY

## Issue canônica

- #41 — `Investment Engine: Quality, Opportunity, Dividend Score e valuation`

## Objetivo

Construir o núcleo analítico determinístico do Investment Engine, com metodologias versionadas, auditáveis e adequadas por classe/setor, sem transformar ausência de dados em score inventado.

## Dependências concluídas

- #39 — Asset Master canônico e resolução de identidade;
- #40 — Market Data com provenance, freshness, quality gates e adapters substituíveis.

## Escopo

- definir metodologias por classe de ativo/setor;
- implementar `Quality Score`;
- implementar `Opportunity Score`;
- implementar `Dividend Score` quando aplicável;
- criar valuation snapshots;
- manter qualidade do ativo separada de preço/oportunidade;
- produzir reason codes por componente de score;
- versionar explicitamente cada metodologia;
- tratar inputs ausentes, stale ou conflitantes sem inventar nota;
- preservar provenance dos inputs materiais;
- criar testes de invariantes e casos extremos;
- documentar fórmulas, hipóteses e limitações.

## Fora de escopo

- IA generativa para definir score;
- execução automática de ordens;
- recomendação patrocinada;
- backtesting com look-ahead;
- integração de corretora/Open Finance;
- heurística que converta dado ausente em valor estimado sem flag explícita.

## Critérios de aceite

- scores são determinísticos e reproduzíveis;
- metodologia e inputs ficam auditáveis;
- ausência/staleness/conflito de dado impedem nota fictícia;
- qualidade não implica automaticamente oportunidade de compra;
- valuation preserva `asOf`, provenance e versão metodológica;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #41;
- ADR-0023 — Market Data com provenance, freshness e fallback explícito;
- `docs/FINANCIAL-METHODOLOGY.md`;
- `docs/ROADMAP.md` — Fase 5 / Investment Engine.
