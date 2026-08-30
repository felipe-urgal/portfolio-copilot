# ADR-0026 — InvestmentThesis versionada e timeline auditável

**Status:** Aceita

## Contexto

O Investment Engine já consegue registrar evidências, calcular scores versionados e produzir um ranking explicável. A próxima camada precisa preservar o racional de investimento ao longo do tempo sem transformar opinião analítica em fato nem permitir que uma edição apague a tese que existia quando uma decisão anterior foi tomada.

Resultados, riscos e sinais de invalidação também precisam ser associados temporalmente à versão da tese que estava vigente. Uma simples entidade mutável com campos de texto não preservaria essa história nem provaria quando um fato passou a ser conhecido.

## Decisão

### A tese é um snapshot imutável e versionado

`InvestmentThesisSnapshot` possui identidade estável por `thesisId + assetId` e uma sequência inteira de versões iniciada em `1`.

A criação produz a versão inicial. Mudanças materiais usam `reviseInvestmentThesis`, que produz uma nova versão com:

- `version = previous.version + 1`;
- `previousVersion` explícita;
- novo `createdAt` e `effectiveAt`;
- `revisionReason` obrigatório;
- novo snapshot completo do conteúdo analítico.

A versão anterior não é alterada.

### Fatos, opinião analítica e invalidação são estruturas distintas

A tese separa:

- `facts`: afirmações factuais acompanhadas de evidência/provenance;
- `drivers`: opinião analítica favorável ligada aos fatos que a sustentam;
- `risks`: opinião analítica de risco ligada aos fatos que a sustentam;
- `monitoredIndicators`: sinais que precisam ser acompanhados;
- `invalidationCriteria`: condições analíticas explícitas ligadas aos indicadores monitorados;
- `thesisStatement`: síntese da opinião analítica daquela versão.

Drivers e riscos não carregam fatos implícitos: referenciam `factId`s existentes. Critérios de invalidação não ficam escondidos em texto geral: referenciam indicadores existentes.

### Provenance e temporalidade são obrigatórios para fatos materiais

Cada fato da tese contém pelo menos uma `AnalyticalEvidenceSnapshot`. A evidência reutiliza o contrato do Investment Engine com `asOf`, `retrievedAt`, provider e identificadores de origem.

Uma versão rejeita evidência conhecida somente depois de seu `createdAt`. Eventos também rejeitam evidência cujo `asOf` seja posterior ao evento ou cujo `retrievedAt` seja posterior ao momento de registro.

Isso preserva a capacidade de reconstruir o que era conhecido em cada ponto da timeline e evita look-ahead silencioso.

### Eventos pertencem à versão vigente da tese

`InvestmentThesisEventSnapshot` registra:

- identidade do evento;
- `thesisId`, `assetId` e `thesisVersion`;
- `occurredAt` e `recordedAt`;
- tipo estruturado;
- resumo;
- evidência com provenance.

O evento nunca pode ocorrer antes de a versão referenciada entrar em vigor.

### Revisões são auditáveis e mudanças materiais exigem vínculo explícito

`InvestmentThesisReviewSnapshot` registra conclusão `CONFIRMED`, `REVISED` ou `INVALIDATED`, evidências utilizadas e eventos relacionados.

Uma revisão `REVISED` precisa apontar para exatamente `thesis.version + 1`. Ao construir a timeline, toda versão depois da primeira precisa ter exatamente uma revisão `REVISED` da versão anterior que a origine. Assim, não existe versão material nova sem trilha de revisão.

### Staleness é determinístico

Cada versão define `reviewPolicy.intervalDays`.

Para uma tese ativa, o próximo vencimento é calculado a partir da revisão mais recente da versão atual ou, se ela ainda não foi revisada, de `effectiveAt`.

A timeline expõe:

- `CURRENT` + `REVIEW_CURRENT` enquanto o prazo não venceu;
- `STALE` + `REVIEW_OVERDUE` depois do prazo;
- `NOT_APPLICABLE` + `THESIS_INVALIDATED` quando a versão atual foi invalidada.

A invalidação não é inferida automaticamente por IA ou por um evento isolado. Ela é uma conclusão explícita de revisão analítica.

### A timeline valida a cadeia inteira

`buildInvestmentThesisTimeline` rejeita:

- versões não contíguas ou de outro ativo/tese;
- versões futuras;
- eventos/reviews de outra tese;
- IDs duplicados;
- referências a eventos inexistentes ou ainda não registrados;
- revisão `REVISED` sem a versão resultante correspondente;
- versão material sem revisão `REVISED` que a justifique.

A timeline final mantém versões, eventos, reviews e uma sequência de entradas ordenada deterministicamente.

## Consequências

### Positivas

- histórico relevante nunca é sobrescrito;
- é possível reconstruir o racional conhecido em uma data;
- fatos ficam separados de interpretação;
- mudança material possui causa/revisão rastreável;
- eventos preservam provenance e temporalidade;
- stale e invalidação são estados explícitos;
- a futura camada de IA pode resumir a tese sem virar fonte de verdade.

### Custos

- callers precisam preservar versões e reviews, não apenas o estado atual;
- uma alteração material exige criar snapshot completo da nova versão;
- a regra de revisão periódica é temporalmente simples e não substitui políticas específicas por classe/setor;
- critérios de invalidação são estruturados por identidade/indicadores, mas sua semântica financeira continua pertencendo à análise e não é executada automaticamente nesta etapa.

## Alternativas rejeitadas

### Atualizar a mesma linha de tese

Rejeitado porque apaga o contexto histórico e impede auditoria de decisões anteriores.

### Misturar fatos, drivers e riscos em texto livre único

Rejeitado porque torna impossível distinguir provenance factual de interpretação analítica.

### Evento invalidar automaticamente a tese

Rejeitado porque um evento pode ser apenas um sinal. A invalidação material precisa de revisão explícita e auditável.

### IA decidir se a tese mudou

Rejeitado nesta fase. IA futura pode auxiliar resumo/classificação, mas o estado canônico continua estruturado e determinístico.

## Referências

- issue #43;
- ADR-0024 — Investment Engine scoring e valuation;
- ADR-0025 — Portfolio Fit e ranking explicável;
- `docs/INVESTMENT-THESIS-LIFECYCLE.md`;
- `docs/ROADMAP.md` — Fase 6.
