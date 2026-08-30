# Catálogo de Funcionalidades

Este catálogo separa **capability implementada**, **superfície web atual**, **redesign em andamento** e **backlog**. A existência de um domínio/engine não significa que a capability já tenha UI final.

## Legenda

- **IMPLEMENTADO — domínio/engine:** contrato e testes existem, mas podem ainda não estar expostos na UI final;
- **IMPLEMENTADO — web:** existe fluxo utilizável hoje;
- **REDESIGN:** capability existe, porém sua superfície está sendo migrada pela #69;
- **BACKLOG:** ainda requer vertical próprio.

## Estado atual

| Área | Estado | Observação |
| --- | --- | --- |
| autenticação GitHub + sessão server-side | IMPLEMENTADO — web | focused auth R4 concluído |
| onboarding financeiro | IMPLEMENTADO — web | guided flow R5 sobre AppShell/design system |
| perfil financeiro local e migração opt-in para conta | IMPLEMENTADO — web | contratos de conflito/ownership preservados |
| Portfolio/Asset/Transaction Ledger/positions | IMPLEMENTADO — web + domínio | Carteira R7 organizada por tarefas no PR #92 |
| pipeline determinístico de aporte | IMPLEMENTADO — domínio + web | allocator, política, concentração, execução, custos e snapshot preservados no R7 |
| explicação determinística do aporte | IMPLEMENTADO — web | reason codes/status, sem IA, em progressive disclosure |
| Asset Master | IMPLEMENTADO — domínio | matching e provenance; exposição visual futura quando necessária |
| Market Data | IMPLEMENTADO — foundation | snapshots, freshness/cache/fallback; cobertura de providers ainda parcial |
| Investment Engine | IMPLEMENTADO — engine | Quality, Opportunity, Dividend, valuation, Portfolio Fit e ranking |
| Investment Thesis | IMPLEMENTADO — engine | versionamento, eventos, reviews e lifecycle |
| ingestão segura para IA | IMPLEMENTADO — foundation | conteúdo permanece untrusted; não equivale a Copiloto pronto |
| Dashboard Assistant-First | IMPLEMENTADO — web | R6 / #78 / PR #91; somente fatos reais e estados honestos |
| Carteira Assistant-First | IMPLEMENTADO — web | R7 / #79 / PR #92; overview, ativos/posições, transações, aporte e configuração por tarefa |
| estados transversais finais | REDESIGN | #80 / R8 |
| visual/a11y/responsive QA completo | REDESIGN | #81 / R9 |
| Copiloto conversacional | BACKLOG | #45, UI somente sobre a fundação final da #69 |
| factuality/hallucination eval suite | BACKLOG | #46 |
| simulação/backtesting | BACKLOG | #48 |
| integrações financeiras | BACKLOG | #49, sujeitas a security/regulatory gates |
| produto público | BACKLOG | #50 / Regulatory Gate |

## Dashboard

Implementado no R6 (#78 / PR #91):

- greeting derivado da identidade autenticada;
- contexto do perfil financeiro compartilhado;
- KPIs **somente quando calculáveis por fonte real**;
- meta de reserva apresentada explicitamente como target declarado, nunca saldo;
- panorama da carteira como região dominante;
- ausência de carteira compartilhada tratada com empty state e próxima ação real;
- sem patrimônio, retorno, composição, Market Data, score ou recomendação inventados;
- context rail neutro, sem simular a capability do Copiloto #45;
- detalhes de indisponibilidade em progressive disclosure.

A integração futura de fatos de Portfolio/ledger ao Dashboard deve preservar `docs/design/DASHBOARD.md` e só introduzir métricas quando existir fonte real e determinística para a superfície.

## Carteira

Implementado no R7 (#79 / PR #92):

- criação/configuração inicial focada;
- navegação local por Visão geral, Ativos e posições, Transações, Aporte e Configuração;
- overview com nome/moeda, contagens factuais, posições projetadas e próxima ação;
- catálogo local de Assets separado de posições;
- Transaction Ledger separado dos formulários de criação;
- `BUY`, `SELL`, `CASH_IN`, `CASH_OUT` preservados sem fato parcial;
- posições projetadas exclusivamente a partir do ledger;
- TargetAllocation e aporte determinístico preservados;
- elegibilidade/quantidade mínima, concentração e custos conhecidos preservados;
- RecommendationSnapshot e explicação determinística preservados;
- UUIDs, reason codes e reconciliações técnicas em progressive disclosure;
- forms/actions/status/feedback sobre primitives R2;
- desktop/tablet/mobile definidos por composição responsiva;
- perfil financeiro da sessão disponível como contexto secundário.

Valor atual, P&L e métricas dependentes de Market Data continuam ausentes quando a superfície não possui fonte real. O R7 também não conecta persistência server-side implicitamente e não executa ordens financeiras.

Contrato canônico: `docs/design/PORTFOLIO.md`.

## Perfil, objetivos e reserva

Implementado no domínio e no onboarding:

- moeda de referência;
- tolerância declarada a risco;
- horizonte;
- meta opcional de reserva;
- patrimônio-alvo;
- renda passiva mensal;
- aposentadoria;
- objetivo datado.

Reserva é uma **meta**, não saldo. Objetivos não ganham progresso fictício sem dados que suportem o cálculo.

## Aporte inteligente

Implementado de forma determinística:

- receber valor disponível;
- reconciliar base monetária informada;
- medir gaps de alocação;
- limitar microaportes/destinos;
- aplicar concentração;
- aplicar elegibilidade e quantidade mínima;
- aplicar custos conhecidos/impacto tributário monetário informado;
- permitir sobra em caixa;
- produzir snapshot versionado/auditável;
- explicar status e reason codes sem LLM.

Na Carteira R7, o pipeline é apresentado como planejamento auditável: nenhuma etapa envia ordem para corretora ou transforma orçamento monetário em quantidade recomendada sem Market Data real.

A seleção/ranking analítico por ativo é uma capability separada do Investment Engine; integração de produto deve preservar essa separação.

## Radar e análise

Implementado no engine:

- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation snapshots;
- Portfolio Fit;
- ranking explicável;
- metodologias versionadas;
- missing/stale/conflict/look-ahead explícitos.

Ainda não significa radar visual completo no app. Comparativos, filtros e surfaces finais entram quando houver vertical de produto que os consuma.

## Teses

Implementado no engine:

- tese por ativo/versionamento;
- fatos com provenance;
- drivers;
- riscos;
- indicadores monitorados;
- critérios de invalidação;
- eventos/resultados;
- reviews;
- timeline;
- estados de atualidade/invalidação.

A UI final de tese ainda depende da evolução das superfícies do produto.

## Inteligência de mercado

Fundação implementada:

- contratos de preço, FX e macro;
- snapshots normalizados;
- `asOf`/`retrievedAt`;
- provenance;
- freshness;
- cache;
- fallback explícito;
- provider de macro oficial BCB/SGS.

Backlog de produto/dados:

- ampliar providers reais/licenciados de preço e fundamentals;
- séries e cobertura necessárias para simulação/backtesting;
- surfaces de stale/missing/provenance quando conectadas à web.

## IA assistiva

Fundação de segurança implementada:

- source allowlist;
- normalização e limites;
- dedupe/revisão;
- provenance/retention;
- classificação por ativo/tese/evento;
- `UNTRUSTED_EXTERNAL_CONTENT`;
- instruction authority `NONE`;
- quarantine de prompt injection suspeito;
- audit store contract.

Backlog:

- #45 — explicações/perguntas em linguagem natural sobre dados estruturados;
- #46 — factuality, hallucination e adversarial evaluation mais ampla.

Não permitido: IA alterar regra financeira, score, posição ou fato canônico por si só.

## Simulações

Backlog #48:

- aporte recorrente;
- inflação;
- horizonte;
- reinvestimento;
- cenários probabilísticos quando adequados;
- metas;
- benchmarks;
- backtesting sem look-ahead;
- reconstrução histórica com dados disponíveis no instante simulado.

## Alertas

Futuro, quando derivados de fatos reais:

- ativo acima de limite;
- tese sem revisão/stale;
- dado stale/missing;
- resultado/evento material;
- concentração;
- aporte mensal pendente.

Evitar alerta por oscilação irrelevante ou signal sem metodologia.

## Integrações

Backlog #49, sujeito a gates:

- Open Finance/read-only;
- importação de corretora;
- reconciliação;
- consentimento/revogação;
- notificações.

## App/PWA

Atual:

- web responsiva Next.js;
- desktop/tablet/mobile como estados da mesma solução;
- AppShell responsivo implementado.

Futuro:

- instalação PWA/offline somente quando houver estratégia segura para cache e dados financeiros.

## Fora de escopo atual

- execução automática de ordem;
- custódia;
- day trade;
- derivativos;
- alavancagem;
- copy trading;
- feed social;
- ranking/recomendação patrocinada;
- promessa de retorno.
