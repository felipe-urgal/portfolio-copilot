# Próxima Atividade — Produto MVP: cadastro local do Transaction Ledger

**Status:** READY após merge da carteira base com cadastro local do Portfolio.

## Objetivo

Adicionar o primeiro fluxo de transações do MVP sobre o `Portfolio` criado localmente, mantendo o Transaction Ledger como fonte histórica de verdade e sem transformar posições, saldos ou holdings em estado editável paralelo.

## Escopo

- evoluir a experiência local de `/portfolio` para registrar transações vinculadas ao `PortfolioId` criado na mesma sessão;
- reutilizar `Transaction`, `TransactionId`, `TransactionType`, `TransactionTimestamp` e `Money` existentes no domínio;
- começar por `CASH_IN` e `CASH_OUT`, que não dependem de catálogo/cadastro de ativos;
- manter `BUY` e `SELL` explicitamente indisponíveis enquanto não houver uma forma de selecionar um `AssetId` real sem expor UUID interno como UX principal;
- manter a lista de transações local/efêmera e deixar essa limitação explícita;
- renderizar snapshots reais do ledger criado, sem recalcular ou reinterpretar fatos na camada web;
- preservar o estado de posições como vazio quando existirem apenas fluxos de caixa;
- traduzir erros tipados do domínio para feedback acessível sem duplicar invariantes de transação;
- preservar navegação, foco, semântica e responsividade desktop/mobile;
- adicionar testes para criação de cash flows, validação, associação ao portfolio, estado local e ausência de posições fictícias.

## Fora de escopo

- `BUY`/`SELL` antes de existir seleção real de `Asset`;
- cadastro manual de holdings ou posições;
- custo médio, P&L, patrimônio de mercado, preço ou cotação;
- TargetAllocation e comparação atual versus alvo;
- cálculo de aporte;
- persistência/API/Server Actions;
- autenticação/autorização;
- Market Data, FX ou benchmarks;
- recomendação/IA.

## Critérios de aceite

- um `Portfolio` validado na sessão pode receber `CASH_IN` e `CASH_OUT` locais;
- cada transação reutiliza os contratos de domínio e pertence ao `PortfolioId` correto;
- valor monetário permanece baseado em `Money`, sem conversão por `number` binário;
- timestamp e identidade passam pelos Value Objects existentes;
- snapshots apresentados correspondem às `Transaction` validadas pelo domínio;
- `BUY`/`SELL` não pedem UUID interno de ativo como fluxo de usuário e aparecem como capacidade ainda indisponível;
- cash flows não produzem posições de ativos nem holdings fictícios;
- a interface informa que portfolio e ledger continuam sem persistência;
- testes cobrem sucesso, erros, vínculo com portfolio, cash flows e estados honestos;
- nenhuma nova fórmula financeira, persistência, API ou integração externa é introduzida;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: carteira -> cadastro de transações -> aporte do mês;
- `docs/ARCHITECTURE.md` — Transaction Ledger como fonte histórica de verdade;
- `docs/adr/0008-transaction-ledger-facts-and-precision.md` — semântica, precisão e shape das transações;
- `docs/adr/0009-asset-position-projection.md` — posições derivadas do ledger, não editáveis diretamente;
- `packages/domain/src/transaction/transaction.ts` — contrato atual de `Transaction`.
