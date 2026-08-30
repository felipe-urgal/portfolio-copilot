# Done

Histórico resumido das entregas concluídas do Portfolio Copilot.

O histórico detalhado anterior à reconciliação de 2026-08-30 foi preservado **sem alteração de conteúdo** em:

- [`archive/DONE-through-2026-08-27.md`](archive/DONE-through-2026-08-27.md)

Git/PRs continuam sendo a evidência completa de cada mudança. Este arquivo passa a registrar marcos de produto/arquitetura de forma resumida para não competir com issues e PRs.

## 2026-08-26 — Fundação documental e técnica

- visão, produto, Project Brief, metodologia, segurança, dados, regulatório e roadmap iniciais;
- monorepo pnpm com `apps/web`, `packages/domain` e `packages/shared`;
- Node.js 24, TypeScript strict, ESLint, Prettier e Vitest;
- CI, supply-chain baseline, `.env.example` e regras de desenvolvimento;
- rota `/health` e aplicação web inicial.

## 2026-08-26 — Portfolio Engine determinístico

- `Money`, `CurrencyCode`, `Percentage`, `AllocationWeight` e `AssetQuantity` com precisão explícita;
- identidade canônica de Asset/Portfolio/Transaction;
- separação `AssetClass` × `InstrumentType`;
- Transaction Ledger imutável;
- projeção de posições a partir do ledger;
- TargetAllocation e AllocationGap;
- ContributionAllocator;
- política de microaporte e limite de destinos;
- restrições de execução, quantidade mínima e elegibilidade;
- limites de concentração;
- custos/impacto tributário conhecido informado;
- `ContributionRecommendationSnapshot` canônico com methodology version, reason codes, cash remainder e reconciliação;
- suíte determinística de invariantes do pipeline;
- ADRs 0005–0017 e decisões correspondentes.

## 2026-08-26/27 — MVP web inicial

- onboarding financeiro com risco/horizonte, reserva e objetivos;
- Dashboard com estados honestos sem métricas inventadas;
- workspace local de Portfolio;
- `CASH_IN`/`CASH_OUT` e depois `BUY`/`SELL` com over-sell protegido;
- posições projetadas exclusivamente pelo ledger;
- TargetAllocation e baseline monetário local;
- política, concentração, execution constraints e custos integrados ao fluxo web;
- RecommendationSnapshot apresentado de forma auditável;
- explicação determinística PT-BR baseada somente em status/reason codes;
- perfil financeiro compartilhado entre Onboarding, Dashboard e Carteira;
- persistência local do perfil opt-in, versionada e revalidada.

Detalhes finos dessas primeiras entregas permanecem no arquivo arquivado e nos PRs correspondentes.

## 2026-08-27 — Autenticação e identidade — #35

- Auth.js v5 com GitHub OAuth;
- sessão server-side e identidade canônica separada de IDs financeiros;
- proteção de `/dashboard`, `/portfolio` e `/onboarding`;
- callback/redirect restritos a destinos internos aceitos;
- cookies/sessão seguem política segura do Auth.js;
- login/logout não migram nem apagam perfil financeiro automaticamente;
- ADR-0020 / D-028.

## 2026-08-27 — Persistência PostgreSQL com ownership — #37 / PR #51

- `packages/persistence` com Drizzle + PostgreSQL;
- schema e migrations versionadas;
- repositories privados derivados do owner autenticado;
- chaves/FKs compostas reforçando isolamento por owner;
- persistência de perfil financeiro, Portfolio, ledger append-only, TargetAllocation e referências de assets;
- integração testada contra PostgreSQL real;
- conexão/schema bruto não expostos como API de aplicação;
- ADR-0021 / D-009 / D-029.

## 2026-08-27 — Setup local PostgreSQL sem conflito — #52 / PR #53

- Docker Compose com PostgreSQL 18.6 em `127.0.0.1:5433`;
- `pnpm db:up` / `pnpm db:down`;
- migrations usam `DATABASE_URL` do processo e fallback local documentado;
- `.env.example` e README alinhados ao fluxo local.

## 2026-08-29 — Migração opt-in do perfil local para conta — #38 / PR #54

- `GET/POST /api/financial-profile` autenticado;
- migration plan determinístico;
- `LOCAL_MIGRATION` provenance;
- criação apenas se conta continua vazia;
- conflito exige consentimento explícito;
- compare-and-swap evita lost update;
- concorrência retorna `409` para nova revisão;
- cópia local não é removida implicitamente;
- D-030.

## 2026-08-29 — Asset Master canônico — #39 / PR #56

- catálogo sobre `AssetId` estável;
- listings atuais/históricos e identificadores externos com provenance;
- matching determinístico `UNMATCHED`, `PARTIAL_MATCH`, `MATCH` e `CONFLICT`;
- aliases históricos não se tornam identificadores correntes;
- múltiplos providers podem apontar para o mesmo Asset;
- conflitos cross-asset permanecem explícitos;
- validação de ISIN endurecida posteriormente no audit #60;
- ADR-0022 / D-031.

## 2026-08-29 — Market Data foundation — #40 / PR #58

- package `@portfolio-copilot/market-data`;
- preço decimal exato + moeda;
- snapshots de preço/FX/macro com provenance, `asOf`, `retrievedAt` e quality flags;
- estados fresh/stale/future;
- cache e invalidação;
- provider contracts substituíveis;
- falhas `FOUND`, `MISSING` e `PROVIDER_ERROR` explícitas;
- fallback somente por política autorizada;
- BCB/SGS para macro oficial;
- timeout e observabilidade sem payload sensível;
- ADR-0023 / D-032.

## 2026-08-29 — Investment Engine determinístico — #41 / PR #59

- package `@portfolio-copilot/investment-engine`;
- evidências analíticas com provenance/tempo;
- metodologias versionadas por classe/instrumento/setor;
- Quality, Opportunity e Dividend separados;
- valuation auditável e decimal exato;
- missing/stale/conflict/look-ahead produzem `INSUFFICIENT_DATA` em vez de nota inventada;
- baselines distintos para ação geral, bancos e FIIs;
- ADR-0024 / D-033.

## 2026-08-29 — Audit sênior cross-cutting — #60 / PR #61

Hardening sobre domínio, persistência, Asset Master, Market Data e Investment Engine:

- checksum ISO 6166/Luhn para ISIN;
- `TransactionId` duplicado rejeitado em projection;
- rateio por maiores restos rejeita classe duplicada;
- methodology version do aporte canônica/limitada;
- cache valida clock também na leitura;
- exceção de provider vira `PROVIDER_ERROR` explícito;
- fair value vinculado a `AssetId`;
- endpoint de migração limita body por bytes do stream;
- backups temporários removidos/ignorados.

## 2026-08-30 — Portfolio Fit e ranking explicável — #42 / PR #63

- Portfolio Fit versionado e separado de Quality/Opportunity;
- contexto validado para mesma carteira/asset/classe;
- bloqueios de política/concentração/elegibilidade/custos zeram Fit explicitamente;
- ranking preserva componentes e contribuições ponderadas;
- missing data não vira nota neutra;
- desempate determinístico por `AssetId`;
- ADR-0025 / D-034.

## 2026-08-30 — Investment Thesis, eventos e reviews — #43 / PR #65

- `InvestmentThesisSnapshot` imutável/versionado;
- fatos separados de drivers/riscos/critérios;
- provenance e proteção contra look-ahead;
- mudança material cria nova versão ligada a review `REVISED`;
- eventos/reviews associados somente à versão vigente correta;
- timeline valida cadeia de versões;
- estados `CURRENT`, `STALE` e invalidação explícita;
- ADR-0026 / D-035.

## 2026-08-30 — Ingestão segura para IA — #44 / PR #68

- source registry deny-by-default;
- allowlist por source/host/kind;
- normalização de Unicode/texto/metadata e limites;
- provenance, `asOf`, `retrievedAt`, normalization version e retention;
- conteúdo fixado como `UNTRUSTED_EXTERNAL_CONTENT` com instruction authority `NONE`;
- scanner inicial de prompt injection e quarantine antes do classifier;
- SHA-256 para dedupe exato;
- source mutation vira revisão auditável;
- stale explícito;
- classificação por asset/tese/evento validada;
- audit store append-only contract;
- testes adversariais, parser/classifier failure e regressões de auto-review;
- ADR-0027 / D-036.

## 2026-08-30 — Direção visual Protótipo 3 e iniciativa #69

- Protótipo 3 — Assistant-First Workspace aprovado e versionado;
- regra explícita de não transformar números/capabilities ilustrativos do mockup em dados reais;
- roadmap R0–R10 criado para refazer o app completo antes de novas surfaces relevantes.

## 2026-08-30 — UX/UI R0 audit — #72 / PR #82

- inventário de rotas, estados, CSS, responsividade, UX e a11y do frontend anterior;
- design system implícito/duplicado identificado;
- onboarding com shell próprio e Portfolio workspace denso mapeados;
- visual QA mobile real deixado como gate futuro do R9;
- `docs/design/FRONTEND-AUDIT.md` criado como baseline histórico.

## 2026-08-30 — UX/UI R1 Assistant-First app spec — #73 / PR #84

- arquitetura de informação completa do app;
- navigation model sem rotas fictícias;
- AppShell desktop/tablet/mobile;
- focused auth;
- onboarding no shell;
- dashboard orientado a panorama/ação;
- carteira por tarefas/progressive disclosure;
- papel e limites do Copiloto;
- estados common, accessibility e responsive contracts;
- README e arquitetura reconciliados com o estado real;
- D-037.

## 2026-08-30 — UX/UI R2 design system — #74 / PR #85

- semantic tokens de cor/tipografia/spacing/layout/radius/elevation/focus/motion/layering;
- primitives `Container`, `Stack`, `Cluster`, `Grid`, `PageHeader`;
- `Button`, `LinkButton`, fields/inputs/select;
- `ChoiceCard`, `SegmentedControl`;
- `Surface`, `Status`, `Badge`, `Alert`, `EmptyState`;
- loading/skeleton;
- apresentação de valores financeiros;
- icon wrapper acessível;
- reduced motion e baseline de touch/focus;
- `docs/design/DESIGN-SYSTEM.md` / D-038.

## 2026-08-30 — UX/UI R3 AppShell — #75 / PR #86

- único AppShell para superfícies protegidas;
- sidebar desktop e drawer responsive;
- navegação somente para capabilities reais;
- account/session utility e `/health` em segunda ordem;
- skip link/landmarks;
- focus trap, Escape/backdrop, return focus e body scroll management;
- apenas `displayName` atravessa para a ilha client;
- `ProductShell` legado removido;
- Dashboard, Carteira e Onboarding adotaram o mesmo shell;
- `docs/design/APP-SHELL.md` / D-039.

## 2026-08-30 — UX/UI R4 focused auth — #76 / PR #87

- `/sign-in` com uma CTA principal: GitHub;
- `/health` removido como CTA concorrente;
- auth errors e re-entry com copy segura;
- loading real via primitive canônica;
- privacidade/segurança em disclosure secundário;
- `/sign-out` reduzido a contexto mínimo;
- provider/callback/identity/ownership preservados;
- `docs/design/AUTH-SESSION.md` / D-040.

## 2026-08-30 — UX/UI R5 guided onboarding — #77 / PR #88

- onboarding redesenhado sobre AppShell R3 e primitives R2;
- quatro etapas preservadas: Perfil, Reserva, Objetivos e Revisão;
- progressão compacta/subordinada ao shell;
- `ChoiceCard`, `SegmentedControl`, fields, feedback e actions canônicas;
- reducer, validação, `FinancialProfileSnapshot` e foco no primeiro erro preservados;
- persistência local continua opt-in e em segunda ordem;
- objetivos usam seções abertas, evitando card-in-card;
- responsive/mobile sem shell local paralelo;
- `docs/design/ONBOARDING.md` / D-041;
- PR #88 também reconciliou documentação/issue status do repositório e adicionou `AGENTS.md` como contrato operacional para agentes de IA.

Este marco é considerado concluído com o merge do PR #88.

## 2026-08-30 — UX/UI R6 Dashboard Assistant-First — #78 / PR #89

- greeting derivado somente do `displayName` da identidade autenticada;
- hierarquia principal reorganizada em contexto, panorama e próxima ação;
- métricas compactas exibidas somente a partir do perfil financeiro validado;
- meta de reserva tratada explicitamente como target declarado, nunca saldo atual;
- panorama de Carteira como bloco dominante com estado vazio honesto enquanto Portfolio/Assets/Ledger não são compartilhados com o Dashboard;
- patrimônio, retorno, composição, Market Data, scores e recomendações permanecem ausentes sem fonte real;
- context rail neutro com fatos do perfil, sem simular a UI funcional do Copiloto #45;
- migração opt-in do perfil para a conta passou a usar primitives/tokens canônicos sem alterar concorrência, consentimento ou ownership;
- regression tests cobrem hierarquia, ausência de números fictícios e fatos válidos do perfil;
- `docs/design/DASHBOARD.md` registra o contrato canônico do R6;
- README, roadmap, catálogo de funcionalidades e fila operacional reconciliados.

Este marco é considerado concluído quando o próprio PR #89 é mergeado.

## Estado após #89

Próxima atividade canônica: **#79 — R7 Carteira**.

Backlog aberto principal:

- #79–#81 e R10 para concluir #69;
- #45/#46 para Copiloto e avaliação de IA;
- #47 para convergência ponta a ponta do MVP;
- #48 simulação/backtesting;
- #49 integrações financeiras;
- #50 produto público/Regulatory Gate.
