# ADR-0012 — ContributionAllocator usa necessidade pós-aporte e maiores restos

**Status:** Aceita

**Data:** 2026-08-26

## Contexto

`AllocationGap` mede a distância da carteira atual para a política-alvo usando o valor atual reconciliado. Para sugerir o destino de um novo aporte, porém, aplicar esses gaps diretamente é insuficiente: o próprio aporte aumenta o valor total da carteira e portanto altera os valores monetários-alvo de cada `AssetClass`.

O domínio também precisa evitar `number` binário, preservar centavos exatamente, não recomendar mais dinheiro do que existe e não ultrapassar a necessidade pós-aporte de nenhum bucket. Políticas de microaporte, concentração, número máximo de destinos e unidade mínima negociável ainda não pertencem a esta etapa.

## Decisão

Criar `allocateContribution` no módulo `contribution` como função pura e determinística.

A entrada contém:

- `PortfolioId`;
- `TargetAllocation` do mesmo portfolio;
- valor atual reconciliado da carteira (`portfolioValue`);
- valores atuais por `AssetClass`;
- aporte disponível (`contribution`).

O cálculo usa explicitamente:

```text
postContributionValue = portfolioValue + contribution
```

Os valores-alvo pós-aporte são apurados pela mesma política de maiores restos adotada em ADR-0011. Para cada classe:

```text
postContributionNeed = max(0, postContributionTargetValue - currentValue)
```

Somente necessidades positivas participam da distribuição. O valor distribuível é:

```text
allocatable = min(contribution, sum(postContributionNeed))
```

O baseline distribui `allocatable` proporcionalmente às necessidades positivas. A conversão para centavos também usa maiores restos e desempate lexical por `AssetClass`, de forma que a soma alocada reconcilie exatamente com `allocatable`.

A saída inclui todas as classes da união entre estado atual e alvo, ordenadas lexicalmente, com necessidade e alocação zero quando a classe não é elegível. O plano também expõe `unallocatedContribution`.

## Política de sobra de caixa

Se não houver necessidade positiva, ou se o aporte disponível exceder a soma das necessidades elegíveis, a parcela não distribuída permanece em `unallocatedContribution`; o baseline não inventa um destino.

Com uma `TargetAllocation` completa de 100% e estado atual exatamente reconciliado, a soma das necessidades positivas pós-aporte é matematicamente maior ou igual ao próprio aporte. Portanto, nas invariantes atuais, um aporte positivo tende a ser totalmente distribuído. O campo de sobra permanece explícito para estados-limite e para as próximas políticas de elegibilidade/concentração, que podem tornar parte do aporte não alocável.

## Precisão e arredondamento

- `Money` e `bigint` são usados em todos os cálculos monetários;
- nenhum cálculo financeiro usa `number` binário;
- valores-alvo e distribuição proporcional compartilham o mesmo helper interno de maiores restos;
- empates de resto são resolvidos lexicalmente por `AssetClass`, como convenção determinística e não preferência econômica;
- nenhuma alocação pode ser maior que a necessidade do bucket;
- a soma das alocações nunca pode ultrapassar o aporte.

## Validação

O allocator rejeita explicitamente:

- `TargetAllocation` de outro portfolio;
- `portfolioValue` ou aporte negativos;
- moedas divergentes;
- buckets atuais duplicados após normalização;
- valores atuais negativos;
- soma dos buckets atuais divergente de `portfolioValue`.

## Consequências

### Positivas

- a recomendação considera corretamente o efeito do próprio aporte no alvo;
- o resultado é auditável e reproduzível em centavos;
- a política monetária não diverge da usada por `AllocationGap`;
- buckets overweight não recebem aporte no baseline;
- existe representação explícita de eventual caixa não alocado.

### Trade-offs

- distribuição proporcional por necessidade é apenas o baseline; não tenta concentrar microaportes em poucos destinos;
- ainda não há unidade mínima negociável, preço, lote ou seleção de ativo dentro da classe;
- o desempate lexical resolve somente determinismo de centavos, não prioridade econômica.

## Fora de escopo

- `minimumMeaningfulContribution`;
- `maxDestinationsPerContribution`;
- unidade mínima negociável e elegibilidade por ativo;
- limites de concentração;
- preço, FX e valuation;
- ticker/ativo específico;
- custos, impostos, vendas e rebalanceamento;
- persistência, API, UI e IA.

## Próximo passo

Adicionar a política de microaporte e limite de destinos sobre o baseline do `ContributionAllocator`, sem alterar suas invariantes monetárias.
