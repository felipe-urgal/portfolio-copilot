# Próxima Atividade — Portfolio Engine: ContributionAllocator

**Status:** READY após merge de AllocationGap.

## Objetivo

Distribuir deterministicamente um aporte monetário entre `AssetClass` usando a política-alvo e o estado atual já normalizado, priorizando necessidades pós-aporte sem ultrapassar o valor disponível, sem ainda aplicar limites de concentração, lote mínimo ou heurísticas de microaporte.

## Escopo

- estrutura derivada de `ContributionAllocation` por `AssetClass`;
- aporte disponível usando `Money` e a mesma moeda da carteira;
- entrada vinculada a um único `PortfolioId`;
- reutilização de `TargetAllocation`/`AllocationGap` ou de seus contratos normalizados sem buscar dados externos;
- cálculo da necessidade pós-aporte usando `portfolioValue + contribution` como nova base-alvo;
- reutilização da política de maiores restos para converter pesos em unidades monetárias mínimas;
- seleção somente de buckets com necessidade positiva pós-aporte;
- distribuição-base proporcional às necessidades positivas, com política explícita de arredondamento e reconciliação;
- soma das alocações nunca maior que o aporte disponível;
- nenhum bucket recebe mais que sua necessidade pós-aporte;
- saída ordenada/determinística e testes de invariantes;
- documentação da fronteira com políticas futuras de microaporte, concentração e unidade mínima negociável.

## Fora de escopo

- `minimumMeaningfulContribution`;
- `maxDestinationsPerContribution`;
- unidade mínima negociável de ativo;
- `softMaxWeight`/`hardMaxWeight`;
- elegibilidade por ativo;
- preço, FX ou valuation;
- seleção de ticker/ativo específico dentro da classe;
- custos e impostos;
- venda/rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- aporte, valores atuais e alocações usam `Money` e uma única moeda;
- nenhum cálculo financeiro usa `number` binário;
- necessidade pós-aporte considera explicitamente `portfolioValue + contribution`;
- buckets sem necessidade positiva não recebem aporte;
- soma das alocações é reconciliada em unidades mínimas e nunca ultrapassa o aporte;
- nenhuma alocação ultrapassa a necessidade calculada para o bucket;
- portfolio/moeda/estado atual inconsistentes são rejeitados explicitamente;
- caso sem destino elegível pelo baseline possui política explícita para sobra de caixa;
- execução repetida com a mesma entrada produz a mesma saída;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- aporte zero;
- carteira inicialmente no alvo recebendo novo aporte;
- um único bucket com necessidade;
- múltiplos buckets com necessidades positivas;
- bucket acima do alvo não recebe aporte;
- aporte menor que a soma das necessidades;
- aporte maior/igual às necessidades conforme política de sobra definida;
- caso que force arredondamento de centavos;
- moedas diferentes rejeitadas;
- portfolios diferentes rejeitados;
- resultado nunca excede aporte nem necessidade por bucket;
- ordem e resultado reproduzíveis.
