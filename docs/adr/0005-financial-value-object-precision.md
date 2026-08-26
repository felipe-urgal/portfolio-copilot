# ADR-0005 — Precisão dos value objects financeiros

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Engine precisa calcular aportes, gaps e valores históricos sem herdar drift de ponto flutuante binário. Também precisa distinguir valor monetário, percentual genérico e peso de alocação, porque esses conceitos possuem invariantes diferentes.

## Decisão

### Money

- `Money` representa valor monetário liquidado/contábil, não quantidade de ativo;
- usa `bigint` em unidades mínimas com **2 casas decimais** nesta primeira versão;
- entradas decimais são `string`, nunca `number`;
- a moeda é explícita e normalizada para três letras ASCII maiúsculas;
- soma, subtração e comparação exigem a mesma moeda;
- valores negativos são permitidos no value object porque diferenças e fluxos de caixa podem ser negativos; entidades com semântica não negativa deverão impor a restrição na própria fronteira;
- snapshots persistíveis serializam `bigint` como string inteira (`minorUnits`) para não depender de JSON com bigint nem float.

### Percentage

- `Percentage` usa `bigint` com quatro casas decimais de **pontos percentuais**;
- `Percentage` pode ser negativo ou maior que 100%, pois retorno, variação e outros indicadores possuem esses valores legitimamente;
- entrada e saída decimal usam string.

### AllocationWeight

- `AllocationWeight` encapsula `Percentage` com invariante de **0% a 100% inclusive**;
- o range é validado sobre o decimal original antes do arredondamento, evitando que `100.00001%` seja arredondado para `100.0000%` e aceito silenciosamente.

### Arredondamento

A política inicial é **half away from zero** (metade arredonda afastando-se de zero). Exemplos em Money:

```text
10.004  -> 10.00
10.005  -> 10.01
-10.004 -> -10.00
-10.005 -> -10.01
```

A implementação opera somente sobre dígitos decimais e inteiros; não converte o valor para `number` durante parsing ou arredondamento.

## Limites deliberados

- a escala monetária fixa de 2 casas atende os valores contábeis BRL/USD usados no MVP, mas não pretende modelar todas as moedas ISO com escalas diferentes;
- preços unitários de mercado que exijam precisão maior terão tipo próprio;
- quantidade de ações, cotas, títulos ou cripto terá tipo próprio e não reutilizará `Money`;
- conversão cambial não pertence a `Money`; exigirá taxa, fonte, `asOf` e política de arredondamento explícitos.

## Testes

Os testes cobrem limites, moedas incompatíveis, snapshots, arredondamento, valores assinados e soma repetida sem drift. Nesta etapa não adicionamos biblioteca property-based: os invariantes são pequenos e podem ser exercitados deterministicamente, evitando ampliar a supply chain sem benefício material. A decisão pode ser revista quando o domínio de cálculo crescer.

## Consequências

### Positivas

- cálculos monetários não dependem de IEEE-754;
- persistência futura recebe representação explícita e auditável;
- conceitos com ranges diferentes não são confundidos;
- política de arredondamento é centralizada e testada.

### Trade-offs

- APIs externas que entreguem `number` precisarão ser convertidas/validadas na camada de adapter antes de entrar no domínio;
- suporte a moedas com escala diferente de 2 exigirá evolução versionada do contrato;
- cálculos de preço, quantidade e FX exigirão value objects adicionais em vez de atalhos com `Money`.
