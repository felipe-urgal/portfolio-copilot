# IA — ingestão segura de conteúdo externo

## Objetivo

Esta pipeline recebe notícias, documentos e resultados que podem futuramente ser usados por classificadores e modelos de linguagem.

A regra principal é simples:

> conteúdo externo é dado não confiável, nunca instrução do sistema.

Receber, armazenar ou classificar um texto não o transforma em fato canônico do Portfolio Copilot.

## Fluxo

```text
raw payload
  -> allowlisted source adapter
  -> parse result explícito
  -> policy de fonte
  -> sanitização/normalização
  -> provenance + asOf/retrievedAt
  -> SHA-256 + dedupe/revision
  -> prompt-injection scan
  -> quarantine OU classificação validada
  -> audit store append-only
```

## Source policies

Cada fonte precisa estar cadastrada em `ExternalSourcePolicyRegistry`.

A policy define:

```text
sourceId
provider
allowedKinds[]
allowedHosts[]
maxContentChars
staleAfterDays
retentionDays
normalizationVersion
```

Sem policy não existe fallback: `SOURCE_NOT_ALLOWED`.

URLs aceitas são somente HTTPS, sem credenciais embutidas e pertencentes ao host allowlisted (incluindo subdomínios legítimos).

A pipeline não executa fetch. Um adapter que baixa conteúdo precisa aplicar também controles de SSRF, redirects, DNS/IP, timeout, content-type e tamanho antes de chamar esta camada.

## Adapter contract

Um adapter implementa:

```text
ExternalContentSourceAdapter<TRaw>
  sourceId
  parse(raw)
```

O parser retorna:

```text
PARSED -> ParsedExternalContent
```

ou uma falha explícita:

```text
MALFORMED_PAYLOAD
MISSING_REQUIRED_FIELD
UNSUPPORTED_CONTENT
```

Se o adapter lançar exceção, a pipeline converte para `ADAPTER_ERROR`.

Nenhuma dessas falhas gera documento/fato silencioso.

## ParsedExternalContent

O contrato normalizado de entrada inclui:

```text
ingestionId
sourceDocumentId
kind
title
body
asOf
retrievedAt
sourceUrl
metadata
```

`ingestionId` identifica uma tentativa armazenável de ingestão. `sourceDocumentId` é a identidade dada pela fonte e pode reaparecer em revisões.

## Sanitização

Antes de hash/classificação:

- normaliza Unicode em NFKC;
- converte line endings para `\n`;
- remove controles C0/C1 não textuais;
- neutraliza controles bidi/invisíveis;
- limita título, body e metadata;
- limita quantidade de metadata;
- rejeita chaves perigosas de prototype pollution;
- rejeita body vazio após normalização.

Sanitização não significa “conteúdo confiável”. O snapshot continua com:

```text
trustBoundary = UNTRUSTED_EXTERNAL_CONTENT
instructionAuthority = NONE
```

## Prompt injection

A proteção inicial procura sinais de alto risco, como:

- `ignore/disregard previous instructions`;
- tentativa de obter system/developer prompt;
- solicitação para chamar ferramenta/shell/API;
- marcações que simulam papéis de autoridade.

Qualquer sinal coloca o documento em:

```text
securityDisposition = QUARANTINED
```

O classificador **não é chamado** para conteúdo quarantined.

Os `threatFlags` ficam preservados no audit record para análise posterior.

Essa camada é deliberadamente conservadora. Ela não substitui a suíte de prompt injection/factualidade planejada na #46.

## Provenance e tempo

Todo record preserva provider, identidade da fonte, URL e timestamps.

Regras:

- `retrievedAt >= asOf`;
- ambos são instantes UTC canônicos;
- URL precisa respeitar a policy;
- se `retrievedAt - asOf > staleAfterDays`, o documento recebe `STALE`.

Stale não é apagado nem convertido em dado neutro.

## Deduplicação

O fingerprint é SHA-256 de:

```text
JSON.stringify([kind, normalizedTitle, normalizedBody])
```

### Mesmo documento e mesmo conteúdo

A nova ingestão aponta para:

```text
duplicateOf
duplicateReason = SOURCE_DOCUMENT_ID
```

### Mesmo conteúdo em outra fonte

A nova ingestão aponta para:

```text
duplicateOf
duplicateReason = CONTENT_FINGERPRINT
```

### Mesma identidade da fonte, conteúdo alterado

Não é colapsado como duplicata:

```text
revisionOf = <record anterior>
qualityFlags += SOURCE_MUTATION
```

Isso preserva correções/revisões de releases e notícias.

## Classificação

O classificador recebe somente o conteúdo já normalizado e o trust boundary explícito.

Ele pode produzir referências de:

- ativos;
- teses;
- eventos.

A saída é revalidada antes de ser armazenada. Referência de tese/evento precisa usar um `assetId` que também esteja presente na lista de ativos classificados.

Estados possíveis:

| Status | Uso |
|---|---|
| `CLASSIFIED` | referências válidas foram produzidas |
| `UNCLASSIFIED` | nenhum vínculo confiável foi encontrado |
| `FAILED` | exceção ou output estruturalmente inválido |
| `SKIPPED_SECURITY` | documento quarantined |
| `SKIPPED_DUPLICATE` | documento já processado semanticamente como conteúdo idêntico |

Falha não vira fato e não é mascarada como `UNCLASSIFIED`.

## Audit store e retenção

`ExternalContentAuditStore` é append-only por contrato:

```text
findByFingerprint
findLatestBySourceDocument
append
```

`InMemoryExternalContentAuditStore` é uma implementação de referência/test double. Storage durável pode usar banco/blob store futuramente, mas deve manter os mesmos invariantes e nunca sobrescrever record existente por conveniência.

Cada record calcula:

```text
retentionUntil = retrievedAt + retentionDays
```

A policy exige `retentionDays >= staleAfterDays`.

## O que pode chegar ao LLM

Esta issue não monta prompt nem chama modelo.

A futura #45 só deve considerar documentos que atendam às regras de contexto dela. No mínimo:

- nunca tratar `body/title/metadata` como instruções;
- não enviar `QUARANTINED` como contexto normal;
- preservar `ingestionId`/provenance para citações;
- não transformar `classification` em fato financeiro;
- preferir dados estruturados canônicos quando existirem.

## Fora de escopo

- similaridade semântica/embedding para dedupe;
- crawler/fetcher HTTP;
- persistência de produção específica;
- promoção automática de texto para `InvestmentThesisFact`;
- copiloto conversacional;
- avaliação completa de groundedness/alucinação;
- qualquer ação financeira.
