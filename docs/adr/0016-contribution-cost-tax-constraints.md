# ADR-0016 — Custos conhecidos e impacto tributário reservado consomem o orçamento bruto do destino

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O pipeline de aporte já determina necessidade econômica por `AssetClass`, concentra microaportes, aplica limites de concentração e escolhe um destino elegível por `AssetId`. Ainda faltava representar custos transacionais e impactos tributários materiais já conhecidos sem consultar corretora, tabela fiscal, preço ou serviço externo dentro do domínio puro.

Misturar cálculo fiscal ou descoberta de tarifa nesta camada criaria dependência temporal e regulatória no Portfolio Engine. Por outro lado, ignorar um custo conhecido faria a recomendação gastar acima do orçamento disponível ou esconder que o valor efetivamente investível é menor que o valor bruto destinado.

## Decisão

Criar `applyContributionCostTaxConstraints` como camada pura posterior a `applyContributionExecutionConstraints`.

Pipeline canônico desta etapa:

```text
allocateContribution
  -> applyContributionPolicy
  -> applyAssetClassConcentrationLimits
  -> applyContributionExecutionConstraints
  -> applyContributionCostTaxConstraints
```

Cada configuração é vinculada a um `AssetId` já presente no `ContributionExecutionPlan` e contém:

- `transactionCost: Money`;
- `estimatedTaxImpact: Money`.

Ausência de configuração para um destino significa custo conhecido zero. Configuração duplicada ou que aponte para ativo fora do plano de execução é rejeitada por erro tipado.

## Semântica monetária

`allocatedAmount` continua sendo o orçamento bruto herdado das etapas anteriores. A nova camada expõe separadamente:

```text
totalKnownCost = transactionCost + estimatedTaxImpact
investableAmount = allocatedAmount - totalKnownCost
```

A igualdade acima vale somente quando `totalKnownCost < allocatedAmount` e o destino permanece executável.

Se `totalKnownCost >= allocatedAmount`, o destino recebe status `BLOCKED_KNOWN_COSTS`, `investableAmount = 0` e o `allocatedAmount` bruto inteiro retorna para `unallocatedContribution`. Como a operação é bloqueada, nenhum custo hipotético é debitado da carteira.

Não existe redistribuição automática do valor bloqueado para outro destino nesta camada.

## Impacto tributário

`estimatedTaxImpact` **não é imposto calculado pelo domínio**. Ele representa um impacto monetário fornecido externamente que o chamador decidiu reservar contra o orçamento daquele aporte.

Esta camada não conhece:

- alíquota;
- faixa de isenção;
- come-cotas;
- compensação de prejuízo;
- regime tributário;
- data de vencimento;
- jurisdição;
- natureza fiscal do instrumento.

Essas regras exigem contratos e provenance próprios fora deste cálculo puro.

## Precisão e moeda

- todos os valores usam `Money`;
- valores negativos são rejeitados;
- custo e impacto tributário devem usar a mesma moeda do aporte;
- nenhuma operação financeira usa `number` binário;
- centavos são preservados sem arredondamento adicional nesta camada.

## Auditabilidade

Cada destino final preserva:

- `allocatedAmount` bruto;
- `transactionCost`;
- `estimatedTaxImpact`;
- `totalKnownCost`;
- `investableAmount`;
- `status`.

Isso impede que o custo seja descontado silenciosamente da recomendação e permite explicar por que um destino foi bloqueado.

## Consequências

### Positivas

- orçamento bruto e valor efetivamente investível ficam reconciliados;
- custo transacional e impacto tributário permanecem conceitos separados;
- nenhuma regra fiscal é inventada no domínio;
- destinos inviáveis são bloqueados de forma explícita;
- sobra upstream é preservada e acrescida somente do orçamento de destinos bloqueados;
- mesma entrada produz mesma saída.

### Limitações deliberadas

- não calcula imposto;
- não consulta tarifa de corretora;
- não deriva custo percentual, spread ou slippage;
- não usa preço ou FX;
- não decide se uma estimativa tributária deve ser reservada: isso é responsabilidade do chamador;
- não reexecuta política de microaporte após custos;
- não redistribui valor bloqueado;
- não executa ordem.

## Alternativas rejeitadas

### Descontar custos sem expor o valor bruto

Rejeitado porque elimina provenance e torna impossível distinguir redução econômica de custo operacional.

### Somar custos por fora do `allocatedAmount`

Rejeitado porque poderia fazer a recomendação total ultrapassar o aporte disponível.

### Calcular imposto dentro do Portfolio Engine

Rejeitado porque regras fiscais são externas, mutáveis, dependentes de contexto e precisam de provenance/versionamento próprios.

### Redistribuir automaticamente destinos bloqueados

Rejeitado nesta etapa porque altera a decisão econômica upstream e exige política explícita de nova otimização.
