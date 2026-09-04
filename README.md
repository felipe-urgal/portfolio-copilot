# Portfolio Copilot

Copiloto inteligente de investimentos para organizar patrimônio, estruturar aportes e tornar decisões financeiras **explicáveis, auditáveis e disciplinadas**.

> **Estado atual:** o repositório já possui domínio financeiro determinístico, Transaction Ledger, pipeline de aporte, PostgreSQL com ownership, autenticação, Asset Master, Market Data foundation, Investment Engine, teses versionadas e ingestão segura de conteúdo externo. No frontend, o redesign baseado no **Protótipo 3 — Assistant-First Workspace** concluiu R0–R8; o R8 foi fechado no PR #111 com CI pós-merge #577 verde, e **R9 accessibility/responsive/visual fidelity QA (#81)** é a prioridade canônica atual. A produção pessoal/privada em **Vercel + Neon** foi ativada em 31/08/2026 via #97/#99 e PRs #98/#100, sem liberar o produto público nem o Regulatory Gate da #50.

![Direção visual canônica — Protótipo 3](docs/design/prototypes/prototype-3-assistant-first-dashboard.jpg)

## Visão do produto

O Portfolio Copilot é um **sistema de apoio à decisão financeira**. Ele não nasce como corretora, robô de trade ou mecanismo de execução automática.

A pergunta central é:

> **Tenho R$ X para investir hoje. Considerando minha carteira, objetivos, risco, alocação, qualidade dos ativos e cenário, onde faz mais sentido aportar — e por quê?**

A resposta precisa ser reconstruível: quais fatos foram usados, quais regras bloquearam alternativas, qual metodologia estava ativa, quais dados estavam ausentes/stale e por que determinado destino recebeu ou não recebeu capital.

## Princípios

- segurança, liquidez e reserva antes de retorno;
- diversificação por fatores de risco, não quantidade de tickers;
- Transaction Ledger como fonte dos fatos de posição;
- motor financeiro determinístico, versionado e testável;
- IA assistiva abaixo das regras determinísticas;
- conteúdo externo é dado não confiável, nunca instrução;
- Quality, Opportunity e Portfolio Fit permanecem separados;
- regras de risco têm precedência sobre ranking;
- rebalanceamento prioriza novos aportes;
- fatos materiais carregam provenance e referência temporal quando aplicável;
- missing/stale/conflict não viram números inventados;
- nenhuma promessa de retorno;
- nenhuma execução automática de ordens no MVP.

## O que já existe

### Web

`apps/web` já possui:

- GitHub OAuth com Auth.js v5;
- sessão e proteção server-side;
- AppShell canônico com sidebar desktop e drawer responsivo;
- focused sign-in/sign-out;
- onboarding financeiro guiado;
- perfil financeiro compartilhado em sessão;
- persistência local opt-in do perfil;
- migração opt-in/conflict-safe do perfil local para a conta;
- Dashboard Assistant-First R6 com contexto real, panorama e próxima ação;
- Carteira Assistant-First R7 por tarefas com Portfolio, Assets, ledger, posições e aporte determinístico;
- estados/componentes transversais R8 consolidados sobre primitives canônicas, sem criar UI para capabilities ainda sem surface consumidora;
- health humano em `/health`;
- health operacional canônico em `/api/health/live` e `/api/health/ready`.

Shell, auth, onboarding, Dashboard, Carteira e estados transversais reais já usam a fundação visual nova. O R9 agora valida accessibility, responsividade, browsers e fidelidade visual do sistema completo antes do R10.

### Domínio financeiro — `packages/domain`

Implementa:

- `Money`, `CurrencyCode`, `Percentage`, `AllocationWeight`, `AssetQuantity`;
- `AssetId`, `PortfolioId`, `TransactionId`;
- `Asset`, `AssetClass`, `InstrumentType`;
- Transaction Ledger imutável;
- projeção determinística de posições;
- `TargetAllocation` e allocation gaps;
- `ContributionAllocator`;
- política de microaporte/limite de destinos;
- restrições de execução e quantidade mínima;
- limites de concentração;
- custos/impacto tributário conhecido informado;
- pipeline canônico de RecommendationSnapshot;
- onboarding, reserva e objetivos.

### Persistência — `packages/persistence`

- PostgreSQL + Drizzle;
- migrations versionadas;
- repositories server-side;
- ownership derivado da sessão;
- chaves/FKs compostas reforçando isolamento por owner;
- testes de integração com PostgreSQL real.

### Asset Master

- identidade canônica por `AssetId`;
- listings atuais/históricos;
- identificadores externos com provenance;
- matching determinístico `UNMATCHED`, `PARTIAL_MATCH`, `MATCH`, `CONFLICT`;
- ISIN com validação de checksum.

### Market Data — `packages/market-data`

- contracts de preço, FX e macro;
- snapshots com decimal exato, provenance, `asOf` e `retrievedAt`;
- freshness/cache/quality flags;
- estados missing/provider error explícitos;
- fallback somente quando autorizado;
- provider de macro oficial via BCB/SGS;
- contract/hardening tests.

A cobertura produtiva/licenciada de preço/fundamentals ainda é evolutiva.

### Investment Engine — `packages/investment-engine`

- evidências analíticas;
- metodologias versionadas;
- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation snapshots;
- Portfolio Fit;
- ranking explicável;
- proteção contra missing/stale/conflict/look-ahead;
- teses de investimento versionadas;
- drivers, riscos, critérios de invalidação;
- eventos, reviews e timeline auditável.

### Ingestão segura para IA — `packages/shared/src/ai-ingestion`

- source allowlist deny-by-default;
- normalização e limites de conteúdo/metadata;
- provenance/`asOf`/retention;
- dedupe e source mutation/revision;
- classificação por asset/tese/evento;
- `UNTRUSTED_EXTERNAL_CONTENT`;
- instruction authority `NONE`;
- quarantine de prompt injection suspeito;
- audit store contract;
- testes adversariais iniciais.

Essa fundação **não significa que o Copiloto conversacional já esteja pronto**.

## Produção pessoal/privada

O Production Contract está ativo para uso pessoal/controlado desde 31/08/2026:

- provider: Vercel;
- projeto: `portfolio-copilot`;
- promoção: `git-managed` pela branch `main`;
- domínio canônico: `https://portfolio-copilot-plum.vercel.app`;
- banco: Neon PostgreSQL 18, branch `production`;
- runtime: `DATABASE_URL` pooled;
- migration/admin explícito: `DATABASE_DIRECT_URL` direct/unpooled;
- autenticação GitHub fail-closed por allowlist da conta autorizada;
- liveness/readiness: `/api/health/live` e `/api/health/ready`;
- operações: `prod:check`, `prod:migrate` e `prod:verify`;
- deployment: gerenciado pela Vercel a partir de `main`, sem `prod:deploy` local;
- baseline de recuperação validado por snapshot e restore-check isolado.

A produção atual **não é produto público/multi-tenant**. Exposição a terceiros, monetização, LGPD operacional, observabilidade/SLO e demais gates continuam na #50.

Leia [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

## O que ainda não está concluído

- accessibility/responsive/visual fidelity QA final — #81/R9;
- fechamento R10 da iniciativa #69;
- Copiloto explicável de IA — #45;
- factuality/hallucination/adversarial eval ampliada — #46;
- convergência final da jornada MVP — #47;
- simulação/backtesting — #48;
- integrações financeiras — #49;
- produto público/Regulatory Gate — #50;
- cobertura ampla de providers produtivos/licenciados de preço/fundamentals.

Também permanecem fora do escopo atual execução automática de ordens, custódia, day trade, derivativos, alavancagem, copy trading, recomendação patrocinada e promessa de retorno.

## Arquitetura

O projeto é um **monólito modular TypeScript**.

```text
apps/web
  ├─ application/server boundary
  ├─ Auth.js
  ├─ UI + AppShell/design system
  └─ integra domain/persistence/shared

packages/domain
  └─ fatos, value objects, ledger, portfolio, onboarding e aporte

packages/persistence
  └─ PostgreSQL/Drizzle, migrations, ownership e repositories

packages/market-data
  └─ providers, snapshots, provenance, freshness e cache

packages/investment-engine
  └─ scoring, valuation, Portfolio Fit, ranking e thesis lifecycle

packages/shared
  └─ contratos compartilhados + secure AI ingestion
```

Regras de fronteira:

- UI não contém fórmula financeira material;
- domínio não depende de framework web/SDK de fornecedor;
- engines não buscam dados remotos dentro do cálculo puro;
- ORM/conexão não são API do domínio;
- conteúdo de LLM/fonte externa não vira fato financeiro canônico sozinho.

Detalhes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Fontes de verdade

### Posição

```text
Transaction Ledger
  -> projection
  -> Positions
```

Não persistir `Holding` como fonte concorrente.

### Aporte

```text
Portfolio context
+ TargetAllocation
+ contribution
+ policy
+ concentration
+ execution constraints
+ known costs
  -> deterministic contribution pipeline
  -> RecommendationSnapshot
```

### Dados externos

```text
Provider
  -> adapter/validation
  -> normalized snapshot
     source + asOf + retrievedAt + quality
  -> engine/application
```

### Análise

```text
Evidence + methodology version
  -> Quality / Opportunity / Dividend
  -> Portfolio Fit
  -> explainable ranking
```

## Segurança e privacidade

- identidade e autorização são validadas server-side;
- owner de dado privado é derivado da sessão, nunca escolhido livremente pelo cliente;
- produção pessoal usa allowlist GitHub fail-closed;
- `.env.local` e segredos não são versionados;
- logs não devem carregar dados financeiros pessoais desnecessários;
- redirects/callbacks são limitados a destinos aceitos;
- supply chain usa políticas do pnpm 11 e lifecycle scripts explicitamente controlados;
- conteúdo externo para IA permanece sem autoridade de instrução.

Leia [`docs/SECURITY.md`](docs/SECURITY.md).

## IA

### Pode

- explicar resultados determinísticos;
- resumir conteúdo admitido;
- contextualizar tese/eventos;
- transformar reason codes em linguagem natural;
- apontar fontes, timestamps e limitações.

### Não pode

- alterar regra financeira;
- recalcular número crítico como fonte de verdade;
- transformar notícia/documento em fato validado automaticamente;
- ignorar missing/stale/conflict;
- executar ordem financeira;
- esconder provenance material.

Leia [`docs/AI-CONTENT-INGESTION.md`](docs/AI-CONTENT-INGESTION.md).

## UX/UI

A iniciativa #69 usa o **Protótipo 3 — Assistant-First Workspace** como direção canônica.

Estado reconciliado em 2026-09-02 após o fechamento formal do R8 no PR #111:

```text
R0 audit ✓           #72
R1 app spec ✓        #73
R2 design system ✓   #74
R3 AppShell ✓        #75
R4 focused auth ✓    #76
R5 onboarding ✓      #77 / PR #88
R6 dashboard ✓       #78 / PR #91
R7 carteira ✓        #79 / PR #92
R8 estados ✓         #80 / PRs #95, #105–#111
R9 a11y/responsive/fidelity #81  <- prioridade atual
R10 gate final       #69
```

Contratos atuais:

- semantic tokens em `apps/web/src/styles/tokens.css`;
- primitives em `apps/web/src/components/ui/`;
- AppShell único para superfícies protegidas;
- focused auth fora do shell;
- onboarding guiado no shell;
- Dashboard R6 em `docs/design/DASHBOARD.md`;
- Carteira R7 em `docs/design/PORTFOLIO.md`;
- estados transversais R8 consolidados em primitives/presentations canônicas;
- nenhuma rota, métrica ou UI de Copiloto fictícia para copiar mockup.

Leia [`docs/UX-UI-REDESIGN-ROADMAP.md`](docs/UX-UI-REDESIGN-ROADMAP.md).

## Rotas atuais

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | público | redireciona para `/dashboard` |
| `/sign-in` | público | GitHub OAuth |
| `/sign-out` | autenticado/contextual | saída da sessão |
| `/dashboard` | autenticado | contexto financeiro, panorama e próxima ação |
| `/onboarding` | autenticado | perfil financeiro e objetivos |
| `/portfolio` | autenticado | workspace por tarefas para Portfolio, Assets, ledger, posições, transações e aporte |
| `/health` | público | surface humana de health operacional |
| `/api/health/live` | público | liveness canônico sem dependência do banco |
| `/api/health/ready` | público | readiness canônico com verificação PostgreSQL |
| `/api/auth/[...nextauth]` | API | Auth.js |
| `/api/financial-profile` | autenticado | perfil financeiro server-side/migração |

## Stack

- Node.js 24 (`>=24 <25`);
- pnpm `11.24.0`;
- Next.js `16.3.3`;
- React `19.2.7`;
- TypeScript `6.0.3` strict;
- Auth.js v5 / `next-auth@5.0.0-beta.32`;
- PostgreSQL `18.6-alpine` no baseline local/CI;
- Neon PostgreSQL 18 na produção pessoal;
- Drizzle ORM + `node-postgres`;
- ESLint `9.39.5`;
- Prettier `3.9.6`;
- Vitest `4.1.11`;
- Docker Compose;
- GitHub Actions;
- Vercel para a aplicação em produção pessoal.

## Desenvolvimento local

O fluxo canônico para instalar, subir, migrar, testar e validar antes do PR está em [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

Resumo:

```bash
nvm use
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
pnpm dev
```

Antes do PR:

```bash
pnpm check
```

`pnpm check` é a interface única para `format:check`, lint, typecheck, testes e build. Migration permanece explícita porque depende do estado do banco.

## Produção

O procedimento canônico de produção está em [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

Resumo para produção git-managed:

```text
pnpm prod:check
-> pnpm prod:migrate        # quando aplicável
-> merge em main
-> Vercel cria o deployment
-> pnpm prod:verify
```

Não existe `prod:deploy` local neste projeto.

## Quality gate e CI

O CI prepara o banco com `pnpm db:migrate` e então executa o mesmo gate usado localmente:

```bash
pnpm check
```

Isso evita manter duas listas diferentes de lint/typecheck/test/build entre scripts, CI e documentação.

Um PR só fica elegível para merge quando o **head final** passa o gate e o auto code review sênior independente está encerrado sem finding aberto.

## Fluxo de contribuição

```text
issue + NEXT.md
  -> branch
  -> implementação + testes
  -> validação local
  -> pnpm check
  -> docs/issues
  -> PR
  -> CI do head atual
  -> auto code review sênior completo
  -> findings corrigidos
  -> CI final
  -> diff final
  -> merge
  -> produção conforme docs/PRODUCTION.md
```

Leia [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

### Agentes de IA

Qualquer agente de IA que desenvolva neste repositório deve seguir [`AGENTS.md`](AGENTS.md).

Esse contrato exige padrão **fullstack sênior**, incluindo:

- entendimento de arquitetura/domínio antes de editar;
- menor vertical coerente;
- testes/edge cases/regressions;
- revisão explícita de segurança, finanças, acessibilidade e supply chain quando aplicável;
- CI no SHA final;
- **auto code review completo e independente do CI sobre o diff integral**;
- correção de todos os findings antes do merge;
- reconciliação de docs/issues e handoff pós-merge.

## Roadmap

O estado estratégico está em [`docs/ROADMAP.md`](docs/ROADMAP.md) e a única prioridade operacional em [`docs/tasks/NEXT.md`](docs/tasks/NEXT.md).

Backlog macro aberto: [`docs/tasks/BACKLOG.md`](docs/tasks/BACKLOG.md).

## Documentação

O índice canônico de ownership/precedência é [`docs/DOCUMENTATION-MAP.md`](docs/DOCUMENTATION-MAP.md).

Principais entradas:

### Engenharia

- [Contrato para agentes de IA](AGENTS.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Desenvolvimento](docs/DEVELOPMENT.md)
- [Produção](docs/PRODUCTION.md)
- [Segurança](docs/SECURITY.md)
- [Decisões](docs/DECISIONS.md)
- [ADRs](docs/adr)

### Produto e metodologia

- [Project Brief](docs/PROJECT-BRIEF.md)
- [Catálogo de funcionalidades](docs/product/FEATURE-CATALOG.md)
- [Metodologia financeira](docs/FINANCIAL-METHODOLOGY.md)
- [Investment Engine](docs/INVESTMENT-ENGINE-METHODOLOGY.md)
- [Lifecycle de teses](docs/INVESTMENT-THESIS-LIFECYCLE.md)
- [Fontes de dados](docs/DATA-SOURCES.md)
- [Regulatório](docs/REGULATORY.md)

### IA

- [Ingestão segura](docs/AI-CONTENT-INGESTION.md)

### UX/UI

- [Roadmap do redesign](docs/UX-UI-REDESIGN-ROADMAP.md)
- [Direção Protótipo 3](docs/design/PROTOTYPE-3-DIRECTION.md)
- [R1 Assistant-First App](docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md)
- [Design System](docs/design/DESIGN-SYSTEM.md)
- [AppShell](docs/design/APP-SHELL.md)
- [Auth/Session](docs/design/AUTH-SESSION.md)
- [Onboarding](docs/design/ONBOARDING.md)
- [Dashboard](docs/design/DASHBOARD.md)
- [Carteira](docs/design/PORTFOLIO.md)
- [Frontend Audit R0](docs/design/FRONTEND-AUDIT.md)

### Tarefas

- [NEXT](docs/tasks/NEXT.md)
- [Backlog](docs/tasks/BACKLOG.md)
- [Done](docs/tasks/DONE.md)

## Aviso

As metodologias, modelos e interfaces deste repositório são parte de um produto em desenvolvimento. Informações e cálculos devem ser avaliados dentro de suas fontes, datas, metodologia e limitações. Nada aqui representa promessa de retorno financeiro.