# Próxima Atividade — Produto MVP: Asset local e BUY/SELL no Transaction Ledger

**Status:** READY após merge do cadastro local de `CASH_IN`/`CASH_OUT`.

## Objetivo

Completar o primeiro fluxo de transações com ativo do MVP, permitindo cadastrar um `Asset` mínimo na mesma sessão, selecioná-lo por uma interface humana e registrar `BUY`/`SELL` no Transaction Ledger sem expor UUID interno como UX principal nem criar holdings editáveis.

## Escopo

- evoluir `/portfolio` para manter um catálogo local/efêmero de ativos da sessão;
- criar `Asset` mínimo reutilizando `Asset`, `AssetId`, `AssetClass`, `InstrumentType` e `CurrencyCode` existentes no domínio;
- permitir selecionar um ativo cadastrado por nome/contexto visível, mantendo `AssetId` apenas como identidade interna;
- liberar `BUY` e `SELL` somente para um ativo real selecionado;
- reutilizar `Transaction`, `TransactionId`, `TransactionType`, `TransactionTimestamp`, `Money` e `AssetQuantity` para os fatos do ledger;
- manter valores monetários e quantidades como strings na UI até passarem pelos Value Objects, sem conversão por `number` binário;
- preservar `CASH_IN`/`CASH_OUT` já disponíveis;
- projetar posições exclusivamente com `projectAssetPositions` a partir do ledger local completo;
- mostrar quantidade real derivada por ativo sem inventar preço, valor de mercado, custo médio ou P&L;
- traduzir erros tipados do domínio/projeção para feedback acessível sem duplicar invariantes;
- manter carteira, ativos, ledger e posições explicitamente locais/efêmeros;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para cadastro/seleção de Asset, BUY/SELL, quantidade, vínculo ao portfolio e projeção de posições.

## Fora de escopo

- catálogo remoto/Asset Master, busca por ticker ou integração com provedores;
- preço, cotação, Market Data, FX ou benchmarks;
- custo médio, P&L ou patrimônio de mercado;
- holdings/posições editáveis diretamente;
- TargetAllocation e comparação atual versus alvo;
- cálculo de aporte;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação/IA.

## Critérios de aceite

- um `Asset` local validado pode ser criado sem depender de API ou Market Data;
- `BUY`/`SELL` exigem seleção de um Asset real e nunca pedem UUID como campo primário ao usuário;
- cada transação de ativo pertence ao `PortfolioId` correto e usa o `AssetId` selecionado;
- quantidade passa por `AssetQuantity` e settlement por `Money`, sem `number` binário;
- timestamp, identidade, tipo e shape passam pelos contratos existentes do domínio;
- `projectAssetPositions` é a única fonte para posições atuais derivadas do ledger;
- `CASH_IN`/`CASH_OUT` continuam sem alterar posições de ativos;
- venda acima da posição disponível produz feedback explícito a partir do erro tipado da projeção;
- a interface mostra quantidade derivada, mas não inventa preço, valor, custo médio ou P&L;
- todo o estado continua local/efêmero e essa limitação permanece explícita;
- testes cobrem sucesso, erros, associação portfolio/asset, cash flows e projeção de posições;
- nenhuma nova fórmula financeira, persistência, API ou integração externa é introduzida;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: carteira -> cadastro de transações -> aporte do mês;
- `docs/ARCHITECTURE.md` — Transaction Ledger como fonte histórica de verdade;
- `docs/adr/0006-asset-identity-and-taxonomy.md` — identidade e taxonomias de Asset;
- `docs/adr/0008-transaction-ledger-facts-and-precision.md` — semântica, precisão e shape das transações;
- `docs/adr/0009-asset-position-projection.md` — posições derivadas do ledger;
- `packages/domain/src/asset/asset.ts` — contrato atual de `Asset`;
- `packages/domain/src/transaction/transaction.ts` — contrato atual de `Transaction`.
