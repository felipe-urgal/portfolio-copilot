# Próxima Atividade — Portfolio Engine: projeção de posições por ativo

**Status:** READY após merge do Transaction Ledger.

## Objetivo

Criar a primeira projeção derivada do ledger: calcular a quantidade atual por `AssetId` dentro de um `PortfolioId` a partir de transações `BUY` e `SELL`, sem persistir posição duplicada e sem calcular custo médio, P&L ou valor de mercado.

## Escopo

- `AssetPosition`/estrutura equivalente com `AssetId` e quantidade atual;
- projetor determinístico de posições a partir de uma sequência de `Transaction`;
- compras aumentam quantidade;
- vendas reduzem quantidade;
- `CASH_IN`/`CASH_OUT` não alteram posição de ativo;
- filtro/isolamento por `PortfolioId`;
- política explícita para venda acima da posição disponível;
- ordenação/entrada de eventos documentada quando necessária;
- resultado sem ticker, preço ou dados externos;
- testes de invariantes e documentação da decisão.

## Fora de escopo

- custo médio;
- preço médio tributário;
- P&L realizado/não realizado;
- saldo de caixa;
- valor de mercado;
- FX;
- dividendos, taxas e impostos;
- short selling/margem;
- persistência de projeções;
- banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- posição é derivada exclusivamente de fatos do ledger;
- nenhuma posição atual é gravada dentro de `Portfolio` ou `Transaction`;
- operações de portfolios diferentes não se misturam;
- resultado usa `AssetId`, não ticker;
- quantidade mantém a mesma precisão exata de `AssetQuantity`;
- venda que levaria posição abaixo de zero é tratada explicitamente, sem valor negativo silencioso;
- execução repetida com a mesma entrada produz o mesmo resultado;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- portfolio sem transações;
- uma compra;
- múltiplas compras do mesmo ativo;
- compra seguida de venda parcial;
- venda total zerando posição;
- tentativa de venda acima da posição;
- múltiplos ativos;
- transações de portfolios diferentes;
- fluxos de caixa ignorados na posição de ativo;
- ordem determinística e resultados reproduzíveis.
