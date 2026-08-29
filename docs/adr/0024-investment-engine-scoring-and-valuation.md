# ADR-0024 — Investment Engine: scoring determinístico e valuation auditável

**Status:** Aceita

## Contexto

Após o Asset Master (#39) e a fundação de Market Data (#40), o produto precisa de um núcleo analítico que avalie qualidade estrutural, oportunidade/preço e sustentabilidade de dividendos sem misturar essas dimensões e sem inventar notas quando faltarem dados.

O motor precisa ser reproduzível no tempo, inclusive em backtesting. Isso exige metodologia versionada, evidência com provenance e proteção contra look-ahead.

## Decisão

Criar `@portfolio-copilot/investment-engine` como pacote puro de aplicação analítica, dependente de `domain` e `market-data`.

### Dimensões separadas

- `Quality Score` mede qualidade estrutural;
- `Opportunity Score` mede oportunidade/preço e exige valuation válido;
- `Dividend Score` é separado e tem aplicabilidade explícita por metodologia;
- `Portfolio Fit` não faz parte deste pacote nesta etapa e permanece para #42.

Nenhuma dimensão é derivada automaticamente de outra. Quality alto não implica Opportunity alto.

### Metodologia

Cada metodologia possui `methodologyId`, `version`, classificação exata por `AssetClass`, `InstrumentType` e setor, além de componentes com pesos inteiros cuja soma é 10000 bps.

O registry exige seleção explícita de versão e não realiza fallback silencioso entre setores ou para a versão mais recente.

### Evidência

Todo componente material usa evidências com `asOf`, `retrievedAt`, provenance e quality flags. Evidência stale, conflitante, ausente ou conhecida somente depois do `evaluationAsOf` impede score material e produz `INSUFFICIENT_DATA`.

### Valuation

O engine não cria um DCF universal. Ele recebe um fair value produzido por modelo identificado/versionado e o reconcilia com um `PriceSnapshot` de Market Data.

Preço e fair value usam decimal exato em string. Diferenças relativas são calculadas com `BigInt`; moeda incompatível, quality inválida ou look-ahead bloqueiam o valuation.

### Baselines

A primeira versão inclui baselines de engenharia para:

- ação geral;
- banco;
- FII.

Esses pesos validam arquitetura, contratos e auditabilidade; não são considerados calibrados ou recomendação universal.

## Consequências

### Positivas

- scores são determinísticos e reproduzíveis;
- ausência de dados não vira nota neutra;
- metodologia e evidências ficam auditáveis;
- backtesting pode bloquear look-ahead pelo `retrievedAt`;
- setores podem evoluir sem contaminar outros modelos;
- Portfolio Fit/ranking futuro recebe dimensões independentes.

### Custos

- callers precisam fornecer evidências completas e quality explícita;
- metodologias precisam de versionamento disciplinado;
- não existe fallback conveniente para setor desconhecido;
- valuation específico ainda exige modelos externos futuros.

## Alternativas rejeitadas

### Um score único de investimento

Rejeitado porque esconderia a diferença entre empresa boa, preço bom e aderência à carteira.

### Preencher dados ausentes com zero/média

Rejeitado porque cria falsa precisão e muda o significado econômico do score.

### Escolher automaticamente a metodologia mais recente

Rejeitado porque quebra reprodutibilidade histórica.

### Permitir evidência recuperada depois do `evaluationAsOf`

Rejeitado por introduzir look-ahead bias.

### Implementar DCF genérico nesta etapa

Rejeitado porque classes/setores possuem economics distintos e a issue exige metodologia adequada, não uma fórmula universal arbitrária.

## Referências

- issue #41;
- ADR-0022 — Asset Master;
- ADR-0023 — Market Data provenance/freshness/fallback;
- `docs/FINANCIAL-METHODOLOGY.md`;
- `docs/INVESTMENT-ENGINE-METHODOLOGY.md`;
- `docs/ROADMAP.md` — Fase 5.
