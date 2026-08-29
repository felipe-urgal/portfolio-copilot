# ADR-0023 — Market Data com provenance, freshness e fallback explícito

- **Status:** Aceita
- **Data:** 2026-08-29

## Contexto

O Asset Master canônico resolve identidade de instrumentos, mas decisões de carteira, valuation e Investment Engine também dependem de dados externos mutáveis. Preço, FX e macro podem estar ausentes, atrasados, conflitantes ou indisponíveis por falha de provider.

Tratar esses dados como números soltos permitiria apresentar informação velha como atual, perder origem e esconder degradações. O domínio financeiro também não deve depender de SDKs ou formatos específicos de fornecedor.

## Decisão

Criar `@portfolio-copilot/market-data` como fronteira própria entre domínio e infraestrutura externa.

### Snapshots materiais

Todo snapshot de preço, FX ou macro carrega:

- identidade canônica do dado;
- valor decimal exato, sem conversão por `number`;
- `asOf`;
- `retrievedAt`;
- provenance;
- quality flags.

Preço usa decimal textual exato + moeda. `Money` continua adequado para valores monetários do domínio, mas não limita a precisão de cotações de mercado a duas casas decimais.

### Provenance

Provenance registra provider, `sourceId`, `sourceUrl` quando aplicável, `rawIdentifier` e `normalizationVersion`. O snapshot não depende do payload bruto do provider para ser auditável.

### Freshness e qualidade

Freshness é uma política explícita por categoria, em TTL. Um snapshot pode ser:

- `FRESH`;
- `STALE`;
- `FUTURE` quando o `asOf` está à frente do relógio de avaliação.

`FUTURE` produz conflito de qualidade; não é convertido em dado fresco. `CONFLICT` pode coexistir com `STALE`.

Ausência não é um snapshot falso: providers retornam `MISSING`. Falha operacional retorna `PROVIDER_ERROR`.

### Cache

Cache e freshness são conceitos independentes. O cache inicial é in-memory, com TTL e invalidação explícitos. Um cache hit não remove flags de qualidade nem torna um snapshot atual.

### Fallback

Fallback é ordenado e opt-in. A política declara se pode continuar após `MISSING`, `PROVIDER_ERROR` ou ambos. Cada tentativa é registrada no resultado operacional. Nenhum provider secundário é usado por heurística silenciosa.

### Adapters

Interfaces públicas:

- `PriceProvider`;
- `FxProvider`;
- `MacroProvider`.

Adapters iniciais:

- `InMemoryPriceProvider` como referência determinística e substituível para preço;
- `BcbSgsMacroProvider` usando por padrão a série SGS 432 — Meta Selic;
- `BcbSgsFxProvider` usando por padrão a série SGS 1 para `USD/BRL` venda.

O client HTTP do BCB é injetável, permitindo contract tests sem rede e sem mock global.

### Semântica temporal do SGS

O SGS devolve referência diária em `DD/MM/YYYY`, sem horário de publicação no payload usado. O adapter normaliza essa data para `00:00:00.000Z` exclusivamente como representação canônica da **data de referência**. Não inventa horário de publicação. `retrievedAt` permanece o instante real de coleta.

### Observabilidade

A telemetria padrão contém apenas categoria, provider, outcome, tentativa e duração. Valores financeiros, `AssetId`, payload bruto, tokens, headers, query sensível e mensagens externas não sanitizadas ficam fora do evento operacional.

Falha do observer não pode transformar um caminho de dados bem-sucedido em falha de produto.

### Licenciamento

Os datasets BCB selecionados são documentados pelo Portal de Dados Abertos do BCB sob ODbL. Essa informação é registrada em `docs/DATA-SOURCES.md` e não substitui revisão jurídica futura para redistribuição/comercialização.

Nenhum provider externo de preço é adotado para produção nesta etapa sem revisão explícita de licença, cobertura, corporate actions, SLA e custo.

## Consequências positivas

- dado material sempre preserva origem e tempo de referência;
- stale, futuro, ausência e falha de provider ficam explícitos;
- providers são substituíveis e testáveis por contrato;
- fallback não mascara indisponibilidade por padrão;
- precisão de preço não é reduzida ao scale de `Money`;
- integração BCB não contamina o domínio com formato ou SDK externo;
- observabilidade nasce com superfície mínima de dados.

## Trade-offs

- consumidores precisam tratar estados de qualidade e falha explicitamente;
- cache inicial não é distribuído;
- `InMemoryPriceProvider` não é fonte de produção;
- o adapter SGS trabalha com referência diária, não horário de publicação;
- outros pares de FX e indicadores exigem configuração ou adapters adicionais.

## Fora de escopo

- provider comercial de preços;
- fundamentals e valuation;
- armazenamento histórico massivo de séries;
- cache distribuído;
- execução de ordens;
- matching probabilístico de ativos.
