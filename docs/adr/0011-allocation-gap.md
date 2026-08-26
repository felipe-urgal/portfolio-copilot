# ADR-0011 — AllocationGap monetário reconciliado por AssetClass

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

`TargetAllocation` define pesos completos por `AssetClass`, mas o domínio ainda precisa transformar esses pesos em valores monetários-alvo comparáveis com valores atuais já normalizados por classe.

O cálculo não pode buscar preço, converter posições em valor de mercado nem decidir aportes. Ele recebe uma base monetária pronta e precisa preservar precisão em centavos, inclusive quando a aplicação dos pesos produz frações de unidade mínima.

Arredondar cada bucket independentemente pode fazer a soma dos valores-alvo divergir do total da carteira por centavos, mesmo quando os pesos somam exatamente 100%. Essa diferença seria pequena, mas quebraria uma invariante contábil importante e propagaria ruído para o futuro `ContributionAllocator`.

## Decisão

`AllocationGap` pertence ao módulo `contribution` como estrutura derivada. O cálculo recebe:

- `PortfolioId` da base atual;
- uma `TargetAllocation`;
- `totalValue` em `Money`;
- valores atuais já agregados por `AssetClass`, também em `Money`.

A entrada deve obedecer às seguintes invariantes:

1. o `PortfolioId` da base atual deve ser o mesmo da `TargetAllocation`;
2. `totalValue` e valores por bucket não podem ser negativos;
3. todos os valores devem usar a mesma moeda;
4. buckets atuais duplicados são inválidos, inclusive após normalização de `AssetClass`;
5. a soma exata dos valores atuais deve ser igual a `totalValue`.

### Aplicação dos pesos em centavos

A aplicação de `AllocationWeight` sobre `Money` usa somente inteiros (`bigint`). Para cada bucket-alvo:

```text
numerator = totalMinorUnits * weightScaledUnits
baseMinorUnits = numerator / fullWeightScaledUnits
remainder = numerator % fullWeightScaledUnits
```

Primeiro cada bucket recebe a parte inteira em unidades mínimas. Os centavos residuais necessários para reconciliar a soma com `totalValue` são distribuídos pelo método de **maiores restos**:

1. maior resto recebe primeiro;
2. empates são resolvidos lexicalmente por código de `AssetClass`;
3. cada unidade mínima residual é distribuída uma única vez até a soma dos valores-alvo ser exatamente igual a `totalValue`.

Essa política é determinística, não usa ponto flutuante e mantém a soma dos valores-alvo reconciliada com a base monetária.

### Semântica do gap

Para cada classe na união entre buckets-alvo e buckets atuais:

```text
gap = max(0, targetValue - currentValue)
```

- classe-alvo ausente nos valores atuais usa `currentValue = 0`;
- classe atual sem peso-alvo usa `targetWeight = 0`, `targetValue = 0` e `gap = 0`;
- bucket acima do alvo nunca produz gap negativo;
- a saída é ordenada lexicalmente por `AssetClass`.

O valor-alvo desta etapa usa o **valor atual reconciliado da carteira**. Ele não inclui aporte futuro.

## Fronteira com ContributionAllocator

O futuro `ContributionAllocator` deverá considerar `portfolioValue + contribution` ao calcular a necessidade pós-aporte. Portanto, não deve interpretar o `AllocationGap` atual como um gap que já incorpora o novo dinheiro.

A política de maiores restos deve ser reutilizada quando valores-alvo pós-aporte precisarem ser convertidos para unidades mínimas, evitando duas regras diferentes de arredondamento na mesma cadeia financeira.

## Consequências

### Positivas

- nenhuma aritmética financeira usa `number` binário;
- valores-alvo sempre reconciliam exatamente com o total em centavos;
- comportamento de arredondamento é auditável e reproduzível;
- classes fora do alvo permanecem visíveis sem gerar déficit artificial;
- `AllocationGap` continua independente de preço, ticker, Asset Master e provedores externos.

### Trade-offs

- em carteiras de valor extremamente pequeno, um bucket pode receber uma unidade mínima e outro com peso semelhante receber zero por impossibilidade física de fracionar o centavo;
- o desempate lexical é uma convenção determinística, não uma preferência econômica;
- a entrada exige agregação e valuation prévios fora deste cálculo.

## Fora de escopo

- valuation de `AssetPosition`;
- preço e FX;
- agregação de ativos em classes;
- recomendação ou distribuição de aporte;
- concentração e elegibilidade;
- unidade mínima negociável de ativos;
- custos, impostos e rebalanceamento;
- persistência, API, UI e IA.
