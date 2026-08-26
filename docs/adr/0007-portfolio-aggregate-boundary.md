# ADR-0007 — Fronteira do agregado Portfolio

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Engine precisa de uma raiz estável para identificar uma carteira antes da implementação de transações, holdings, preços, alocação alvo e rebalanceamento.

Existe um risco arquitetural importante nesta etapa: transformar `Portfolio` em um objeto que armazena simultaneamente metadados, posições, saldos e valores calculados. Isso criaria múltiplas fontes de verdade quando o transaction ledger e as projeções de holdings forem adicionados.

## Decisão

### Portfolio é um agregado mínimo de identidade e configuração

Nesta etapa, `Portfolio` contém somente:

- `PortfolioId` interno e estável;
- nome normalizado;
- `referenceCurrency`, usada como moeda de referência/consolidação da carteira.

O agregado não contém coleção de ativos, holdings, saldo de caixa, custo médio, valor de mercado ou alocação calculada.

### Identidade

- `PortfolioId` é um value object distinto de `AssetId`;
- ambos usam o mesmo contrato técnico de UUID canônico;
- a validação/normalização técnica do UUID é compartilhada internamente para evitar drift de regras;
- o helper técnico de UUID não faz parte da API pública do pacote; consumidores trabalham somente com os value objects semânticos;
- os tipos permanecem semanticamente separados e possuem erros de domínio próprios;
- geração do UUID continua fora do domínio.

### Ledger e holdings futuros

O futuro transaction ledger será a fonte histórica de eventos que alteram posição e caixa. Holdings, saldos e custo médio serão projeções derivadas desse histórico conforme regras explícitas.

Por consequência:

- `Portfolio` não duplica posições derivadas;
- adicionar uma transação não deverá exigir mutar uma lista de holdings persistida dentro do agregado;
- reconstrução e auditoria poderão partir do ledger;
- snapshots de recomendações e análises poderão referenciar uma versão/projeção sem modificar a identidade do Portfolio.

### Moeda de referência

`referenceCurrency` reutiliza `CurrencyCode`. Ela informa a moeda na qual a carteira será consolidada/apresentada, mas não executa conversão cambial.

FX, fonte da cotação, `asOf` e políticas de conversão permanecem fora desta etapa.

### Snapshot

`PortfolioSnapshot` serializa apenas:

- `id`;
- `name`;
- `referenceCurrency`.

Todos os campos possuem representação textual determinística. `fromSnapshot` reutiliza as mesmas invariantes de criação, evitando uma rota de hidratação que contorne o domínio.

## Consequências positivas

- uma única fonte de verdade poderá existir para movimentações futuras;
- o agregado permanece pequeno e auditável;
- holdings não ficam dessincronizados de transações;
- identidade não depende de nome, usuário ou infraestrutura;
- persistência futura pode hidratar o agregado sem bypass de invariantes.

## Trade-offs

- consultas de posição exigirão projeções próprias quando o ledger existir;
- o agregado, isoladamente, não responde perguntas como valor total ou composição atual;
- ownership/autorização de usuário precisará ser modelado em camada apropriada posteriormente;
- mudar a moeda de referência futuramente exigirá uma operação de domínio explícita se o produto permitir essa edição.
