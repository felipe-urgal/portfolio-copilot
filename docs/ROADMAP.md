# Roadmap

O roadmap é ordenado por redução de risco. Fases posteriores não devem bloquear a criação de um núcleo correto e testável.

## Intervenção estratégica — Redesign completo UX/UI — EM ANDAMENTO

A evolução das superfícies visuais entra em uma pausa estratégica para executar a issue #69 — `UX/UI: redesign completo do app e novo design system`.

O redesign cobre **todo o app web**, não apenas uma tela: auth, onboarding, shell, dashboard, carteira, componentes financeiros, estados transversais e responsividade.

Roadmap detalhado: `docs/UX-UI-REDESIGN-ROADMAP.md`.

Sequência canônica:

- [ ] R0 — audit completo e inventário;
- [ ] R1 — arquitetura da informação + direção visual;
- [ ] R2 — design system foundation;
- [ ] R3 — app shell e navegação;
- [ ] R4 — auth e sessão;
- [ ] R5 — onboarding completo;
- [ ] R6 — dashboard completo;
- [ ] R7 — carteira completa;
- [ ] R8 — componentes de domínio e estados transversais;
- [ ] R9 — acessibilidade, responsividade e visual QA;
- [ ] R10 — gate para novas superfícies.

Enquanto esta intervenção estiver ativa, novas interfaces relevantes — incluindo a UI da #45 — não devem criar um sistema visual paralelo. Trabalho puramente de backend/contratos pode avançar quando não produzir superfície temporária.

## Fase 0 — Fundação e governança — EM ANDAMENTO

- [x] visão do produto;
- [x] escopo e não-escopo;
- [x] arquitetura inicial;
- [x] metodologia financeira inicial;
- [x] requisitos de segurança;
- [x] estratégia de dados;
- [x] fronteira regulatória;
- [x] fluxo de desenvolvimento;
- [x] backlog e `NEXT.md`;
- [ ] revisar e mergear PR de fundação.

## Fase 1 — Fundação técnica

- [ ] workspace/monorepo;
- [ ] app web/PWA;
- [ ] pacote de domínio;
- [ ] TypeScript strict;
- [ ] lint/format;
- [ ] testes;
- [ ] CI;
- [ ] configuração de ambientes;
- [ ] convenções de erro/log;
- [ ] baseline de segurança.

## Fase 2 — Portfolio Engine

- [ ] Asset;
- [ ] Portfolio;
- [ ] Holding;
- [ ] Transaction ledger;
- [ ] TargetAllocation;
- [ ] cálculo de pesos;
- [ ] gap de alocação;
- [ ] aporte determinístico;
- [ ] regras de concentração;
- [ ] testes de invariantes.

## Fase 3 — MVP de produto

- [ ] onboarding financeiro básico;
- [ ] dashboard;
- [ ] carteira;
- [ ] cadastro de transações;
- [ ] aporte do mês;
- [ ] explicação de rebalanceamento;
- [ ] objetivos/reserva;
- [ ] persistência;
- [ ] autenticação.

## Fase 4 — Market Data

- [ ] catálogo canônico de ativos;
- [ ] adapter de preços;
- [ ] macro oficial;
- [ ] FX;
- [ ] snapshots e provenance;
- [ ] freshness;
- [ ] cache;
- [ ] quality checks;
- [ ] contract tests.

## Fase 5 — Investment Engine

- [ ] classificação por classe/setor;
- [ ] Quality Score por metodologia adequada;
- [ ] Opportunity Score;
- [ ] Dividend Score;
- [ ] valuation snapshots;
- [ ] Portfolio Fit;
- [ ] radar;
- [ ] versionamento de metodologia.

## Fase 6 — Teses e eventos

- [ ] InvestmentThesis;
- [ ] drivers e riscos;
- [ ] critérios de invalidação;
- [ ] resultados/eventos;
- [ ] timeline;
- [ ] revisão periódica;
- [ ] alerta de tese desatualizada.

## Fase 7 — IA assistiva

- [ ] ingestão segura de texto;
- [ ] deduplicação/classificação de notícia;
- [ ] resumo de resultados;
- [ ] impacto candidato na tese;
- [ ] explicações naturais a partir de dados estruturados;
- [ ] proteção contra prompt injection;
- [ ] avaliação de alucinação e factualidade.

## Fase 8 — Simulação e backtesting

- [ ] cenários de aporte;
- [ ] inflação;
- [ ] dividendos/reinvestimento;
- [ ] cenários probabilísticos quando adequados;
- [ ] backtesting sem look-ahead;
- [ ] reconstrução histórica de recomendações;
- [ ] comparação com benchmarks.

## Fase 9 — Integrações financeiras

Somente após revisão de segurança/regulatório.

- [ ] desenho de consentimento;
- [ ] Open Finance/integrações read-only;
- [ ] importação automática;
- [ ] reconciliação;
- [ ] revogação;
- [ ] criptografia de tokens;
- [ ] auditoria.

## Fase 10 — Produto público

**Regulatory Gate obrigatório antes desta fase.**

- [ ] modelo de negócio;
- [ ] revisão regulatória e jurídica;
- [ ] LGPD/privacidade;
- [ ] tenancy/multiusuário endurecido;
- [ ] observabilidade e SLO;
- [ ] suporte;
- [ ] billing se aplicável;
- [ ] disaster recovery;
- [ ] pentest/avaliação de segurança;
- [ ] termos e disclosures.

## Fora do roadmap até decisão explícita

- execução automática de ordens;
- day trade;
- derivativos;
- alavancagem;
- copy trading;
- recomendação patrocinada.
