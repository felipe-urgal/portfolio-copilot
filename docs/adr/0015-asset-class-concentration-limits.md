# ADR-0015 — Limites de concentração por AssetClass no fluxo de aporte

- Status: Aceita
- Data: 2026-08-26
- Decisão relacionada: D-023

## Contexto

O Portfolio Engine já calcula a necessidade pós-aporte, concentra microaportes, aplica restrições operacionais por ativo e preserva sobra explícita. Ainda faltava uma política de risco que impedisse uma nova alocação por `AssetClass` de ultrapassar um limite duro configurado.

A regra precisa operar sem preço, ticker, FX, dados de corretora ou concentração por ativo individual. Também precisa manter separadas a decisão econômica upstream e a restrição de risco aplicada depois.

## Decisão

Adicionar `applyAssetClassConcentrationLimits` como camada pura sobre `ContributionPlan`.

Cada configuração contém:

```text
assetClass
softMaxWeight
hardMaxWeight
```

`softMaxWeight` e `hardMaxWeight` usam `AllocationWeight`. A configuração exige:

```text
0% <= softMaxWeight <= hardMaxWeight <= 100%
```

Duplicidade por `AssetClass` normalizada é inválida.

## Denominador

O peso projetado usa o `postContributionValue` já calculado pelo `ContributionAllocator`:

```text
projectedWeight = projectedClassValue / postContributionValue
```

A camada não recalcula `portfolioValue`, `contribution`, necessidade pós-aporte ou pesos-alvo.

## Precisão e limite duro

A decisão não usa divisão em `number` binário. Com `AllocationWeight` escalado em unidades inteiras:

```text
maxClassValueMinorUnits =
  floor(postContributionValueMinorUnits * hardWeightUnits / fullWeightUnits)
```

O espaço disponível para novo aporte é:

```text
available = max(0, maxClassValueMinorUnits - currentClassValueMinorUnits)
```

A alocação final da classe é:

```text
min(originalAllocatedAmount, available)
```

Isso garante, na granularidade monetária de centavos, que uma nova alocação nunca empurre a classe acima do `hardMaxWeight`.

Se a classe já estiver acima do hard limit antes do aporte, nenhum novo valor é direcionado a ela. Esta camada não vende nem rebalanceia posições existentes.

## Limite suave

Na primeira versão, `softMaxWeight` é **alert-only**.

Se o valor projetado após a aplicação do hard limit exceder o soft limit, a alocação recebe `softLimitExceeded = true`. O soft limit não reduz valor sozinho.

Essa escolha separa:

- soft limit: sinal determinístico de atenção para o fluxo de novos aportes;
- hard limit: restrição obrigatória que bloqueia valor.

Uma política futura pode transformar o soft limit em bloqueio ou penalidade explícita mediante nova decisão versionada.

## Sobra e não redistribuição

Valor cortado pelo hard limit é registrado em `blockedAmount` e somado ao `unallocatedContribution` já existente.

A camada não redistribui esse valor para outra classe. Redistribuição mudaria a decisão econômica do plano upstream e exigiria uma política própria de prioridade sob restrições de risco.

## Classes sem limite

Uma classe sem configuração explícita mantém exatamente a alocação recebida do plano anterior e não recebe sinal de soft/hard limit.

## Saída e auditabilidade

Cada allocation expõe, além dos campos originais:

```text
softMaxWeight
hardMaxWeight
softLimitExceeded
hardLimitApplied
blockedAmount
```

A saída preserva a ordem upstream e permanece imutável/determinística.

## Fora de escopo

- concentração por ativo individual;
- setor, emissor, grupo econômico, moeda e geografia;
- preço, valuation e FX;
- Quality/Opportunity/Portfolio Fit;
- custos e impostos;
- venda e rebalanceamento;
- persistência, API, UI e IA.

## Consequências

### Positivas

- hard limits passam a ser invariantes executáveis e testáveis;
- soft limits ficam explícitos sem comportamento implícito;
- cálculo usa somente unidades inteiras financeiras;
- sobra bloqueada mantém provenance;
- regra continua independente de dados externos.

### Trade-offs

- valor bloqueado não é redistribuído nesta etapa;
- concentração é apenas por `AssetClass`;
- classes já acima do limite não são corrigidas por venda;
- soft limit é sinal, não bloqueio.
