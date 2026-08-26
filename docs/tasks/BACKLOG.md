# Backlog

Backlog macro. A ordem pode mudar mediante decisão registrada.

## Fundação técnica

- bootstrap de workspace e app web/PWA;
- domínio compartilhado;
- lint/typecheck/test/build;
- CI;
- configuração de ambiente;
- logging e error boundary;
- baseline de segurança.

## Portfolio Engine

- tipos Money, Percentage e AllocationWeight;
- Asset e AssetClass;
- Portfolio;
- Transaction ledger;
- Holding projection;
- TargetAllocation;
- AllocationGap;
- ContributionAllocator;
- `minimumMeaningfulContribution` e limite de destinos por aporte;
- unidade mínima negociável e elegibilidade do aporte;
- limites de concentração;
- custos/impactos tributários relevantes como restrições quando disponíveis;
- rounding/cash remainder;
- testes property-based.

## Produto MVP

- autenticação;
- perfil financeiro;
- objetivos;
- reserva;
- dashboard;
- posições;
- transações;
- alocação;
- aporte do mês;
- RecommendationSnapshot;
- explicações determinísticas iniciais.

## Dados

- asset master;
- preço diário;
- FX;
- macro;
- fundamentals;
- provenance;
- freshness;
- quality flags;
- adapters e contract tests.

## Investment Engine

- metodologias específicas por classe/setor;
- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation;
- Portfolio Fit;
- radar;
- versionamento.

## Teses

- InvestmentThesis;
- drivers;
- riscos;
- indicadores;
- eventos;
- critérios de invalidação;
- revisão periódica.

## IA

- news/event ingestion;
- resumo de resultados;
- extração estruturada;
- explainability;
- prompt-injection defense;
- factuality/evaluation suite.

## Simulações

- aporte recorrente;
- objetivos;
- inflação;
- renda passiva estimada;
- cenários;
- backtesting;
- benchmarks.

## Integrações futuras

- Open Finance/read-only;
- importação de corretora quando permitido;
- reconciliação;
- alertas;
- notificações.

## Produto público

- Regulatory Gate;
- LGPD;
- tenancy;
- suporte;
- observabilidade/SLO;
- backup/DR;
- billing se aplicável;
- segurança independente.
