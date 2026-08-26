# ADR-0017 — Pipeline canônico de aporte produz snapshot auditável sem reimplementar regras

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Engine passou a possuir camadas puras e independentes para:

1. alocação econômica do aporte;
2. política de microaporte e limite de destinos;
3. limites de concentração por `AssetClass`;
4. elegibilidade/unidade mínima por `AssetId`;
5. custos transacionais e impacto tributário monetário fornecido.

Essas camadas já eram individualmente determinísticas, mas a aplicação precisava conhecer a ordem correta, compor contratos intermediários e reconstruir manualmente por que um destino foi alterado ou bloqueado. Isso cria risco de ordem divergente entre callers e perda de provenance quando uma camada posterior reduz a representação operacional da anterior.

## Decisão

Criar `buildContributionRecommendationSnapshot` como orquestrador puro do pipeline canônico:

```text
allocateContribution
  -> applyContributionPolicy
  -> applyAssetClassConcentrationLimits
  -> applyContributionExecutionConstraints
  -> applyContributionCostTaxConstraints
  -> ContributionRecommendationSnapshot
```

O orquestrador não possui fórmula financeira própria. Ele passa os outputs entre as funções existentes e transforma resultados já validados em um snapshot serializável e imutável.

## Contrato de entrada

A entrada reutiliza diretamente os contratos existentes:

- `ContributionAllocatorInput`;
- `ContributionPolicy`;
- `AssetClassConcentrationLimitInput[]`;
- `ContributionExecutionDestinationInput[]`;
- `ContributionCostTaxConstraintInput[]`.

Além disso recebe `methodologyVersion` explicitamente. O domínio não inventa versão, timestamp, fonte de preço ou provenance externo em runtime.

`methodologyVersion` deve ser uma string não vazia sem whitespace periférico. Erro nessa configuração é tipado como `InvalidContributionMethodologyVersionError`.

## Snapshot

O snapshot usa somente valores serializáveis para a fronteira externa do domínio:

- IDs e códigos como strings;
- moeda como código;
- `Money` como decimal canônico;
- `AssetQuantity` como decimal canônico;
- pesos como pontos percentuais canônicos;
- enums de status/reason code fechados.

No topo, preserva:

- `methodologyVersion`;
- `portfolioId`;
- moeda;
- `portfolioValue`;
- aporte;
- valor pós-aporte;
- política de microaporte aplicada;
- sobra cumulativa após allocator, política, concentração, execução e custos;
- total investível;
- custo conhecido efetivamente consumido;
- sobra final.

Por decisão material, preserva:

- `AssetClass` e eventual `AssetId`;
- `targetWeightPercent` da política-alvo;
- valor atual, alvo pós-aporte e necessidade;
- alocação baseline;
- alocação após política;
- alocação após concentração e parcela bloqueada;
- thresholds soft/hard aplicáveis;
- elegibilidade e quantidade mínima quando o pipeline chegou ao destino por ativo;
- custo transacional e impacto tributário fornecido;
- custo conhecido total e custo efetivamente consumido;
- valor investível final;
- status e reason codes.

A sobra por etapa é cumulativa, não incremental. Isso permite localizar em qual transição o caixa aumentou sem duplicar a lógica interna de cada camada.

## Reason codes

A primeira versão usa ordem estável e explícita:

1. `CONTRIBUTION_POLICY_ADJUSTED`;
2. `SOFT_CONCENTRATION_LIMIT_EXCEEDED`;
3. `HARD_CONCENTRATION_LIMIT_APPLIED`;
4. `EXECUTION_DESTINATION_INELIGIBLE`;
5. `KNOWN_COSTS_BLOCKED_DESTINATION`.

Reason code descreve provenance; status descreve o estado operacional final da decisão. Um destino pode, por exemplo, continuar `EXECUTABLE` e carregar `HARD_CONCENTRATION_LIMIT_APPLIED` quando somente parte da alocação foi cortada.

## Status finais

- `EXECUTABLE`;
- `NOT_SELECTED_BY_POLICY`;
- `BLOCKED_CONCENTRATION_LIMIT`;
- `BLOCKED_INELIGIBLE`;
- `BLOCKED_KNOWN_COSTS`.

Classes sem decisão material de aporte não são incluídas apenas para preencher o snapshot. A ordem herdada do allocator permanece lexical por `AssetClass`.

## Reconciliação monetária

O snapshot distingue custo conhecido de custo consumido.

Para destinos executáveis:

```text
investableAmount + consumedKnownCost = gross allocated budget
```

Para destino bloqueado por custo, o custo conhecido permanece visível para auditoria, mas `consumedKnownCost = 0`, pois a operação não ocorre e o orçamento bruto retorna para caixa.

No agregado:

```text
contribution = totalInvestableAmount + totalConsumedKnownCost + unallocatedContribution
```

Essa igualdade decorre das semânticas das camadas existentes; o orquestrador não cria nova política de redistribuição ou arredondamento.

## Erros

Erros tipados das camadas internas propagam sem wrapping genérico. O caller continua podendo distinguir, por exemplo, erro de portfolio, moeda, concentração, elegibilidade ou custo.

## Consequências positivas

- existe um único pipeline canônico para callers futuros;
- a ordem das restrições deixa de ser convenção implícita;
- decisões intermediárias permanecem auditáveis mesmo quando a saída operacional posterior é menor;
- a origem cumulativa da sobra em caixa pode ser observada por etapa;
- snapshot é adequado para futura persistência/API sem acoplar infraestrutura ao domínio;
- testes end-to-end podem validar reconciliação e determinismo do motor completo;
- explicações futuras podem consumir reason codes estruturados em vez de inferir regras por texto.

## Limites deliberados

Este ADR não adiciona:

- preço ou FX;
- cálculo tributário;
- consulta de tarifas;
- ranking de ativos;
- Quality/Opportunity/Portfolio Fit;
- `asOf` ou provenance de fonte externa;
- persistência;
- API/UI;
- execução de ordens;
- IA.

Quando dados externos entrarem no produto, `asOf`, source/provenance, freshness e versões de adapters deverão ser contratos explícitos anteriores ao snapshot material correspondente.

## Alternativas rejeitadas

### Reimplementar regras no orquestrador

Rejeitada porque criaria duas fontes de verdade e risco de drift entre testes unitários e fluxo final.

### Expor apenas o plano final de custo

Rejeitada porque apagaria decisões anteriores, especialmente soft/hard concentration, inelegibilidade e a origem da sobra em caixa.

### Colocar mensagens humanas no snapshot como fonte de verdade

Rejeitada porque texto não é contrato estável. Reason codes estruturados devem ser a base para explicações futuras.

### Gerar `methodologyVersion` ou timestamp dentro do domínio

Rejeitada porque introduziria estado/tempo implícito e reduziria reprodutibilidade.
