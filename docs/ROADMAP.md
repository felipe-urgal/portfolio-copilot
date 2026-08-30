# Roadmap

O roadmap é ordenado por redução de risco. Ele registra **estado estratégico**, não substitui issues, ADRs ou `docs/tasks/NEXT.md`.

Consulte `docs/DOCUMENTATION-MAP.md` para a precedência das fontes de verdade.

## Prioridade atual — Redesign completo UX/UI — #69 — EM ANDAMENTO

O **Protótipo 3 — Assistant-First Workspace** é a direção visual canônica. A iniciativa cobre todo `apps/web`: auth, onboarding, shell, dashboard, carteira, componentes/estados transversais e responsividade.

### Concluído

- [x] R0 — audit/inventário — #72;
- [x] R1 — arquitetura da informação + expansão do Protótipo 3 — #73;
- [x] R2 — design tokens e primitives — #74;
- [x] R3 — AppShell/sidebar/drawer/navegação — #75;
- [x] R4 — focused auth e sessão — #76;
- [x] R5 — onboarding guiado — #77 / PR #88;
- [x] R6 — dashboard orientado a contexto/panorama/próxima ação — #78 / PR #90.

### Próximo

- [ ] **R7 — carteira completa — #79**.

### Depois

- [ ] R8 — componentes/estados transversais — #80;
- [ ] R9 — accessibility, responsive e visual fidelity QA — #81;
- [ ] R10 — gate final e fechamento da #69.

Referências canônicas:

- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/design/DASHBOARD.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`.

Enquanto #69 estiver ativa, novas surfaces não podem criar um sistema visual paralelo nem inventar rota, KPI, dado ou Copiloto para copiar o mockup.

---

## Fundação técnica e governança — IMPLEMENTADA

Entregas existentes:

- pnpm workspace/monorepo;
- Next.js web app;
- Node 24 + TypeScript strict;
- lint/format/test/build;
- CI GitHub Actions;
- Docker Compose/PostgreSQL local;
- política de supply chain;
- configuração segura de ambiente;
- processo de PR, quality gate e auto code review;
- baseline de segurança e regulatório;
- documentação/ADRs e mapa canônico de documentação.

A evolução dessa fundação ocorre por necessidade concreta, não como fase pendente genérica.

## Portfolio Engine / domínio financeiro — NÚCLEO IMPLEMENTADO

Já existem:

- Money/Percentage/AllocationWeight/AssetQuantity;
- Asset/AssetClass/InstrumentType/AssetId;
- Portfolio;
- Transaction Ledger imutável;
- projeção determinística de posições;
- TargetAllocation;
- AllocationGap;
- ContributionAllocator;
- política de microaporte/limite de destinos;
- elegibilidade e quantidade mínima;
- limites de concentração;
- custos/impacto tributário conhecido informado;
- RecommendationSnapshot canônico;
- reason codes/status explicáveis;
- suíte de invariantes do pipeline.

Extensões financeiras futuras exigem issue/metodologia próprias e não devem ser inferidas desta lista.

## Produto MVP — IMPLEMENTADO EM CAPABILITIES, JORNADA FINAL AINDA ABERTA

Existem hoje:

- autenticação GitHub e sessão server-side;
- perfil financeiro, objetivos e reserva;
- persistência local opt-in;
- persistência PostgreSQL com ownership;
- migração local → conta opt-in/conflict-safe;
- Dashboard R6 sobre AppShell/tokens/primitives, sem métricas fictícias;
- Carteira com Portfolio/Assets/Ledger/positions;
- fluxo local do aporte do mês e explicação determinística.

Pendências:

- #79 — concluir a experiência visual da Carteira;
- #47 — fechar a jornada ponta a ponta do MVP sobre as surfaces migradas.

## Asset Master e Market Data — FOUNDATION IMPLEMENTADA, COBERTURA EVOLUTIVA

Implementado:

- Asset Master com identidade canônica, listings/identificadores e provenance;
- matching explícito `UNMATCHED/PARTIAL_MATCH/MATCH/CONFLICT`;
- package de Market Data;
- snapshots exatos com `asOf`/`retrievedAt`/provenance;
- freshness/cache/quality flags;
- fallback autorizado;
- providers de macro BCB/SGS e contracts de preço/FX.

Ainda evolutivo:

- cobertura produtiva/licenciada de preço e fundamentals;
- séries históricas necessárias para #48;
- integração ampla dessas capabilities na UI.

## Investment Engine — NÚCLEO IMPLEMENTADO

Implementado:

- evidências analíticas e metodologias versionadas;
- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation snapshots;
- Portfolio Fit;
- ranking explicável;
- missing/stale/conflict/look-ahead explícitos;
- separação entre qualidade, oportunidade e aderência à carteira.

Surfaces finais de análise/radar entram apenas quando houver vertical de produto correspondente.

## Teses e eventos — NÚCLEO IMPLEMENTADO

Implementado:

- InvestmentThesis imutável/versionada;
- fatos com provenance;
- drivers e riscos;
- indicadores;
- critérios de invalidação;
- eventos e reviews;
- timeline auditável;
- estados CURRENT/STALE/INVALIDATED e vigência temporal das versões.

Integração de produto/alertas permanece evolutiva.

## IA assistiva — FOUNDATION DE INGESTÃO IMPLEMENTADA; COPILOTO EM BACKLOG

Implementado em #44:

- ingestão deny-by-default;
- allowlist de fontes;
- normalização/limites;
- provenance/retention;
- dedupe/revisão;
- classificação;
- `UNTRUSTED_EXTERNAL_CONTENT` + instruction authority `NONE`;
- quarantine de prompt injection suspeito;
- audit store contract e testes adversariais iniciais.

Próximos verticais:

- #45 — Copiloto explicável sobre dados estruturados/recomendações;
- #46 — factualidade, alucinação e avaliação adversarial ampliada.

A UI da #45 deve nascer somente sobre a fundação final da #69.

## Simulação e backtesting — BACKLOG #48

- cenários de aporte;
- inflação/reinvestimento;
- cenários probabilísticos quando adequados;
- reconstrução histórica;
- backtesting sem look-ahead;
- benchmarks.

Requer dados históricos adequados e metodologia versionada.

## Integrações financeiras — BACKLOG #49

Somente após segurança/consentimento/regulatório:

- Open Finance/read-only;
- importação de corretora;
- reconciliação;
- consentimento/revogação;
- proteção de tokens;
- auditoria.

## Produto público — BACKLOG #50

**Regulatory Gate obrigatório.**

Inclui:

- modelo de negócio;
- revisão jurídica/regulatória;
- LGPD/privacidade;
- tenancy/multiusuário endurecido;
- observabilidade/SLO;
- suporte;
- billing se aplicável;
- backup/DR;
- pentest/avaliação de segurança;
- termos/disclosures.

## Fora do roadmap até decisão explícita

- execução automática de ordens;
- custódia;
- day trade;
- derivativos;
- alavancagem;
- copy trading;
- recomendação/ranking patrocinado;
- promessa de retorno.
