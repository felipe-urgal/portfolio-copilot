# Investment Engine — metodologia de scoring, Portfolio Fit e ranking

## Escopo

Este documento descreve a implementação determinística do núcleo analítico das issues #41 e #42. O engine mantém `Quality`, `Opportunity`, `Dividend` e `Portfolio Fit` como dimensões separadas e usa um ranking explicável somente para ordenar candidatos dentro de uma carteira explícita.

Os pesos abaixo são **baselines de engenharia** para validar contratos, invariantes e auditabilidade. Eles não são uma recomendação universal, não foram calibrados por backtesting e não devem ser interpretados como promessa de retorno ou regra adequada a qualquer ativo.

## Escala

Todos os scores usam basis points inteiros:

```text
0     = 0,00%
5000  = 50,00%
10000 = 100,00%
```

Cada metodologia define componentes positivos cuja soma de pesos precisa ser exatamente `10000` bps.

Para um conjunto completo de componentes:

```text
score = round_half_up(sum(componentScoreBps * componentWeightBps) / 10000)
```

Nenhum `number` de ponto flutuante é usado para preço, fair value ou para a proporção monetária do gap de alocação.

## Estados de dados

Um score material só existe quando todos os componentes exigidos possuem contexto utilizável.

Quality/Opportunity retornam `INSUFFICIENT_DATA` quando ocorrer, entre outros:

- componente obrigatório ausente;
- evidência ausente;
- evidência `STALE`;
- evidência `CONFLICT`;
- look-ahead: `asOf` ou `retrievedAt` posterior ao `evaluationAsOf`;
- Opportunity sem valuation válido.

Portfolio Fit retorna `INSUFFICIENT_DATA` quando existe gap positivo e o contexto necessário da carteira/aporte não pode ser provado, por exemplo:

- ausência de `ContributionRecommendationSnapshot`;
- recommendation de outra carteira;
- decisão ligada a outro ativo.

O radar mantém candidatos insuficientes fora da coleção ranqueada. Dados ausentes nunca viram nota zero, média ou neutra automaticamente.

## Evidência e provenance

Cada evidência analítica registra:

```text
evidenceId
asOf
retrievedAt
provider
sourceId/sourceUrl/rawIdentifier
normalizationVersion
qualityFlags
```

URLs de provenance não aceitam credenciais embutidas. `retrievedAt` não pode ser anterior ao próprio `asOf`.

Para reconstruções históricas, tanto `asOf` quanto `retrievedAt` precisam ser menores ou iguais ao `evaluationAsOf`. Isso impede usar informação conhecida somente no futuro.

Portfolio Fit não reimplementa provenance do Portfolio Engine. Ele consome snapshots/contextos já produzidos pelo domínio de carteira e preserva reason codes relevantes no resultado.

## Quality Score

Quality mede qualidade estrutural e **não usa preço de entrada como mecanismo para elevar a nota**.

### Ação geral — baseline `EQUITY_STOCK_GENERAL@1.0.0`

| Componente | Peso |
|---|---:|
| Profitability | 20% |
| Capital efficiency | 15% |
| Balance sheet | 15% |
| Competitive quality | 15% |
| Growth quality | 15% |
| Cash generation | 10% |
| Governance | 5% |
| Predictability | 5% |

Os pesos seguem a estrutura inicial já documentada em `FINANCIAL-METHODOLOGY.md`.

### Bancos — baseline `EQUITY_STOCK_BANKS@1.0.0`

Bancos usam componentes próprios: retorno sobre patrimônio, adequação de capital, qualidade de ativos, funding, eficiência, estabilidade de resultados, governança e qualidade de crescimento. A metodologia não reutiliza cegamente balanço industrial.

### FII — baseline `REAL_ESTATE_FUND_GENERAL@1.0.0`

FIIs usam ocupação, qualidade de locatários/contratos, alavancagem, geração de caixa, diversificação, gestão e previsibilidade. Métricas de companhia industrial não são impostas ao veículo.

## Opportunity Score

Opportunity mede preço/oportunidade atual e permanece independente de Quality.

A primeira estrutura contém, conforme a metodologia, sinais como:

- valuation versus histórico;
- valuation versus pares;
- retorno implícito;
- margem de segurança;
- revisões de resultado;
- ciclo econômico/setorial;
- sensibilidade a juros;
- risco da tese.

Um `Opportunity Score` só é produzido quando há um `ValuationSnapshot` válido. Um Quality alto não preenche valuation ausente e não garante Opportunity alto.

## Dividend Score

Dividend é uma dimensão separada e sua aplicabilidade faz parte da metodologia:

- `REQUIRED`: todos os componentes são necessários;
- `OPTIONAL`: ausência total de evidência retorna `NOT_APPLICABLE`;
- `NOT_APPLICABLE`: a metodologia não possui componentes de dividendos.

A nota não é baseada apenas em dividend yield. Os baselines incluem cobertura por caixa/capital, recorrência, payout, suporte do balanço/alavancagem, crescimento e sustentabilidade.

Dividend não participa do baseline de ranking da #42. Continua disponível como dimensão explicativa independente.

## Valuation snapshot

A implementação **não inventa um DCF universal**. Um modelo externo e explicitamente versionado fornece o fair value; o engine valida e reconcilia esse resultado com um preço de Market Data.

Inputs materiais:

```text
assetId
currentPrice + currency + Market Data provenance
fairValue + currency + analytical evidence
valuationModelId
valuationModelVersion
evaluationAsOf
```

As fórmulas são:

```text
upsideBps = round_half_away_from_zero((fairValue - currentPrice) / currentPrice * 10000)

discountToFairValueBps = round_half_away_from_zero((fairValue - currentPrice) / fairValue * 10000)
```

Exemplo puramente matemático:

```text
preço = 80
fair value = 100
upside = 25,00%
desconto para fair value = 20,00%
```

Moedas diferentes, stale/conflict ou look-ahead produzem `INSUFFICIENT_DATA` em vez de conversão/estimativa silenciosa.

## Portfolio Fit

Portfolio Fit responde a uma pergunta diferente de Quality e Opportunity: **quanto este candidato ajuda a necessidade atual desta carteira sem violar as restrições já conhecidas do aporte?**

O baseline `PORTFOLIO_FIT_RANKING_BR@1.0.0` possui três componentes:

| Componente | Peso |
|---|---:|
| Allocation gap | 40% |
| Concentration | 30% |
| Contribution eligibility | 30% |

### Allocation gap

O sinal do gap é:

```text
allocationGapScoreBps = round_half_up(gap / targetValue * 10000)
```

O resultado é limitado a `10000` bps. O cálculo usa `Money.minorUnits`/`BigInt`.

Exemplo puramente matemático:

```text
targetValue = 600
gap = 300
allocationGapScore = 5000 bps
```

Quando não existe gap positivo, Portfolio Fit retorna score zero com `NO_ALLOCATION_GAP`. Nesse caso não é necessário fabricar uma decisão de aporte apenas para completar a fórmula.

### Concentração

Sem alerta de concentração, o componente recebe `10000` bps e registra `WITHIN_CONCENTRATION_LIMITS`.

No baseline atual, `SOFT_CONCENTRATION_LIMIT_EXCEEDED` reduz esse componente para `5000` bps. Quando o Portfolio Engine informa `HARD_CONCENTRATION_LIMIT_APPLIED`, o componente de concentração recebe `0` bps mesmo que ainda reste uma parcela executável. Essas penalidades fazem parte da metodologia versionada e devem ser recalibradas por pesquisa/backtesting antes de uso financeiro relevante.

Hard limits não são recalculados no Investment Engine. O engine apenas consome o reason code/status já produzido pelo contribution pipeline.

### Elegibilidade de aporte e hard blocks

`EXECUTABLE` recebe `10000` bps no componente de elegibilidade.

Os estados abaixo são hard blocks:

- `NOT_SELECTED_BY_POLICY`;
- `BLOCKED_CONCENTRATION_LIMIT`;
- `BLOCKED_INELIGIBLE`;
- `BLOCKED_KNOWN_COSTS`.

Quando um deles ocorre, o Portfolio Fit final é zero. O snapshot ainda preserva componentes, `hardBlockStatus` e reason codes; o override não é escondido.

Quando existe gap positivo, o evaluator exige o `ContributionRecommendationSnapshot` completo e valida que `portfolioId` coincide com o `AllocationGap`. Receber somente uma decisão isolada foi rejeitado porque ela não prova a qual carteira pertence.

## Radar e ranking explicável

O ranking baseline combina:

| Dimensão | Peso |
|---|---:|
| Quality | 35% |
| Opportunity | 35% |
| Portfolio Fit | 30% |

A fórmula é:

```text
rankingScoreBps = round_half_up(
  (
    qualityScoreBps * 3500
    + opportunityScoreBps * 3500
    + portfolioFitScoreBps * 3000
  ) / 10000
)
```

Na implementação, cada contribuição ponderada é preservada separadamente no snapshot. O resultado também carrega os snapshots completos de Quality, Opportunity e Portfolio Fit.

### Compatibilidade exigida

Para um candidato entrar no ranking:

- as três dimensões precisam estar em `SCORED`;
- todas precisam usar o mesmo `evaluationAsOf` do radar;
- Quality e Opportunity precisam usar o mesmo `methodologyId`, versão e classificação analítica;
- Portfolio Fit precisa usar a metodologia de ranking selecionada;
- Portfolio Fit precisa pertencer ao `portfolioId` do radar;
- `PortfolioFit.assetClass` precisa coincidir com a classe da classificação analítica de Quality/Opportunity.

Falhar em qualquer regra mantém o candidato em `insufficient`, com razões explícitas.

### Desempate

A ordenação é:

```text
1. rankingScoreBps DESC
2. AssetId canônico ASC
```

A regra `RANKING_SCORE_DESC_ASSET_ID_ASC` fica registrada no snapshot para tornar empates determinísticos e reproduzíveis.

## Reason codes

Cada componente scored de Quality/Opportunity/Dividend exige ao menos um `reasonCode`. Portfolio Fit preserva os reason codes do contexto de carteira relevantes e adiciona códigos de estado próprios.

No ranking, reason codes são prefixados pela dimensão, por exemplo:

```text
QUALITY:...
OPPORTUNITY:...
PORTFOLIO_FIT:...
```

Reason codes são dados estruturados e auditáveis; texto explicativo futuro pode ser gerado a partir deles, mas não é fonte de verdade do score.

## Versionamento

Metodologias analíticas são selecionadas por `methodologyId + version`. O registry não escolhe automaticamente a versão mais recente e não faz fallback silencioso entre setores.

Portfolio Fit/ranking também possui metodologia própria e versionada. Mudanças de pesos, penalidades, componentes, hard-block semantics ou interpretação que alterem resultados devem criar nova versão.

Reproduzir um snapshot histórico exige a versão original e os mesmos inputs/contextos.

## Limitações atuais

- os baselines de Opportunity, bancos, FIIs e Portfolio Fit/ranking são estruturas de engenharia ainda não calibradas;
- fundamentals provider e fórmulas específicas de DCF/múltiplos ainda não fazem parte desta etapa;
- não há inferência por IA;
- não há ajuste automático por confiança: evidência material inválida bloqueia a nota;
- não há conversão cambial implícita no valuation;
- o `ContributionRecommendationSnapshot` ainda não possui timestamp próprio; alinhamento temporal desse contexto precisa ser garantido pela camada orquestradora;
- ranking não substitui a decomposição das dimensões e não constitui execução de ordem;
- não existe promessa de que score alto implique retorno futuro.

Antes de uso financeiro relevante, cada metodologia precisa de pesquisa, revisão metodológica, validação de dados e backtesting sem look-ahead/survivorship bias.
