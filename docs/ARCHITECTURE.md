# Arquitetura

## Status

Este documento descreve a **arquitetura implementada atualmente** no repositório e as fronteiras que novas features devem preservar.

A decisão principal continua sendo um **monólito modular TypeScript** com fronteiras explícitas. Microserviços só devem ser considerados mediante necessidade comprovada de escala, isolamento operacional ou ownership independente.

## Estrutura atual

```text
portfolio-copilot/
├── apps/
│   └── web/
├── packages/
│   ├── domain/
│   ├── investment-engine/
│   ├── market-data/
│   ├── persistence/
│   └── shared/
├── docs/
├── compose.yaml
└── pnpm-workspace.yaml
```

Não existe um package separado `portfolio-engine`: as regras determinísticas de portfolio, ledger, alocação e aporte vivem em `packages/domain`. Persistência é uma fronteira própria em `packages/persistence`.

Nem todo package precisa estar diretamente conectado à UI. A existência de uma capability no domínio/engine não implica que ela já possua uma superfície web final.

## Visão de dependências

As dependências workspace atuais preservam a direção de fluxo:

```text
                    ┌──────────────────────┐
                    │       apps/web       │
                    │ Next.js + Auth.js    │
                    └───────┬──────────────┘
                            │
                 ┌──────────┼──────────┐
                 │          │          │
                 ▼          ▼          ▼
          packages/domain  persistence shared
                 ▲          │
                 │          └─ depende de domain
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
 market-data      investment-engine
        │                  │
        └─ depende domain  ├─ depende domain
                           └─ depende market-data
```

Em `apps/web`, as dependências workspace diretas atuais são `domain`, `persistence` e `shared`. `market-data` e `investment-engine` existem como capacidades de engine, mas sua exposição à experiência web deve acontecer por contratos de aplicação — não por acoplamento visual oportunista.

## Camadas

### UI

Responsável por interação e apresentação.

Regras:

- não contém fórmula financeira material;
- não redefine invariantes do domínio;
- não trata output de LLM como fonte de verdade;
- não inventa métricas para preencher layout;
- deve consumir estados e reason codes de forma semântica.

A arquitetura visual canônica está em:

- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`.

### Application boundary

No estado atual, parte da orquestração de aplicação vive na fronteira server-side de `apps/web`:

- autenticação e autorização;
- resolução da identidade autenticada;
- chamadas de persistence repositories;
- API routes/server actions;
- coordenação entre input da UI e contratos do domínio.

À medida que casos de uso compartilhados crescerem, eles podem ganhar uma camada/pacote dedicado, mas não se deve criar abstração apenas para reproduzir arquitetura teórica.

### Domain — `packages/domain`

Contém entidades, value objects, invariantes e políticas financeiras independentes de framework web e fornecedor externo.

Responsabilidades atuais incluem:

- `Money`, percentuais, pesos e quantidades com precisão explícita;
- `AssetId`, catálogo e matching de ativos;
- `Portfolio` e configuração;
- Transaction Ledger imutável;
- projeção de posições;
- `TargetAllocation`;
- allocation gaps;
- `ContributionAllocator`;
- política de aporte;
- restrições de execução;
- concentração;
- custos/impacto tributário conhecido;
- pipeline canônico de recomendação de aporte;
- perfil financeiro, reserva e objetivos do onboarding.

### Investment Engine — `packages/investment-engine`

Depende de `domain` e `market-data`.

Responsabilidades:

- evidências analíticas;
- metodologias versionadas;
- Quality Score;
- Opportunity Score;
- Dividend Score;
- valuation snapshots;
- Portfolio Fit;
- ranking explicável;
- validação de missing/stale/conflict/look-ahead;
- teses de investimento versionadas;
- drivers, riscos e critérios de invalidação;
- eventos/reviews;
- timeline e lifecycle de tese.

O engine recebe contexto estruturado. Ele não busca dados remotos dentro de cálculo puro.

### Market Data — `packages/market-data`

Depende de `domain` para identidades e tipos canônicos.

Responsabilidades:

- contracts de providers;
- adapters;
- snapshots normalizados;
- provenance;
- `asOf`/`retrievedAt`;
- freshness;
- cache;
- fallback apenas quando explicitamente autorizado;
- providers concretos já admitidos, como macro oficial via BCB SGS;
- testes de contrato/hardening.

### Persistence — `packages/persistence`

Depende de `domain` e encapsula PostgreSQL/Drizzle.

Responsabilidades:

- schema;
- migrations;
- repositories;
- conexão server-side;
- ownership de dados privados;
- constraints/FKs compostas;
- testes de integração contra PostgreSQL real.

ORM e conexão bruta pertencem à infraestrutura. Eles não são API do domínio.

### Shared — `packages/shared`

Mantém contratos/utilitários compartilhados que não pertencem a uma feature financeira específica.

Atualmente também contém a fronteira de ingestão segura para conteúdo externo destinado à futura assistência por IA:

- allowlist de fontes;
- normalização;
- classificação;
- deduplicação;
- auditoria;
- autoridade de instrução `NONE` para conteúdo externo;
- quarentena de prompt injection suspeito.

## Módulos conceituais

Os packages acima implementam capacidades que podem ser entendidas pelos seguintes domínios conceituais:

### identity

User, sessão, autenticação e autorização. Implementação web atual usa Auth.js v5 com GitHub OAuth e identidade canônica separada de IDs financeiros.

### profile

Objetivos, horizonte, liquidez, reserva, tolerância a risco e restrições declaradas. Perfil não é saldo nem posição de carteira.

### assets

Identidade canônica, classes, instrumentos, listings/identificadores externos e matching explícito.

### portfolio

Identidade/configuração da carteira. `Portfolio` não persiste posição atual como fonte de verdade.

### ledger / position

Transaction Ledger registra fatos imutáveis. Posições abertas são projeções determinísticas desses fatos.

### allocation / contribution

TargetAllocation, gaps, aporte, política, concentração, custos, restrições e recommendation snapshot determinístico.

### market-data

Dados externos entram em snapshots com provenance e referência temporal antes de chegar aos engines.

### investment-analysis

Quality, Opportunity, Dividend, valuation, Portfolio Fit e ranking permanecem componentes separados antes da composição final.

### thesis

InvestmentThesis, drivers, riscos, critérios de invalidação, eventos, reviews, versões e timeline auditável.

### ai-ingestion

Conteúdo externo é dado não confiável, nunca instrução de sistema. Admissão, dedupe, classificação e auditoria antecedem qualquer uso por um LLM.

### audit

Snapshots, reason codes, versões de metodologia, provenance e eventos sensíveis devem permitir reconstrução da decisão.

## Fontes de verdade

### Posição da carteira

```text
Transaction Ledger
    ↓
Position projection
    ↓
Current allocation / gaps
```

Não persistir `Holding` como fonte concorrente dos fatos do ledger.

### Recomendação de aporte

```text
Portfolio context
+ TargetAllocation
+ contribution amount
+ policy
+ execution constraints
+ concentration
+ known costs/tax impact
        ↓
canonical deterministic pipeline
        ↓
Recommendation Snapshot
```

O pipeline preserva `methodologyVersion`, reason codes, sobra e provenance das etapas relevantes.

### Dados externos

```text
External provider
    ↓
Adapter / validation
    ↓
Normalized snapshot
    ↓
Freshness / quality policy
    ↓
Engine/application
```

Falha de fonte crítica degrada para dado insuficiente; não autoriza fallback silencioso ou valor inventado.

### Teses

Mudança material não sobrescreve histórico. Nova versão/review preserva ligação temporal e evidências.

### IA

```text
Untrusted external content
    ↓
source policy + normalization
    ↓
injection screening / quarantine
    ↓
classification + dedupe + audit
    ↓
structured context
    ↓
LLM assistance
```

O LLM permanece depois das fronteiras de segurança e abaixo das regras determinísticas.

## Regras arquiteturais

1. dinheiro usa representação decimal/integer explícita; nunca `float` como fonte persistida para valor monetário;
2. percentuais, pesos, quantidade e outros valores financeiros possuem tipos/contratos explícitos;
3. timestamps materiais são normalizados e comparados de forma determinística;
4. cálculos puros não dependem de chamada externa no meio da execução;
5. dados externos entram primeiro em snapshots/records normalizados;
6. dados materiais preservam `source`, `asOf`, `retrievedAt` e freshness/quality quando aplicável;
7. RecommendationSnapshot e versões relevantes de tese são imutáveis;
8. LLM não recalcula números críticos nem altera regra financeira;
9. regras de risco precedem ranking;
10. falha de fonte crítica vira dado insuficiente;
11. ownership de dado privado é derivado da sessão no servidor;
12. SDK de fornecedor não entra no domínio;
13. parser/classifier externo que falha não transforma payload em fato silenciosamente;
14. look-ahead é rejeitado em engines/snapshots históricos;
15. novas superfícies visuais não criam uma segunda interpretação das regras do domínio.

## Persistência e consistência

Casos de uso que alteram fatos do ledger devem preservar atomicidade adequada. Posições são derivadas dos fatos; snapshots podem existir para desempenho/auditoria, nunca como única fonte de verdade sem reconciliação.

Dados privados usam ownership server-side e constraints de banco para reduzir o risco de acesso cross-owner.

## Autenticação e autorização

- GitHub OAuth estabelece identidade, não perfil financeiro;
- `/dashboard`, `/portfolio` e `/onboarding` são rotas protegidas pelo boundary de autenticação;
- `/sign-out` também exige identidade no próprio server component e redireciona quando não autenticado;
- APIs privadas resolvem owner no servidor;
- login/logout não migram nem apagam automaticamente perfil local;
- migração de perfil local para conta é explícita e revalidada.

## Integrações

Fornecedores externos continuam encapsulados por contratos/adapters. Exemplos conceituais:

```text
PriceProvider
FundamentalsProvider
MacroProvider
NewsProvider
FxProvider
AiProvider
```

Nem todos esses providers possuem implementação produtiva hoje. A interface conceitual não deve ser confundida com disponibilidade de dados em produção.

## Testes

A estratégia usa combinações adequadas ao risco:

- unit tests para value objects e engines;
- testes de invariantes para dinheiro/alocação/ledger;
- integração para repositories contra PostgreSQL real;
- contract tests para adapters de mercado;
- testes anti-look-ahead;
- testes adversariais para ingestão externa/IA;
- testes de componentes e rotas web;
- E2E/browser QA somente onde a jornada exigir;
- visual fidelity/accessibility QA nas fases R3–R9 do redesign.

## Quality gate

O gate padrão do repositório inclui:

- format check;
- lint;
- typecheck;
- migrations/integração de banco no CI;
- tests;
- build;
- auto code review independente antes de considerar trabalho concluído.

## Observabilidade

A arquitetura prevê observabilidade proporcional ao risco, incluindo:

- freshness de dados;
- falha por provider;
- duração dos cálculos;
- divergência de reconciliação;
- recomendações bloqueadas por dado insuficiente;
- versão da metodologia;
- falhas de ingestão/classificação/quarentena;
- eventos relevantes de auditoria sem incluir informação financeira pessoal desnecessária em logs.

## Evolução da arquitetura

Novos packages só devem surgir quando houver uma fronteira real de ownership, dependência ou reuso. A preferência continua sendo evoluir o monólito modular sem introduzir serviço/rede/infraestrutura distribuída prematuramente.

Mudança arquitetural material deve:

1. preservar histórico em `docs/DECISIONS.md`;
2. ganhar ADR quando necessário;
3. atualizar esta documentação;
4. incluir migração quando afetar dados;
5. manter `pnpm check` e CI verdes.
