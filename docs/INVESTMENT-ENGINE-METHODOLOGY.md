# Investment Engine — metodologia de scoring e valuation

## Escopo

Este documento descreve a primeira implementação determinística do núcleo analítico da issue #41. Ele separa `Quality`, `Opportunity`, `Dividend` e valuation. `Portfolio Fit`, radar e ranking pertencem à issue #42.

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

Nenhum `number` de ponto flutuante é usado para preço, fair value ou cálculo de diferença relativa de valuation.

## Estados de dados

Um score material só existe quando todos os componentes exigidos possuem evidência utilizável.

O engine retorna `INSUFFICIENT_DATA` quando ocorrer, entre outros:

- componente obrigatório ausente;
- evidência ausente;
- evidência `STALE`;
- evidência `CONFLICT`;
- look-ahead: `asOf` ou `retrievedAt` posterior ao `evaluationAsOf`;
- Opportunity sem valuation válido.

Dados ausentes nunca viram nota zero, média ou neutra automaticamente.

## Evidência e provenance

Cada evidência registra:

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

## Valuation snapshot

A primeira implementação **não inventa um DCF universal**. Um modelo externo e explicitamente versionado fornece o fair value; o engine valida e reconcilia esse resultado com um preço de Market Data.

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

## Reason codes

Cada componente scored exige ao menos um `reasonCode`. Reason codes são dados estruturados e auditáveis; texto explicativo futuro pode ser gerado a partir deles, mas não é fonte de verdade do score.

## Versionamento

A metodologia é selecionada por `methodologyId + version`. O registry não escolhe automaticamente a versão mais recente e não faz fallback silencioso entre setores.

Mudanças de pesos, componentes ou interpretação que alterem resultados devem criar nova versão. Reproduzir um snapshot histórico exige a versão original e os mesmos inputs/evidências.

## Limitações atuais

- os baselines de Opportunity, bancos e FIIs são estruturas de engenharia ainda não calibradas;
- fundamentals provider e fórmulas específicas de DCF/múltiplos ainda não fazem parte desta etapa;
- não há Portfolio Fit, ranking ou recomendação de aporte neste pacote;
- não há inferência por IA;
- não há ajuste automático por confiança: evidência material inválida bloqueia a nota;
- não há conversão cambial implícita no valuation;
- não existe promessa de que score alto implique retorno futuro.

Antes de uso financeiro relevante, cada metodologia precisa de pesquisa, revisão metodológica, validação de dados e backtesting sem look-ahead/survivorship bias.
