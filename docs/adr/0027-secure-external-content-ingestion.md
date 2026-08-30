# ADR-0027 — Ingestão segura de conteúdo externo para IA

**Status:** Aceita

## Contexto

A camada assistiva de IA precisa consumir notícias, documentos e resultados sem transformar texto externo em uma nova fonte de autoridade do sistema. Esse conteúdo pode estar incorreto, stale, duplicado, malformado ou conter prompt injection direto/indireto.

Os contratos já existentes de Market Data e InvestmentThesis preservam provenance e temporalidade de fatos aceitos. A ingestão textual precisa ficar antes dessa fronteira: um documento recebido não é um fato canônico e não pode alterar regra financeira, tese, recomendação ou autorização apenas por conter uma instrução em linguagem natural.

## Decisão

### A ingestão é infraestrutura compartilhada, não regra do Investment Engine

Os contratos vivem em `@portfolio-copilot/shared/ai-ingestion`. O Investment Engine não interpreta texto externo diretamente.

A futura camada de IA pode consumir os snapshots dessa pipeline, mas fatos materiais só entram em contratos financeiros após validação explícita da camada responsável.

### Fontes são deny-by-default

`ExternalSourcePolicyRegistry` aceita somente fontes declaradas com:

- `sourceId` e provider;
- tipos de conteúdo permitidos (`NEWS`, `DOCUMENT`, `RESULT`);
- hosts HTTPS permitidos;
- limite máximo de caracteres;
- prazo de stale;
- política de retenção;
- versão de normalização.

O adapter declara seu `sourceId`. Se não houver policy correspondente, o conteúdo é rejeitado antes do parser ser tratado como fonte válida.

A pipeline não faz fetch de URL. Adapters de rede futuros continuam responsáveis por SSRF, timeout, redirects e limites de resposta antes de produzir `ParsedExternalContent`.

### Conteúdo e instrução são domínios distintos

Todo snapshot armazenado possui invariantes fixos:

```text
trustBoundary = UNTRUSTED_EXTERNAL_CONTENT
instructionAuthority = NONE
```

Esses campos não são derivados do texto e não podem ser sobrescritos pelo adapter ou classificador.

O texto é normalizado como dado: Unicode NFKC, line endings canônicos, remoção de controles invisíveis/perigosos e limites de tamanho. Metadata também possui chaves/valores limitados e rejeita chaves de prototype pollution.

### Prompt injection suspeito entra em quarantine

A primeira camada defensiva detecta padrões de alto risco, incluindo:

- tentativa de ignorar/sobrescrever instruções anteriores;
- pedido para revelar system/developer prompt;
- tentativa de executar ferramenta, shell, API ou função;
- spoofing de papéis como `<system>`/`[INST]`.

Quando um padrão é detectado:

```text
securityDisposition = QUARANTINED
classification.status = SKIPPED_SECURITY
```

O classificador não recebe o conteúdo quarantined. Detecção por padrão não é tratada como solução completa para prompt injection; a #46 adicionará uma suíte adversarial/eval mais ampla.

### Provenance e temporalidade permanecem no snapshot

Cada documento preserva:

```text
sourceId
provider
sourceDocumentId
sourceUrl
asOf
retrievedAt
normalizationVersion
```

`retrievedAt` não pode preceder `asOf`. `sourceUrl` precisa ser HTTPS e pertencer ao host allowlisted.

Conteúdo cuja distância `retrievedAt - asOf` ultrapassa `staleAfterDays` recebe `STALE` explicitamente.

### Deduplicação é determinística e auditável

O fingerprint usa SHA-256 sobre o conteúdo normalizado:

```text
[kind, title, body]
```

Isso permite detectar duplicata idêntica inclusive entre providers diferentes, sem depender do URL.

A mesma `sourceDocumentId` recebida novamente com o mesmo fingerprint vira duplicata. Se a fonte reutilizar a identidade mas mudar o conteúdo, a nova ingestão é preservada como revisão:

```text
revisionOf = <ingestion anterior>
qualityFlags += SOURCE_MUTATION
```

Nenhum histórico é sobrescrito.

### Classificação é saída não autoritativa e validada

O classificador pode associar o documento a:

- `assetIds` canônicos;
- referências de tese (`thesisId`, `assetId`, versão opcional);
- referências de evento (`eventId`, `thesisId`, `assetId`, versão da tese).

A pipeline valida o shape e a consistência das referências. Erro do classificador produz `FAILED/CLASSIFIER_ERROR`; saída inválida produz `FAILED/INVALID_CLASSIFICATION`.

Falha de classificação nunca promove conteúdo a fato e não interrompe a trilha de auditoria do documento recebido.

Duplicatas não são classificadas novamente nessa ingestão e usam `SKIPPED_DUPLICATE`.

### Audit store é append-only por contrato

`ExternalContentAuditStore` expõe somente leitura por fingerprint/identidade de origem e `append`. A implementação em memória existe como referência/test double; adapters duráveis futuros devem preservar a mesma semântica append-only.

Cada record contém `retentionUntil`, derivado da policy da fonte. Retenção física é responsabilidade do adapter de persistência, sem alterar a identidade histórica antes do prazo aplicável.

## Consequências

### Positivas

- texto externo nunca recebe autoridade de instrução;
- fonte desconhecida falha fechada;
- payload suspeito não chega ao classificador;
- duplicatas, stale e mutação da fonte ficam explícitos;
- falhas de parser/classificação são estados observáveis;
- toda classificação consegue apontar para o documento/provenance que a originou;
- #45 pode construir contexto de IA sobre snapshots já delimitados por trust boundary.

### Custos e limitações

- detecção baseada em padrões possui falsos positivos/negativos e não substitui eval adversarial;
- dedupe atual é exato por fingerprint, não similaridade semântica;
- `InMemoryExternalContentAuditStore` não é persistência de produção;
- a pipeline não baixa URLs nem resolve redirects;
- retenção física depende do storage adapter concreto;
- uma classificação correta ainda não transforma texto em fato financeiro canônico.

## Alternativas rejeitadas

### Passar notícia crua direto ao LLM

Rejeitado porque mistura dados e instruções, perde provenance e aumenta prompt injection indireto.

### Usar o Investment Engine como parser de texto

Rejeitado porque acopla regra financeira determinística a conteúdo externo não confiável.

### Deduplicar apenas por URL

Rejeitado porque syndication, mirrors e mudanças de URL produziriam duplicatas silenciosas.

### Tratar classifier como fonte de verdade

Rejeitado porque classificação é uma derivação falível. Falhas e referências inválidas permanecem explícitas.

## Referências

- issue #44;
- `docs/AI-CONTENT-INGESTION.md`;
- `docs/SECURITY.md`;
- ADR-0023 — Market Data;
- ADR-0026 — InvestmentThesis;
- `docs/ROADMAP.md` — Fase 7.
