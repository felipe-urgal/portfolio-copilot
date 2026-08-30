# Portfolio Copilot

Copiloto inteligente de investimentos para organizar patrimônio, estruturar aportes e tornar decisões financeiras **explicáveis, auditáveis e disciplinadas**.

> **Estado atual:** o repositório já possui domínio financeiro, ledger, pipeline determinístico de aporte, persistência PostgreSQL, autenticação, Market Data, Investment Engine, teses versionadas e ingestão segura de conteúdo externo. A experiência web existe, mas está passando por um redesign completo baseado no **Protótipo 3 — Assistant-First Workspace** antes da expansão das novas superfícies visuais.

![Direção visual canônica — Protótipo 3](docs/design/prototypes/prototype-3-assistant-first-dashboard.jpg)

## Sumário

- [Visão do produto](#visão-do-produto)
- [Problema que o projeto resolve](#problema-que-o-projeto-resolve)
- [Princípios](#princípios)
- [O que já existe hoje](#o-que-já-existe-hoje)
- [O que ainda não existe](#o-que-ainda-não-existe)
- [Arquitetura](#arquitetura)
- [Pacotes do monorepo](#pacotes-do-monorepo)
- [Fluxo de dados e fontes de verdade](#fluxo-de-dados-e-fontes-de-verdade)
- [Segurança e privacidade](#segurança-e-privacidade)
- [IA e conteúdo externo](#ia-e-conteúdo-externo)
- [UX/UI e design system](#uxui-e-design-system)
- [Rotas atuais](#rotas-atuais)
- [Stack](#stack)
- [Desenvolvimento local](#desenvolvimento-local)
- [Banco de dados](#banco-de-dados)
- [Autenticação local](#autenticação-local)
- [Comandos úteis](#comandos-úteis)
- [Quality gate e CI](#quality-gate-e-ci)
- [Fluxo de contribuição](#fluxo-de-contribuição)
- [Roadmap](#roadmap)
- [Documentação](#documentação)
- [Fronteiras do produto](#fronteiras-do-produto)

---

## Visão do produto

O Portfolio Copilot é um **sistema de apoio à decisão financeira**. Ele não nasce como corretora, robô de trade ou mecanismo de execução automática.

A proposta é reunir, em uma mesma arquitetura:

1. contexto financeiro declarado pelo usuário;
2. fatos imutáveis da carteira;
3. dados externos com provenance e freshness;
4. motores determinísticos de cálculo e ranking;
5. teses e eventos auditáveis;
6. IA assistiva para explicar, resumir e contextualizar — nunca para substituir as regras financeiras.

A pergunta central do produto é:

> **Tenho R$ X para investir hoje. Considerando minha carteira, objetivos, risco, alocação, qualidade dos ativos e cenário, onde faz mais sentido aportar — e por quê?**

O objetivo não é responder com uma recomendação opaca. A resposta precisa ser reconstruível: quais dados foram usados, quais regras bloquearam alternativas, qual metodologia estava ativa e por que determinado destino recebeu ou não recebeu capital.

---

## Problema que o projeto resolve

Investir de forma consistente exige combinar informações que normalmente estão separadas:

- perfil, objetivos e horizonte;
- reserva e liquidez;
- carteira e transações;
- alocação desejada vs. atual;
- concentração e restrições;
- custo e impacto tributário conhecido;
- qualidade, oportunidade e aderência do ativo à carteira;
- dados de mercado e fundamentos;
- tese, eventos e critérios de invalidação;
- disponibilidade de caixa para o próximo aporte.

O Portfolio Copilot organiza esse problema em camadas. O domínio mantém os fatos; engines aplicam metodologia determinística; dados externos chegam em snapshots; e a IA trabalha apenas sobre contexto autorizado e estruturado.

---

## Princípios

- segurança, liquidez e reserva antes de retorno;
- diversificação por fatores de risco, não por quantidade de tickers;
- `Transaction Ledger` como fonte dos fatos de posição;
- motor financeiro determinístico, versionado e testável;
- IA auxilia análise e explicação, mas não controla regra financeira;
- conteúdo externo é dado não confiável, nunca instrução para o sistema;
- empresa boa não significa ativo barato;
- Quality, Opportunity e Portfolio Fit são conceitos separados;
- regras de risco têm precedência sobre ranking;
- rebalanceamento preferencialmente por novos aportes;
- recomendações e teses materiais preservam histórico e versão;
- todo dado material deve carregar provenance e referência temporal quando aplicável;
- falha de fonte crítica degrada para `dados insuficientes`, não para valor inventado;
- nenhuma promessa de retorno;
- nenhuma execução automática de ordens no MVP.

---

## O que já existe hoje

### Aplicação web

O app Next.js já possui:

- autenticação com GitHub OAuth;
- sessão protegida server-side;
- onboarding financeiro;
- snapshot de perfil financeiro;
- migração opt-in do perfil local para a conta;
- dashboard atual;
- carteira local/persistida;
- cadastro de ativos locais;
- registro de transações de caixa e ativos;
- projeção de posições a partir do ledger;
- fluxo de aporte com baseline, política, concentração, custos, recomendação e conclusão;
- rota pública de health.

A interface atual continua funcional, mas está em processo de substituição visual pela iniciativa #69.

### Domínio financeiro

`packages/domain` implementa, entre outros:

- `Money`, percentuais, pesos e quantidades com precisão explícita;
- identidade canônica de ativos;
- classes e tipos de instrumentos;
- `Portfolio` e `PortfolioId`;
- `Transaction Ledger` imutável;
- projeção de posições;
- `TargetAllocation`;
- cálculo de allocation gaps;
- `ContributionAllocator`;
- política de aporte;
- restrições de execução;
- limites de concentração por classe;
- custos e impacto tributário conhecido;
- pipeline determinístico de recomendação de aporte;
- onboarding financeiro e objetivos.

### Persistência

`packages/persistence` já possui:

- PostgreSQL;
- Drizzle ORM;
- migrations versionadas;
- ownership privado derivado da sessão;
- chaves/FKs compostas para reforçar isolamento por owner;
- repositories server-side;
- testes de integração contra PostgreSQL real.

### Market Data

`packages/market-data` implementa a fundação de dados externos:

- contracts de providers;
- snapshots normalizados;
- provenance;
- `asOf`/`retrievedAt`;
- freshness;
- cache;
- política de fallback explícita;
- provider de macro oficial via BCB SGS;
- testes de contrato e hardening.

### Investment Engine

`packages/investment-engine` implementa:

- metodologias versionadas;
- evidências analíticas;
- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation snapshots;
- Portfolio Fit;
- ranking explicável;
- validação de contexto e look-ahead;
- separação de componentes antes do ranking final;
- teses de investimento imutáveis e versionadas;
- drivers, riscos e critérios de invalidação;
- eventos e reviews de tese;
- timeline auditável;
- estados `CURRENT`, `STALE` e `INVALIDATED`.

### Ingestão segura para IA

`packages/shared/src/ai-ingestion` implementa a fronteira de conteúdo externo:

- source allowlist;
- normalização;
- classificação;
- deduplicação;
- auditoria;
- política de retenção/autoridade;
- tratamento de conteúdo externo como `UNTRUSTED_EXTERNAL_CONTENT`;
- quarentena de payload suspeito de prompt injection;
- testes adversariais.

Isso **não significa que um chat de IA esteja pronto no produto**. Essa fundação existe para que a futura assistência não trate notícia, documento ou resultado como instrução de sistema ou fato sem validação.

---

## O que ainda não existe

É importante separar o que já existe no domínio do que está disponível como experiência final de produto.

Ainda não fazem parte do produto concluído:

- execução automática de ordens em corretora;
- Open Finance/broker sync automático;
- recomendação patrocinada;
- day trade, derivativos ou alavancagem;
- UI final do Copiloto de IA;
- ingestão produtiva irrestrita de notícias/documentos;
- cobertura completa de preços/fundamentos por providers de produção;
- dashboard final do Protótipo 3;
- design system canônico já implementado;
- visual QA completo mobile do app redesenhado;
- produto público com Regulatory Gate concluído.

Também não se deve inferir que um package existente esteja automaticamente conectado a todas as telas. A integração visual está sendo feita progressivamente.

---

## Arquitetura

A arquitetura é um **monólito modular TypeScript**. A prioridade é manter fronteiras claras e contratos testáveis antes de considerar microserviços.

```text
┌──────────────────────────────────────────────────────────────┐
│ apps/web                                                     │
│ Next.js UI + application boundary + Auth.js                 │
└───────────────────────┬──────────────────────────────────────┘
                        │
          ┌─────────────┼────────────────┐
          │             │                │
          ▼             ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐
│ packages/domain│ │ investment-    │ │ packages/market-data   │
│                │ │ engine         │ │                        │
│ fatos, regras, │ │ score, fit,    │ │ providers, snapshots, │
│ ledger, aporte │ │ valuation,     │ │ freshness, provenance │
│ e invariantes  │ │ thesis         │ │                        │
└───────┬────────┘ └────────────────┘ └────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ packages/persistence   │
│ PostgreSQL + Drizzle   │
│ ownership + repos      │
└────────────────────────┘

┌────────────────────────┐
│ packages/shared        │
│ contratos compartilhados
│ + secure AI ingestion │
└────────────────────────┘
```

### Camadas conceituais

**UI** — interação e apresentação. Não contém fórmula financeira material.

**Application** — autorização, orquestração e transações entre módulos.

**Domain** — entidades, value objects, invariantes e políticas sem dependência de framework web.

**Engines** — cálculo financeiro determinístico, metodologia e snapshots.

**Infrastructure** — banco, cache, providers, adapters e futuras integrações externas.

---

## Pacotes do monorepo

| Caminho | Responsabilidade principal |
| --- | --- |
| `apps/web` | aplicação Next.js, rotas, UI, autenticação e boundary server-side |
| `packages/domain` | domínio financeiro, ledger, portfolio, onboarding e pipeline de aporte |
| `packages/investment-engine` | scoring, valuation, Portfolio Fit, ranking e teses |
| `packages/market-data` | providers, snapshots, provenance, freshness e cache |
| `packages/persistence` | PostgreSQL, Drizzle, schema, migrations e repositories |
| `packages/shared` | contratos compartilhados e ingestão segura para IA |
| `docs` | produto, arquitetura, ADRs, segurança, metodologia, roadmap e design |

A fronteira é deliberada: domínio não importa SDK de fornecedor; engines não devem buscar dados externos durante cálculo puro; UI não redefine regras financeiras.

---

## Fluxo de dados e fontes de verdade

### Carteira

```text
Transaction Ledger
    ↓
projeção determinística
    ↓
Positions
    ↓
Allocation State
    ↓
Gap / Contribution Pipeline
    ↓
Recommendation Snapshot
```

`Holding` persistida não deve virar uma segunda fonte de verdade para posição atual. A posição é reconstruída a partir dos fatos do ledger.

### Dados externos

```text
Provider
   ↓
Adapter / contract validation
   ↓
Normalized snapshot
   ├─ source
   ├─ asOf
   ├─ retrievedAt
   ├─ quality/freshness
   └─ payload normalizado
   ↓
Engine / application use
```

### Investment Engine

```text
Evidence + methodology version
   ↓
Quality / Opportunity / Dividend
   ↓
Portfolio Fit
   ↓
Explainable ranking
```

Quality não é preço. Opportunity não é qualidade. Portfolio Fit não sobrescreve os outros componentes.

### Teses

Cada mudança material cria nova versão ou review auditável. Histórico relevante não é sobrescrito.

---

## Segurança e privacidade

Segurança é requisito estrutural do produto financeiro.

### Identidade e sessão

- Auth.js v5 com GitHub OAuth;
- sessão validada server-side;
- rotas privadas exigem identidade autenticada;
- IDs do provider não substituem IDs financeiros canônicos;
- login/logout não migram ou apagam automaticamente perfil financeiro local.

### Ownership

Dados privados server-side são sempre acessados com ownership derivado da sessão. O cliente não escolhe livremente o owner de uma operação.

### Segredos

- `.env.local` nunca deve ser versionado;
- credenciais OAuth e `DATABASE_URL` são server-side;
- logs não devem carregar informação financeira pessoal desnecessária;
- produção deve usar conexão PostgreSQL com TLS conforme o provider.

### Supply chain

O workspace usa proteções do pnpm 11 para reduzir risco de dependências recém-publicadas e restringe lifecycle scripts a pacotes explicitamente revisados em `pnpm-workspace.yaml`.

Leia também: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## IA e conteúdo externo

A IA é assistiva e fica **abaixo das regras determinísticas**.

### Regra central

> Texto externo nunca redefine system rules, metodologia financeira ou autoridade do domínio.

Conteúdo de notícias, documentos e resultados entra com autoridade de instrução `NONE` e deve passar por source policy, normalização, detecção de payload suspeito, classificação e auditoria.

### O LLM pode

- resumir conteúdo já admitido;
- explicar números calculados pelo domínio;
- transformar reason codes em linguagem natural;
- contextualizar eventos e teses;
- apontar fontes e timestamps;
- ajudar o usuário a navegar e entender decisões.

### O LLM não pode

- recalcular números críticos como fonte de verdade;
- alterar position/score/risk rule;
- transformar texto externo em fato validado automaticamente;
- executar ordem financeira;
- ignorar dado stale/missing;
- esconder a origem de uma afirmação material.

Referência: [`docs/AI-CONTENT-INGESTION.md`](docs/AI-CONTENT-INGESTION.md).

---

## UX/UI e design system

O frontend está em uma iniciativa de redesign completo: **#69 — UX/UI: redesign completo do app com base no Protótipo 3**.

### Direção aprovada

A referência canônica é o **Protótipo 3 — Assistant-First Workspace**.

Elementos que definem a direção:

- sidebar persistente no desktop;
- hierarchy limpa;
- conteúdo financeiro como região principal;
- KPIs compactos quando existirem dados reais;
- panorama da carteira dominante;
- Copiloto como context rail, não como chat que engole o produto;
- teses/eventos/próximos passos em segunda ordem;
- base clara/neutra;
- indigo/violeta como accent controlado;
- cards somente para unidades reais de informação;
- desktop e mobile como estados da mesma solução.

### Estado do redesign

- R0 — audit completo: concluído em #72;
- R1 — arquitetura da informação e expansão da direção: definida em [`docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`](docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md);
- R2 — design tokens e primitives: próxima fase (#74);
- R3 — AppShell/sidebar/responsive navigation: #75;
- R4–R8 — migração progressiva de auth, onboarding, dashboard, carteira e estados;
- R9 — accessibility, responsive e visual fidelity QA;
- R10 — gate final da iniciativa.

A interface antiga continua funcional durante a transição, mas **não é referência visual para novas superfícies**.

---

## Rotas atuais

| Rota | Acesso | Função atual |
| --- | --- | --- |
| `/` | público | redireciona para `/dashboard` |
| `/sign-in` | público | entrada via GitHub OAuth |
| `/sign-out` | autenticado/contextual | saída da sessão |
| `/dashboard` | autenticado | visão geral atual do produto |
| `/onboarding` | autenticado | perfil financeiro e objetivos |
| `/portfolio` | autenticado | carteira, ativos, ledger e aporte |
| `/health` | público | health operacional |
| `/api/auth/[...nextauth]` | API | Auth.js |
| `/api/financial-profile` | autenticado | persistência server-side do perfil financeiro |

A navegação futura seguirá a taxonomia do R1, mas **rotas vazias não serão criadas apenas para reproduzir o protótipo**.

---

## Stack

- Node.js 24 (`>=24 <25`);
- pnpm `11.24.0`;
- Next.js `16.3.3`;
- React `19.2.7`;
- TypeScript `6.0.3` strict;
- Auth.js v5 / `next-auth@5.0.0-beta.32`;
- PostgreSQL `18.6-alpine` no Docker local;
- Drizzle ORM + `node-postgres`;
- ESLint `9.39.5`;
- Prettier `3.9.6`;
- Vitest `4.1.11`;
- Docker Compose;
- GitHub Actions.

A stack é mantida propositalmente pequena. Providers adicionais, LLM provider e infraestrutura de deploy entram quando houver necessidade concreta e contrato definido.

---

## Desenvolvimento local

### Pré-requisitos

- Git;
- Node.js 24;
- Corepack;
- Docker + Docker Compose;
- uma GitHub OAuth App local para testar autenticação.

### Instalação

```bash
nvm use
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
```

### Configuração

Crie o arquivo local de ambiente:

```bash
cp .env.example .env.local
```

O catálogo atual de variáveis é:

```env
AUTH_SECRET="replace-with-a-random-secret"
AUTH_GITHUB_ID="replace-with-github-oauth-client-id"
AUTH_GITHUB_SECRET="replace-with-github-oauth-client-secret"
DATABASE_URL="postgresql://portfolio:portfolio@localhost:5433/portfolio_copilot"
```

Nunca commit valores reais.

### Executar o app

Depois de banco + migrations + OAuth configurados:

```bash
pnpm dev
```

A aplicação roda em:

```text
http://localhost:5300
```

Health:

```text
http://localhost:5300/health
```

---

## Banco de dados

O Docker Compose local usa PostgreSQL `18.6-alpine` e publica somente em `127.0.0.1:5433` para evitar conflito com instalações em `5432`.

### Subir

```bash
pnpm db:up
```

### Migrar

```bash
pnpm db:migrate
```

### Gerar migration

```bash
pnpm db:generate
```

### Encerrar

```bash
pnpm db:down
```

O volume `portfolio_copilot_postgres` preserva dados entre reinicializações do serviço.

Os comandos de migration priorizam `DATABASE_URL` já exportado no processo e, na ausência dele, usam a configuração local prevista pelo package de persistência.

---

## Autenticação local

Crie uma GitHub OAuth App com callback:

```text
http://localhost:5300/api/auth/callback/github
```

Configure:

```env
AUTH_SECRET=<segredo forte e aleatório>
AUTH_GITHUB_ID=<client id>
AUTH_GITHUB_SECRET=<client secret>
```

O login estabelece identidade/sessão. Ele **não associa automaticamente** um perfil financeiro local à conta.

Quando houver perfil local elegível, a migração para persistência server-side é opt-in, revalidada pelo domínio e preserva o snapshot local conforme as regras documentadas.

---

## Comandos úteis

```bash
# app
pnpm dev

# banco
pnpm db:up
pnpm db:down
pnpm db:generate
pnpm db:migrate

# qualidade
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

`pnpm check` executa o quality gate local completo em sequência.

---

## Quality gate e CI

O quality gate padrão executa:

1. format check;
2. lint;
3. typecheck;
4. testes;
5. build.

O GitHub Actions também:

- inicializa PostgreSQL isolado;
- valida o Docker Compose local;
- aplica migrations;
- verifica fallback de configuração do banco;
- executa testes de integração com banco real.

Um PR não é considerado pronto apenas porque compilou. O fluxo do projeto inclui também **auto code review independente** para procurar invariantes, regressões de segurança, look-ahead, perda de provenance, ownership incorreto e gaps de teste.

---

## Fluxo de contribuição

O fluxo canônico é:

```text
NEXT.md
  -> issue canônica
  -> branch
  -> implementação/documentação
  -> testes
  -> PR
  -> CI
  -> auto code review
  -> correção dos findings
  -> documentação final
  -> CI verde
  -> merge
```

Regras importantes:

- não misturar mudanças de domínio não relacionadas;
- PR visual precisa seguir a direção UX/UI canônica;
- PR financeiro material precisa de testes de invariantes;
- mudanças arquiteturais relevantes devem atualizar ADR/decisões;
- não apagar histórico para “simplificar” versões de tese ou decisões;
- não mergear com CI falhando ou finding conhecido em aberto;
- qualquer dado fictício usado em teste/mock precisa ser inequivocamente não produtivo.

Leia [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) antes de mudanças maiores.

---

## Roadmap

O roadmap funcional segue redução de risco:

```text
Fundação/governança
  -> Portfolio Engine
  -> MVP web
  -> Market Data
  -> Investment Engine
  -> Teses/eventos
  -> IA assistiva
  -> Simulação/backtesting
  -> Integrações financeiras
  -> produto público após Regulatory Gate
```

Em paralelo, existe a intervenção estratégica de UX/UI:

```text
R0 audit ✓
  -> R1 arquitetura Assistant-First ✓
  -> R2 design tokens/primitives
  -> R3 AppShell/sidebar
  -> R4 auth
  -> R5 onboarding
  -> R6 dashboard
  -> R7 carteira
  -> R8 estados transversais
  -> R9 a11y/responsive/fidelity QA
  -> R10 gate final
```

O próximo item canônico sempre deve estar refletido em [`docs/tasks/NEXT.md`](docs/tasks/NEXT.md).

Roadmap completo: [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Documentação

### Produto e estratégia

- [Project Brief](docs/PROJECT-BRIEF.md)
- [Visão](docs/VISION.md)
- [Produto](docs/PRODUCT.md)
- [Catálogo de funcionalidades](docs/product/FEATURE-CATALOG.md)
- [Política de investimentos](docs/portfolio/INVESTMENT-POLICY.md)
- [Roadmap](docs/ROADMAP.md)

### Engenharia

- [Arquitetura](docs/ARCHITECTURE.md)
- [Desenvolvimento](docs/DEVELOPMENT.md)
- [Segurança](docs/SECURITY.md)
- [Fontes de dados](docs/DATA-SOURCES.md)
- [Decisões](docs/DECISIONS.md)
- [ADRs](docs/adr)

### Metodologia financeira

- [Metodologia financeira](docs/FINANCIAL-METHODOLOGY.md)
- [Investment Engine](docs/INVESTMENT-ENGINE-METHODOLOGY.md)
- [Lifecycle de teses](docs/INVESTMENT-THESIS-LIFECYCLE.md)

### IA

- [Ingestão segura de conteúdo externo](docs/AI-CONTENT-INGESTION.md)

### UX/UI

- [Roadmap do redesign](docs/UX-UI-REDESIGN-ROADMAP.md)
- [Frontend audit R0](docs/design/FRONTEND-AUDIT.md)
- [Direção visual — Protótipo 3](docs/design/PROTOTYPE-3-DIRECTION.md)
- [Especificação R1 — Assistant-First App](docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md)

### Tarefas

- [Próxima atividade](docs/tasks/NEXT.md)
- [Backlog](docs/tasks/BACKLOG.md)
- [Histórico concluído](docs/tasks/DONE.md)

---

## Fronteiras do produto

O Portfolio Copilot é um projeto de engenharia e pesquisa financeira. O repositório não deve ser interpretado como promessa de rentabilidade nem como autorização automática para oferta pública de consultoria.

Antes de produto público, integrações financeiras amplas ou mudança da fronteira de recomendação, o projeto exige revisão específica de segurança, privacidade, LGPD e regulatório.

### Explicitamente fora do MVP atual

- execução automática de ordens;
- day trade;
- derivativos;
- alavancagem;
- copy trading;
- recomendação patrocinada;
- qualquer mecanismo que permita a um LLM ignorar regras determinísticas ou transformar conteúdo externo em autoridade do sistema.

---

## Aviso

As metodologias, modelos e interfaces deste repositório são parte de um produto em desenvolvimento. Informações e cálculos devem ser avaliados dentro de suas fontes, datas, metodologia e limitações; nada aqui representa promessa de retorno financeiro.
