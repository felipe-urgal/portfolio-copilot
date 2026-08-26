# ADR-0014 — Restrições de execução do aporte usam AssetId, elegibilidade explícita e quantidade mínima exata

**Status:** Aceita

**Data:** 2026-08-26

## Contexto

O `ContributionAllocator` e a política de microaporte já produzem uma distribuição monetária determinística por `AssetClass`. Antes de transformar essa intenção econômica em uma recomendação por ativo, o domínio precisa representar se o destino previamente escolhido pode receber aporte e qual é sua unidade mínima negociável.

Essa etapa não possui preço, FX, lote de corretora ou ranking de ativos. Portanto, converter `Money` em quantidade ou escolher um ticker dentro da classe criaria uma dependência externa e misturaria responsabilidades que ainda não pertencem ao cálculo puro.

## Decisão

Criar `applyContributionExecutionConstraints` no módulo `contribution` como camada pura posterior ao `ContributionPlan`.

A entrada recebe:

- o `ContributionPlan` já calculado e, quando aplicável, já filtrado pela política de microaporte;
- um destino previamente escolhido por `AssetClass` que possua alocação positiva;
- `AssetId` como identidade do ativo;
- elegibilidade explícita (`isEligible`);
- `minimumTradableQuantity` usando `AssetQuantity` ou representação decimal convertida para esse tipo exato.

A camada não seleciona nem ranqueia ativos. Exatamente um destino pode ser associado a cada `AssetClass` dentro da entrada; múltiplos destinos para a mesma classe seriam uma decisão de seleção que pertence a uma etapa futura.

## Elegibilidade

Para cada alocação monetária positiva do plano:

- um destino correspondente é obrigatório;
- se o destino for elegível, a mesma alocação monetária é preservada no plano de execução;
- se o destino for inelegível, nenhuma recomendação por ativo é emitida para aquela alocação;
- o valor bloqueado permanece em `unallocatedContribution`;
- não há redistribuição posterior para outra classe, pois isso alteraria silenciosamente a decisão econômica já tomada pelo allocator/policy.

Alocações monetárias iguais a zero não exigem destino de execução.

## Unidade mínima negociável

`minimumTradableQuantity` reutiliza `AssetQuantity`, que usa `bigint` escalado em 12 casas decimais e não aceita precisão excedente nem valores negativos.

Neste contrato, a quantidade mínima também precisa ser estritamente maior que zero. Zero, valor negativo ou shape decimal inválido são rejeitados por erro tipado.

A quantidade mínima é carregada como restrição para a etapa seguinte; ela não é convertida para valor monetário aqui.

Sem preço não é possível afirmar se, por exemplo, R$ 100 compram 1 ação ou 0,001 unidade de outro ativo. O futuro cálculo de quantidade/preço deverá consumir essa restrição sem modificar retroativamente a necessidade pós-aporte.

## Identidade

O contrato usa `AssetId` como identidade. Ticker, símbolo de mercado e provider ID não participam da chave de destino.

Dois ativos continuam distintos quando possuem `AssetId` diferentes, mesmo que futuramente compartilhem um símbolo em contextos distintos.

## Validações

São rejeitados explicitamente:

- destino duplicado por `AssetId`;
- mais de um destino para a mesma `AssetClass`;
- elegibilidade com shape não booleano em runtime;
- quantidade mínima zero, negativa ou inválida;
- alocação monetária positiva sem destino correspondente.

`AssetId` e `AssetClass` inválidos continuam reutilizando seus erros tipados de domínio.

## Precisão e determinismo

- nenhum cálculo de quantidade usa `number` binário;
- a alocação monetária recebida não é recalculada;
- nenhuma conversão `Money ↔ AssetQuantity` ocorre nesta etapa;
- a ordem de saída segue a ordem determinística do `ContributionPlan`;
- a saída é imutável;
- mesma entrada produz o mesmo resultado.

## Consequências

### Positivas

- separa decisão econômica de restrição operacional;
- evita buscar preço ou dados externos dentro do domínio puro;
- mantém sobra de caixa explícita quando um destino não pode receber aporte;
- carrega quantidade mínima com precisão suficiente para ativos fracionários;
- preserva `AssetId` como identidade estável sem depender de ticker.

### Trade-offs

- a camada ainda não afirma que a alocação monetária compra a quantidade mínima;
- seleção/ranking entre múltiplos ativos da mesma classe permanece futura;
- preço, lote real de mercado e regras específicas de corretora ainda precisam alimentar etapas posteriores.

## Fora de escopo

- preço em tempo real e valuation;
- FX;
- seleção/ranking de ticker ou ativo dentro da classe;
- integração com corretora e execução de ordens;
- limites de concentração;
- custos e impostos;
- venda/rebalanceamento;
- persistência, API, UI e IA.

## Próximo passo

Adicionar limites de concentração configuráveis (`softMaxWeight`/`hardMaxWeight`) como restrições do Portfolio Engine, preservando a prioridade por novos aportes e as camadas determinísticas já estabelecidas.
