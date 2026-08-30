# Investment Thesis — lifecycle, eventos e revisão

## Objetivo

A camada de tese registra **por que** um ativo faz parte do universo de análise e como esse racional muda quando novos fatos aparecem.

Ela não substitui Quality, Opportunity, Portfolio Fit ou valuation. Esses módulos medem dimensões específicas; a tese preserva o racional analítico, os fatos usados, os riscos monitorados e os critérios que exigem revisão ou invalidação.

O estado canônico é estruturado e determinístico. IA futura pode resumir esse material, mas não altera versões, eventos ou conclusão de revisão.

## Identidade e versionamento

Uma tese usa:

```text
thesisId
assetId
version
previousVersion
createdAt
effectiveAt
revisionReason
```

A versão inicial é `1` e possui `previousVersion = null`.

Uma mudança material não edita a versão vigente. `reviseInvestmentThesis` produz um novo snapshot completo com `version + 1`, preservando a versão anterior.

`effectiveAt` de uma revisão precisa ser posterior ao da versão anterior. Isso evita duas versões concorrentes no mesmo instante e deixa a sequência temporal inequívoca.

## Separação de responsabilidade

### Fatos

`facts` contêm afirmações factuais usadas pela tese. Cada fato possui:

```text
factId
statement
evidence[]
```

Toda evidência preserva:

```text
evidenceId
asOf
retrievedAt
provider
sourceId/sourceUrl/rawIdentifier
normalizationVersion
qualityFlags
```

A tese não aceita fato sem provenance nem evidência conhecida depois do `createdAt` da versão.

### Opinião analítica

A opinião fica separada em:

- `thesisStatement`: síntese da leitura daquela versão;
- `drivers`: fatores que sustentam a tese;
- `risks`: fatores que podem deteriorá-la.

Cada driver/risco referencia explicitamente os `factId`s que o sustentam. Isso impede transformar opinião em fato apenas por estarem no mesmo texto.

### Indicadores monitorados

`monitoredIndicators` define o que precisa ser acompanhado ao longo da vida da tese. Cada indicador possui identidade, nome e descrição.

Nesta etapa o contrato não força uma unidade ou fórmula universal. A interpretação de margem, crescimento, alavancagem, ocupação ou outro indicador depende da classe/setor e da metodologia analítica correspondente.

### Critérios de invalidação

`invalidationCriteria` registra condições analíticas explícitas e os indicadores relacionados.

O critério não é executado automaticamente nesta fase. Ele torna a condição de quebra auditável e disponível para revisão humana/determinística futura, sem permitir que um evento isolado seja tratado silenciosamente como invalidação definitiva.

## Eventos e resultados

Eventos são snapshots imutáveis ligados à versão da tese vigente no momento do fato.

Tipos iniciais:

```text
RESULT
DRIVER_UPDATE
RISK_UPDATE
INDICATOR_UPDATE
INVALIDATION_SIGNAL
OTHER
```

Cada evento preserva:

```text
eventId
thesisId
assetId
thesisVersion
occurredAt
recordedAt
type
summary
evidence[]
```

Regras temporais:

- o evento não pode ocorrer antes de `effectiveAt` da versão referenciada;
- `recordedAt` não pode ser anterior a `occurredAt`;
- a evidência não pode ter `asOf` posterior ao evento;
- a evidência precisa ter sido recuperada até `recordedAt`.

Essas regras permitem reconstruir o que aconteceu e quando o sistema passou a conhecer a fonte.

## Reviews

Uma revisão registra uma conclusão explícita sobre uma versão:

```text
reviewId
thesisId
assetId
thesisVersion
reviewedAt
outcome
notes
evidence[]
relatedEventIds[]
resultingVersion
```

Outcomes:

- `CONFIRMED`: tese continua válida sem mudança material;
- `REVISED`: fatos/eventos exigem nova versão;
- `INVALIDATED`: a tese atual foi considerada inválida.

### Review com revisão material

Para `REVISED`:

```text
resultingVersion = thesisVersion + 1
```

A timeline exige correspondência entre a review e a nova versão. Não é válido manter a review como `REVISED` sem criar a versão resultante, nem inserir uma versão `2+` sem uma review `REVISED` da versão anterior.

Isso formaliza o requisito de que mudança material gera histórico novo em vez de sobrescrever o racional anterior.

## Revisão periódica e stale

Cada versão contém:

```text
reviewPolicy.intervalDays
```

Para a versão atual ativa, a âncora da próxima revisão é:

1. a review mais recente da própria versão, quando existe; ou
2. `effectiveAt`, quando a versão ainda não foi revisada.

Então:

```text
reviewDueAt = anchor + intervalDays
```

Estados:

| Lifecycle | Freshness | Reason code | Significado |
|---|---|---|---|
| ACTIVE | CURRENT | REVIEW_CURRENT | revisão ainda dentro do prazo |
| ACTIVE | STALE | REVIEW_OVERDUE | prazo de revisão ultrapassado |
| INVALIDATED | NOT_APPLICABLE | THESIS_INVALIDATED | revisão periódica deixa de ser aplicável à versão invalidada |

A regra é intencionalmente simples e auditável. Políticas diferentes por classe/setor podem ser adicionadas depois de forma versionada.

## Timeline auditável

`buildInvestmentThesisTimeline` recebe as coleções históricas e valida a cadeia completa antes de produzir o snapshot atual.

Validações principais:

- ao menos uma versão;
- sequência contígua `1..N`;
- `previousVersion` correta;
- mesmo `thesisId` e `assetId` em todo o histórico;
- ordem temporal crescente entre versões;
- nenhum objeto posterior ao `asOf` da reconstrução;
- IDs de evento e review sem duplicidade;
- eventos/reviews apontam para versões existentes;
- review só referencia eventos já registrados naquele momento;
- cada versão após a primeira possui exatamente uma review `REVISED` que a originou.

O snapshot devolve:

```text
thesisId
assetId
asOf
currentVersion
lifecycleStatus
freshnessStatus
reviewDueAt
reasonCodes
versions[]
events[]
reviews[]
entries[]
```

`entries` é uma visão ordenada deterministicamente da história. Os snapshots completos continuam preservados nas coleções correspondentes.

## Reconstrução histórica

Para reconstruir o estado em uma data passada:

1. selecione somente versões, eventos e reviews conhecidos até o `asOf` desejado;
2. preserve os timestamps originais;
3. execute `buildInvestmentThesisTimeline`;
4. não injete versões ou evidências que só ficaram disponíveis depois daquele instante.

A função também rejeita objetos explicitamente futuros, reduzindo risco de look-ahead em análises históricas.

## Relação com o restante do Investment Engine

A tese não recalcula:

- Quality;
- Opportunity;
- Dividend;
- valuation;
- Portfolio Fit;
- ranking.

Esses resultados podem futuramente ser referenciados como contexto analítico, mas continuam com seus próprios contratos e versionamentos.

Da mesma forma, um score alto não confirma uma tese automaticamente e um score baixo não invalida uma tese sem uma regra/review explícita.

## Limitações atuais

- critérios de invalidação ainda não executam comparadores quantitativos automaticamente;
- indicadores monitorados definem o contrato do que observar, mas valores observados entram por eventos/evidências;
- não há persistência específica da tese nesta etapa; os snapshots são contratos de domínio serializáveis;
- não há IA como fonte de verdade;
- não há ingestão automática de notícias/documentos nesta etapa;
- não há execução de ordens;
- políticas de revisão são intervalos simples em dias, sem calendário de mercado.

A próxima etapa de IA/ingestão deve consumir esses contratos sem permitir que conteúdo externo redefina regras do sistema ou altere fatos canônicos sem provenance.
