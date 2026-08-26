# Arquitetura

## Decisão principal

Começar como **monólito modular TypeScript** com fronteiras de domínio explícitas. Microserviços só serão considerados mediante necessidade comprovada de escala, isolamento operacional ou ownership independente.

## Estrutura alvo inicial

```text
portfolio-copilot/
├── apps/
│   └── web/
├── packages/
│   ├── domain/
│   ├── portfolio-engine/
│   ├── investment-engine/
│   ├── market-data/
│   └── shared/
├── docs/
└── tests/
```

A stack exata será criada na próxima fase técnica. A direção inicial é web/PWA, TypeScript, API no mesmo produto e PostgreSQL como banco relacional.

## Camadas

### UI

Responsável por interação e apresentação. Não contém fórmula financeira relevante.

### Application

Orquestra casos de uso, autorização, transações e integração entre módulos.

### Domain

Entidades, value objects, invariantes e políticas. Sem dependência de framework web ou fornecedor de dados.

### Engines

Funções financeiras determinísticas, versionadas e testáveis.

### Infrastructure

Persistência, filas, cache, provedores de preço, fundamentos, notícias e LLM.

## Módulos

### identity

User, sessão, autenticação e autorização.

### profile

Objetivos, horizonte, experiência, liquidez, tolerância a risco e restrições.

### assets

Cadastro canônico de ativos, classes, setores, moedas, identificadores e elegibilidade.

### portfolio

Portfolio, Transaction, TargetAllocation e políticas de configuração da carteira.

### position

Projeções determinísticas de posições atuais derivadas do transaction ledger. Não é uma segunda fonte de verdade e não persiste holdings no domínio.

### contribution

Aporte disponível, gaps, restrições e distribuição sugerida.

### risk

Concentração, classe, setor, emissor, moeda, volatilidade quando disponível e regras de limite.

### fundamentals

Séries históricas e dados de resultado com provenance.

### valuation

Múltiplos, parâmetros, cenários e outputs versionados.

### ranking

Quality, Opportunity e outros sub-scores.

### recommendation

Portfolio Fit, elegibilidade, explicação e `RecommendationSnapshot`.

### thesis

Tese, drivers, riscos, indicadores, eventos e revisão.

### market-data

Interfaces de fornecedores, normalização, cache, freshness e observabilidade.

### ai

Resumo/classificação de texto e explicação. Nunca altera posição, score ou regra sem passar por contratos determinísticos.

### audit

Registro de alterações sensíveis, snapshots e versão da metodologia.

## Modelo de dados conceitual

```text
User
InvestorProfile
Goal
Portfolio
Asset
AssetIdentifier
Holding
Transaction
TargetAllocation
ContributionPlan
RiskRule
FundamentalSnapshot
ValuationSnapshot
AssetScoreSnapshot
InvestmentThesis
ThesisEvent
MarketEvent
RecommendationSnapshot
AuditEvent
```

## Regras arquiteturais

1. dinheiro usa decimal/integer de menor unidade; nunca `float` para valores monetários persistidos;
2. percentuais e taxas possuem tipo/value object explícito;
3. timestamps persistidos em UTC e exibidos no fuso do usuário;
4. cálculos não dependem de chamada externa no meio da função pura;
5. dados externos entram primeiro em snapshots normalizados;
6. cada dado material possui `source`, `asOf`, `retrievedAt` e qualidade/freshness quando possível;
7. recomendações são imutáveis depois de emitidas;
8. LLM recebe contexto já estruturado e não recalcula números críticos;
9. regras de risco possuem precedência sobre ranking;
10. falha de fonte crítica deve degradar o produto para `dados insuficientes`, não inventar valor.

## Consistência

Casos de uso que alteram fatos do ledger devem ser atômicos. Posições atuais são derivadas desses fatos; snapshots podem existir para desempenho, nunca como única fonte de verdade sem reconciliação.

## Integrações

Fornecedores externos serão encapsulados por interfaces:

```text
PriceProvider
FundamentalsProvider
MacroProvider
NewsProvider
FxProvider
AiProvider
```

Nenhum domínio importa SDK de fornecedor diretamente.

## Testes

- unitários para value objects e engines;
- property-based tests para invariantes de alocação e dinheiro;
- integração para repositórios e provedores;
- contract tests para adapters de mercado;
- E2E apenas para jornadas críticas;
- golden tests para snapshots de recomendações relevantes.

## Observabilidade

Registrar métricas de:

- freshness de dados;
- falha por provedor;
- duração dos cálculos;
- divergência de reconciliação;
- recomendações bloqueadas por dado insuficiente;
- versão da metodologia em uso.
