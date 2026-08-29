# ADR-0022 — Asset Master canônico e resolução de identidade

- **Status:** Aceita
- **Data:** 2026-08-29

## Contexto

O ADR-0006 definiu `AssetId` como identidade interna opaca e estável, independente de ticker, bolsa, corretora ou provedor. A Fase 4 de Market Data precisa agora reconciliar identificadores externos sem enfraquecer essa decisão.

Tickers podem mudar ou ser reutilizados, um mesmo instrumento pode possuir identificadores em vários provedores e dados externos podem conflitar. Portanto, correspondência por nome, ticker isolado ou heurística fuzzy não é segura o suficiente para criar identidade canônica silenciosamente.

## Decisão

Criar um Asset Master determinístico no módulo de ativos do domínio, preservando `Asset` como entidade básica e adicionando `AssetCatalogEntry` como representação canônica de catálogo.

### Identidade canônica

- `AssetId` continua sendo a única identidade de domínio;
- ticker, exchange, ISIN e provider IDs são evidências externas e nunca substituem `AssetId`;
- `AssetClass` continua representando exposição econômica;
- `InstrumentType` continua representando veículo/instrumento;
- o catálogo pode associar múltiplos identificadores e múltiplos provedores ao mesmo `AssetId`.

### Listings e mudanças de ticker

Ticker é representado como listing explícito com exchange e estado `CURRENT` ou `HISTORICAL`.

- listings atuais podem aparecer em `Asset.externalIdentifiers` como identificadores externos correntes;
- aliases/listings históricos permanecem no catálogo e não são expostos como identificadores correntes do `Asset`;
- listings históricos continuam disponíveis como evidência de resolução para preservar mudanças de ticker;
- ticker reutilizado por mais de um `AssetId` produz conflito em resolução sem contexto temporal;
- resolução por `asOf` para desambiguar reutilização histórica fica para uma evolução específica.

### Metadados canônicos

O catálogo adiciona, quando disponíveis:

- país em código alpha-2 normalizado;
- moeda de referência herdada do `Asset`;
- exchange por listing;
- status do ativo: `ACTIVE`, `INACTIVE` ou `DELISTED`;
- identificadores externos;
- provenance por identificador/listing.

Nesta etapa, país valida apenas o formato alpha-2. Validação contra uma tabela ISO completa pode ser adicionada quando houver uma fonte canônica versionada.

### Provenance

Cada identificador externo ou listing exige ao menos uma evidência de provenance contendo:

- `provider`;
- `sourceId` quando disponível;
- `retrievedAt` em UTC canônico;
- `normalizationVersion`;
- `rawValue` quando útil para auditoria.

Provenance duplicada é deduplicada e ordenada deterministicamente.

### Matching e deduplicação

O adapter inicial usa somente igualdade exata de identificadores normalizados. Não existe fuzzy match por nome, ticker ou similaridade textual.

A resolução possui quatro resultados explícitos:

- `UNMATCHED`: nenhuma evidência conhecida;
- `PARTIAL_MATCH`: evidências conhecidas convergem para um único `AssetId`, mas existe ao menos um identificador fornecido sem correspondência;
- `MATCH`: todas as evidências fornecidas possuem correspondência e convergem para um único `AssetId`;
- `CONFLICT`: as evidências apontam para mais de um `AssetId`, inclusive quando um identificador externo foi associado a múltiplos ativos.

Somente `MATCH` representa correspondência completa. `PARTIAL_MATCH` exige reconciliação adicional e não deve ser promovido automaticamente a deduplicação definitiva.

Conflitos de identificador entre ativos são mantidos no catálogo em vez de impedirem a construção do adapter. Isso permite detectar, inspecionar e auditar inconsistências de fonte sem escolher um vencedor silenciosamente.

### Adapter inicial

`InMemoryAssetCatalogAdapter` é o adapter inicial, puro e sem integração externa. Ele oferece listagem, busca por `AssetId` e resolução por identificadores.

Adapters de provedores, cache, freshness, preços, FX e observabilidade pertencem à infraestrutura/Market Data e serão introduzidos separadamente. Nenhum SDK de provedor entra no domínio.

## Consequências positivas

- ticker nunca se torna chave de domínio;
- mudança de ticker não quebra transações ou posições históricas;
- múltiplos provedores podem apontar para o mesmo ativo canônico;
- colisões e contradições permanecem visíveis e auditáveis;
- dados desconhecidos não são descartados silenciosamente durante matching;
- o modelo fica pronto para preços, FX, fundamentals e valuation sem acoplamento a fornecedor.

## Trade-offs

- matching conservador produz estados `PARTIAL_MATCH` e `CONFLICT` que precisam ser tratados pela aplicação;
- um ticker histórico reutilizado pode permanecer ambíguo sem um `asOf` de resolução;
- o catálogo inicial é in-memory e não oferece persistência, cache ou atualização por provedor;
- não há fuzzy matching para recuperar automaticamente dados incompletos; essa precisão é deliberada para evitar fusão incorreta de ativos.

## Fora de escopo

- preços e séries temporais;
- FX e macro;
- fundamentals e valuation;
- persistência do Asset Master;
- cache/freshness e fallback de provedores;
- resolução temporal de ticker por `asOf`;
- matching probabilístico ou assistido por IA.
