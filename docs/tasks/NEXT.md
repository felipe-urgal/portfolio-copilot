# Próxima Atividade — Market Data: catálogo canônico de ativos e identidade de instrumentos

**Status:** READY

## Issue canônica

- #39 — `Market Data: catálogo canônico de ativos e identidade de instrumentos`

## Objetivo

Construir o Asset Master canônico que permita identificar corretamente ativos independentemente de ticker ou provedor e sirva de base para preços, fundamentals, valuation e IA.

## Escopo

- definir modelo canônico de instrumento/ativo;
- manter ticker por bolsa/mercado separado do `AssetId`;
- representar país, moeda, bolsa e identificadores externos quando disponíveis;
- preservar classe econômica e tipo de instrumento como conceitos separados;
- suportar aliases e mudanças de ticker;
- representar status ativo/inativo/delisted quando aplicável;
- registrar provenance por identificador externo;
- definir estratégia explícita de matching e deduplicação;
- criar adapter inicial de catálogo;
- cobrir identidade, matching e conflitos com testes.

## Fora de escopo

- adapter de preços e séries temporais;
- fundamentals, valuation ou scoring;
- recomendação de investimento;
- execução de ordens;
- importação de corretora/Open Finance;
- IA assistiva.

## Critérios de aceite

- ticker nunca é chave de domínio;
- múltiplos provedores podem apontar para o mesmo ativo canônico;
- conflitos de identidade são detectáveis e auditáveis;
- `AssetClass` e `InstrumentType` continuam semanticamente separados;
- provenance acompanha identificadores externos relevantes;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #39;
- ADR-0006 — identidade de ativos e taxonomias;
- `docs/ROADMAP.md` — Fase 4 / Market Data;
- `docs/DATA_STRATEGY.md`.
