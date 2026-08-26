# ADR-0013 — Política de aporte concentra destinos e elimina microaportes

**Status:** Aceita

**Data:** 2026-08-26

## Contexto

O `ContributionAllocator` definido no ADR-0012 produz um baseline proporcional, determinístico e reconciliado por `AssetClass`. Esse baseline é matematicamente consistente, mas pode espalhar aportes pequenos por muitos destinos e gerar valores irrelevantes para execução prática.

A decisão D-012 já estabelece que o motor pode concentrar o aporte do mês em menos destinos para corrigir gaps. A política desta etapa precisa aplicar essa intenção sem alterar a fórmula de necessidade pós-aporte, sem introduzir preço/unidade negociável e sem perder as invariantes de `Money`/`bigint`.

## Decisão

Criar `applyContributionPolicy` como camada pura e separada sobre um `ContributionPlan` já calculado pelo baseline.

A configuração contém:

- `minimumMeaningfulContribution: Money` não negativo e na mesma moeda do plano;
- `maxDestinationsPerContribution: number` validado como inteiro positivo seguro.

A política não recalcula alvos nem necessidades. Ela usa `postContributionNeed` já produzido pelo `ContributionAllocator`.

## Seleção de destinos

Somente buckets com necessidade pós-aporte positiva são elegíveis.

Quando a quantidade de destinos elegíveis excede `maxDestinationsPerContribution`, a seleção é feita por:

1. maior `postContributionNeed`;
2. empate lexical por `AssetClass`.

Essa ordem é uma convenção determinística para priorizar a maior correção de gap nesta etapa; não representa recomendação sobre um ativo específico dentro da classe.

## Distribuição e mínimo significativo

Após selecionar os destinos, o aporte é redistribuído proporcionalmente às necessidades desses buckets usando a mesma política de maiores restos já adotada pelo módulo `contribution`.

Se uma alocação calculada ficar abaixo de `minimumMeaningfulContribution`, esse destino é removido da rodada e o valor é recalculado entre os destinos restantes. O processo se repete até que:

- todas as alocações positivas restantes atendam ao mínimo; ou
- nenhum destino permaneça elegível.

A política não aumenta artificialmente um microaporte apenas para atingir o mínimo. Quando não for possível distribuir todo o valor sem violar as regras, a diferença permanece em `unallocatedContribution`.

## Invariantes

- `minimumMeaningfulContribution` nunca usa `number` binário; usa `Money`;
- `maxDestinationsPerContribution` é inteiro positivo seguro;
- buckets com necessidade zero nunca recebem aporte;
- o número de alocações positivas não excede o limite configurado;
- toda alocação positiva é maior ou igual ao mínimo configurado;
- nenhuma alocação excede a necessidade pós-aporte do bucket;
- a soma das alocações nunca excede o aporte;
- reconciliação monetária usa unidades mínimas inteiras e maiores restos;
- sobra não distribuível permanece explícita;
- resultado repetido para a mesma entrada é determinístico.

## Compatibilidade com o baseline

Com `minimumMeaningfulContribution = 0` e limite maior ou igual à quantidade de destinos elegíveis, a política preserva o resultado do `ContributionAllocator`.

O baseline continua sendo API independente. Isso mantém separadas duas responsabilidades:

- `allocateContribution`: necessidade e distribuição proporcional pós-aporte;
- `applyContributionPolicy`: concentração operacional do aporte.

## Validação e erros

- mínimo negativo reutiliza `NegativeAllocationValueError`;
- moeda divergente reutiliza `CurrencyMismatchError`;
- limite zero, negativo, fracionário, não finito ou acima do inteiro seguro é rejeitado por `InvalidMaxDestinationsPerContributionError`.

## Consequências

### Positivas

- evita microaportes artificiais sem contaminar o cálculo-base;
- limita destinos de forma explícita e auditável;
- preserva centavos e determinismo;
- mantém sobra de caixa visível quando uma restrição impede distribuição integral;
- cria uma fronteira clara para futuras regras de elegibilidade e unidade mínima negociável.

### Trade-offs

- maior necessidade pós-aporte é a única prioridade econômica desta política;
- o mínimo é monetário e ainda não representa lote, preço ou quantidade mínima negociável;
- não há escolha de ativo/ticker dentro de `AssetClass`;
- não entram limites de concentração da carteira.

## Fora de escopo

- preço e FX;
- unidade mínima negociável por ativo;
- elegibilidade por ativo;
- escolha de ticker/ativo;
- `softMaxWeight`/`hardMaxWeight`;
- custos e impostos;
- venda/rebalanceamento;
- persistência, API, UI e IA.

## Próximo passo

Definir a fronteira de unidade mínima negociável e elegibilidade do aporte sem introduzir consulta externa dentro das funções puras do domínio.
