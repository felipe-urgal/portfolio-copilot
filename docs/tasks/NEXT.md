# Próxima Atividade — Portfolio Engine: Transaction Ledger e quantidade de ativo

**Status:** READY após merge do agregado Portfolio mínimo.

## Objetivo

Criar os value objects e eventos mínimos para registrar movimentações de ativos de forma auditável, sem ainda calcular holdings ou custo médio. A etapa deve estabelecer a fonte histórica que futuras projeções de posição consumirão.

## Escopo

- representação decimal segura de quantidade de ativo, separada de `Money`;
- política explícita de precisão e arredondamento para quantidade;
- `TransactionId` interno e estável;
- eventos/transações imutáveis vinculados a `PortfolioId` e, quando aplicável, `AssetId`;
- taxonomia mínima de movimentações necessária para compras, vendas e fluxos de caixa, sem antecipar regras tributárias;
- valor monetário usando `Money` quando semanticamente aplicável;
- instante/data efetiva da movimentação com contrato determinístico;
- snapshots persistíveis e erros de domínio tipados;
- testes de invariantes e documentação das decisões.

## Fora de escopo

- cálculo de holdings/posição atual;
- custo médio e P&L;
- preço de mercado/fundamentals;
- FX automático;
- impostos e DARF;
- corporate actions complexas;
- importação de corretora/Open Finance;
- banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- quantidade de ativo não reutiliza `Money` nem depende de `number` binário para persistência;
- identidade da transação é independente de corretora/provedor;
- transações referenciam `PortfolioId`/`AssetId`, não nomes ou tickers;
- sinal econômico não é inferido silenciosamente de números negativos quando a taxonomia puder torná-lo explícito;
- eventos persistíveis possuem representação determinística;
- nenhum tipo depende de Next.js, banco ou fornecedor externo;
- `pnpm check` passa integralmente;
- decisões de precisão e taxonomia ficam registradas em ADR quando necessário.

## Casos de teste mínimos

- quantidade zero, positiva, precisão fracionária e valores inválidos;
- criação de compra e venda válidas;
- IDs inválidos;
- portfolio/asset inválidos;
- moeda incompatível quando uma operação combinar valores monetários;
- datas/instantes inválidos;
- snapshot round-trip;
- nenhuma projeção de holding é persistida dentro da transação ou do Portfolio.
