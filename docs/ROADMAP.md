# Roadmap

O roadmap é ordenado por redução de risco. Fases posteriores não devem bloquear a criação de um núcleo correto e testável.

## Intervenção estratégica — Redesign completo UX/UI — EM ANDAMENTO

A evolução das superfícies visuais está priorizando a issue #69 — `UX/UI: redesign completo do app com base no Protótipo 3`.

O redesign cobre **todo o app web**: auth, onboarding, shell, dashboard, carteira, componentes financeiros, estados transversais e responsividade.

### Direção visual aprovada

O **Protótipo 3 — Assistant-First Workspace** é a referência visual canônica. R1 deve refiná-lo e expandi-lo para todas as superfícies, preservando arquitetura, hierarquia e linguagem visual, sem inventar métricas ou alterar regras de domínio para reproduzir dados ilustrativos.

Referências obrigatórias:

- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/FRONTEND-AUDIT.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`.

### Sequência canônica

- [x] R0 — audit completo e inventário — #72;
- [ ] R1 — arquitetura da informação + expansão do Protótipo 3 — #73;
- [ ] R2 — design tokens e primitives — #74;
- [ ] R3 — app shell/sidebar/navegação — #75;
- [ ] R4 — auth e sessão — #76;
- [ ] R5 — onboarding completo — #77;
- [ ] R6 — dashboard completo — #78;
- [ ] R7 — carteira completa — #79;
- [ ] R8 — componentes/estados transversais — #80;
- [ ] R9 — acessibilidade, responsividade e visual QA — #81;
- [ ] R10 — gate final e fechamento da #69.

O R0 concluiu o inventário de código e a revisão visual desktop atual. O responsive atual foi auditado pelos breakpoints existentes; não houve visual QA mobile do frontend antigo. Essa limitação está registrada e será tratada no produto redesenhado em #81.

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
