# ADR-0008 — Transaction Ledger como fatos imutáveis e precisão de quantidade

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Engine precisa registrar compras, vendas e fluxos de caixa antes de calcular holdings, custo médio, P&L ou valor de mercado. Se a primeira versão persistir diretamente posição atual, saldo ou custo médio, o sistema terá estado derivado sem uma fonte histórica auditável.

Também precisamos representar quantidades fracionárias de ativos sem `number` binário. A necessidade inclui ações fracionárias em mercados que permitam, fundos e criptoativos com várias casas decimais.

## Decisão

### Ledger registra fatos, não projeções

`Transaction` é imutável e contém somente o fato ocorrido:

- `TransactionId` interno e estável;
- `PortfolioId`;
- tipo da movimentação;
- instante efetivo em UTC canônico;
- magnitude monetária de liquidação (`settlementAmount`);
- `AssetId` e quantidade somente quando a movimentação é uma negociação de ativo.

Holdings, saldo de caixa, custo médio, P&L, valor de mercado e alocação atual não são persistidos dentro da transação nem do agregado `Portfolio` nesta etapa.

### Taxonomia mínima e direção explícita

A primeira taxonomia contém somente:

- `BUY`;
- `SELL`;
- `CASH_IN`;
- `CASH_OUT`.

O sentido econômico é expresso pelo tipo, não pelo sinal do valor ou da quantidade. Portanto:

- quantidade de compra/venda é sempre positiva;
- `settlementAmount` é sempre uma magnitude monetária positiva;
- `BUY` e `CASH_OUT` representam saída de caixa;
- `SELL` e `CASH_IN` representam entrada de caixa.

Dividendos, juros, taxas, impostos, transferências e corporate actions não são encaixados artificialmente nesses tipos. Eles ganharão contratos próprios quando entrarem no escopo.

### Semântica de `settlementAmount`

`settlementAmount` representa a magnitude do caixa efetivamente associado ao fato registrado, na moeda original da movimentação. Ele não é preço unitário e o domínio não calcula `quantidade × preço` nesta etapa.

A moeda da movimentação pode ser diferente da `referenceCurrency` do Portfolio. Conversão cambial, fonte de FX e consolidação ficam para projeções posteriores.

### Precisão de quantidade

`AssetQuantity` usa inteiro `bigint` escalado em **12 casas decimais**.

O value object pertence à fronteira de `asset`, e não à de `transaction`, porque quantidade é conceito compartilhado por transações, posições e futuras projeções. Isso evita que módulos de posição dependam do ledger apenas para reutilizar um tipo numérico.

Regras:

- zero é uma quantidade válida como value object, útil para projeções futuras;
- quantidade negativa é inválida;
- compra/venda exige quantidade estritamente maior que zero;
- entrada decimal é textual (`string`), nunca `number`;
- notação científica e vírgula decimal não são aceitas;
- valores com mais de 12 casas são rejeitados, **não arredondados**;
- snapshots persistem `scaledUnits` como string inteira.

A escolha por rejeitar excesso de precisão evita alterar silenciosamente um fato de corretora/provedor.

### Tempo

`TransactionTimestamp` aceita somente instante UTC canônico no formato produzido por `Date#toISOString`, por exemplo:

```text
2026-08-26T12:30:45.123Z
```

Offsets, datas sem horário e representações não canônicas são rejeitados. Adaptadores externos serão responsáveis por converter timestamps de origem para este contrato.

### Snapshot

O snapshot é determinístico e contém somente:

- IDs internos;
- tipo;
- timestamp canônico;
- `MoneySnapshot`;
- `AssetId` ou `null`;
- `AssetQuantitySnapshot` ou `null`.

`fromSnapshot` passa novamente pelas invariantes do domínio.

## Consequências positivas

- histórico auditável antes de qualquer projeção;
- nenhuma dependência de ticker, corretora ou fornecedor na identidade do ledger;
- sem drift de ponto flutuante em quantidade;
- direção econômica explícita;
- transações multimoeda podem ser preservadas sem conversão prematura;
- futuras holdings podem ser reconstruídas a partir dos fatos;
- quantidade pode ser reutilizada por ledger e posições sem acoplamento invertido.

## Trade-offs

- a aplicação ainda não consegue mostrar posição atual sem a próxima camada de projeção;
- 12 casas são uma política explícita e podem exigir evolução se uma fonte legítima demandar mais precisão;
- taxas e corporate actions ainda não possuem representação própria;
- ordem de eventos com o mesmo timestamp exigirá critério determinístico adicional quando a projeção necessitar disso;
- correção/cancelamento de fatos exigirá estratégia própria de reversão/auditoria em etapa futura, em vez de mutação silenciosa do histórico.
