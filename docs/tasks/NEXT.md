# Próxima Atividade — Portfolio Engine: AllocationGap

**Status:** READY após merge de TargetAllocation.

## Objetivo

Calcular gaps monetários por `AssetClass` a partir de uma `TargetAllocation` e de valores atuais por bucket já normalizados, com precisão e arredondamento explícitos, sem buscar preços, agregar posições nem distribuir o aporte.

## Escopo

- estrutura derivada de `AllocationGap` por `AssetClass`;
- entrada vinculada ao mesmo `PortfolioId` da `TargetAllocation`;
- valores atuais por bucket usando `Money` em moeda única;
- total da carteira/base de cálculo explícito e reconciliado com os buckets de entrada;
- cálculo determinístico de valor-alvo por peso;
- política explícita de arredondamento ao aplicar `AllocationWeight` sobre `Money`;
- gap positivo como diferença entre valor-alvo e valor atual, sem valor negativo silencioso;
- classes-alvo ausentes na posição atual tratadas como valor atual zero;
- classes atuais sem peso-alvo tratadas explicitamente como alvo zero;
- saída ordenada/determinística e testes de invariantes;
- documentação da fronteira entre `AllocationGap` e o futuro `ContributionAllocator`.

## Fora de escopo

- buscar preço ou FX;
- converter `AssetPosition` em valor de mercado;
- agregar ativos em classes a partir do Asset Master;
- decidir quanto aportar;
- `ContributionAllocator`;
- `minimumMeaningfulContribution`;
- limite de destinos por aporte;
- unidade mínima negociável;
- `softMaxWeight`/`hardMaxWeight`;
- custos, impostos e rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- cálculo pertence inequivocamente ao mesmo `PortfolioId` da política-alvo;
- todos os valores monetários usam `Money` e a mesma moeda;
- nenhuma aritmética financeira usa `number` binário;
- política de aplicação do peso e arredondamento é explícita, auditável e testada;
- buckets atuais duplicados ou inconsistentes não são aceitos silenciosamente;
- total informado e valores por bucket seguem uma política de reconciliação explícita;
- gap nunca fica negativo: bucket acima do alvo possui gap zero;
- não existe dependência de provedor, preço, ticker ou dado externo dentro do cálculo;
- execução repetida com a mesma entrada produz a mesma saída;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- carteira com um único bucket exatamente no alvo;
- bucket abaixo do alvo;
- bucket acima do alvo com gap zero;
- múltiplos buckets;
- classe-alvo sem valor atual;
- classe atual sem peso-alvo;
- valores em moedas diferentes rejeitados;
- bucket atual duplicado rejeitado;
- total/base incompatível com os buckets conforme política definida;
- caso que force arredondamento monetário de peso;
- portfolios diferentes rejeitados quando combinados;
- ordem e resultado reproduzíveis.
