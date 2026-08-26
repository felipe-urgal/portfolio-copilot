# ADR-0009 — Posições atuais como projeção determinística do ledger

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Transaction Ledger já registra compras, vendas e fluxos de caixa como fatos imutáveis. A próxima necessidade do Portfolio Engine é reconstruir a quantidade atual de cada ativo em uma carteira sem gravar uma segunda fonte de verdade para holdings.

A projeção precisa preservar a precisão de `AssetQuantity`, isolar portfolios, tratar vendas inválidas explicitamente e ter uma regra de ordenação reproduzível. O modelo atual possui `occurredAt`, mas não possui número de sequência da corretora nem outro campo que determine uma ordem econômica total quando dois fatos compartilham exatamente o mesmo timestamp.

## Decisão

### Projeção pura e sem persistência

`projectAssetPositions` recebe um `PortfolioId` e uma sequência de `Transaction` e devolve somente posições abertas derivadas daqueles fatos.

A projeção:

- não altera `Portfolio` nem `Transaction`;
- não persiste holdings;
- não usa ticker, preço, custo médio, P&L, FX ou dados externos;
- ignora `settlementAmount`, pois esta etapa calcula somente quantidade;
- usa `AssetId` como identidade da posição;
- usa `AssetQuantity` como contrato único de precisão.

`BUY` soma quantidade e `SELL` subtrai quantidade usando os `scaledUnits` exatos de `AssetQuantity`. Não existe arredondamento novo nesta projeção.

`CASH_IN` e `CASH_OUT` não alteram posição de ativo.

### Isolamento por portfolio

Fatos de outros portfolios são filtrados antes da projeção. Uma venda inválida em outra carteira, portanto, não pode contaminar nem bloquear o resultado da carteira consultada.

### Ordem dos fatos

A ordem canônica da projeção é:

1. `occurredAt` crescente;
2. quando dois fatos possuem exatamente o mesmo `occurredAt`, preservar a ordem em que foram fornecidos na sequência de entrada.

A segunda regra é deliberada. `TransactionId` é identidade opaca e não será usado como falsa evidência de cronologia.

Enquanto o ledger não possuir um campo de sequência econômica, o chamador é responsável por fornecer fatos com mesmo timestamp na ordem autoritativa disponível. A mesma sequência de entrada sempre produz o mesmo resultado. Se uma integração futura trouxer um número de sequência confiável, o contrato de ordenação deve evoluir explicitamente em nova decisão.

### Venda acima da posição

Short selling e margem estão fora do escopo atual. Portanto, um `SELL` cuja quantidade exceda a posição disponível naquele ponto da ordem canônica lança `InsufficientAssetPositionError`.

O erro registra:

- `PortfolioId`;
- `AssetId`;
- `TransactionId` que violou a invariante;
- quantidade disponível;
- quantidade solicitada para venda.

A projeção nunca devolve quantidade negativa silenciosamente.

### Posições zeradas

Quando uma venda total reduz a quantidade a zero, o ativo é removido do resultado de posições abertas. O histórico da posição encerrada continua preservado integralmente no ledger, que permanece a fonte de verdade auditável.

### Ordem do resultado

O resultado é ordenado lexicalmente por `AssetId`. Isso evita que a ordem de iteração de estruturas internas ou a ordem de chegada de ativos vire comportamento observável acidental.

## Consequências positivas

- holdings atuais podem ser reconstruídos a qualquer momento a partir do ledger;
- nenhuma duplicação de estado atual em `Portfolio` ou `Transaction`;
- precisão idêntica à de `AssetQuantity`, sem `float` ou arredondamento adicional;
- portfolios não se misturam;
- vendas impossíveis falham de forma tipada e auditável;
- resultado não depende de ticker, fornecedor ou preço;
- execução repetida com a mesma sequência é reproduzível.

## Trade-offs

- reconstruir posições percorre os fatos do portfolio; snapshots/materialização para desempenho ficam para uma etapa futura e nunca substituem o ledger como fonte de verdade;
- fatos com timestamp idêntico ainda dependem de uma ordem de entrada autoritativa, pois o domínio não inventa cronologia a partir de UUID;
- a projeção atual representa somente posições long abertas; short selling, margem e empréstimo de ativos exigirão uma política própria;
- posições encerradas não aparecem no resultado atual, embora permaneçam recuperáveis pelo histórico do ledger.
