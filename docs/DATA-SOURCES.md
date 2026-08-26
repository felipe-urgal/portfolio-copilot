# Fontes de Dados

## Princípio

Nenhuma decisão financeira relevante pode depender de um número sem origem e data. O sistema deve tratar provenance e freshness como parte do dado.

## Metadados obrigatórios

Para snapshots materiais, armazenar quando possível:

```text
provider
sourceUrl/sourceId
asOf
retrievedAt
currency
unit
rawIdentifier
normalizationVersion
qualityStatus
```

## Categorias

### Preços

Necessidades:

- fechamento diário no MVP;
- preço intraday não é requisito inicial;
- corporate actions precisam ser tratados em retornos históricos;
- moeda e timezone explícitos.

### Fundamentos

- demonstrações financeiras;
- lucro/receita/caixa;
- dívida;
- métricas setoriais;
- histórico suficiente para qualidade e valuation.

Resultados divulgados pela própria companhia são fonte primária preferida para validação, respeitando custo operacional e padronização.

### Macroeconomia

Priorizar fontes oficiais, por exemplo:

- Banco Central do Brasil;
- IBGE;
- Tesouro Nacional;
- fontes oficiais equivalentes para outros países.

### FIIs

Necessidades específicas:

- rendimentos;
- patrimônio;
- vacância;
- WALE quando aplicável;
- alavancagem;
- concentração;
- relatórios gerenciais e fatos relevantes.

### Notícias/eventos

Notícia é evidência textual, não dado financeiro autoritativo. O pipeline deve:

1. coletar;
2. deduplicar;
3. classificar entidade/evento;
4. ligar à tese;
5. exigir confirmação adicional quando impacto for material.

## Abstração

```text
PriceProvider
FundamentalsProvider
MacroProvider
NewsProvider
FxProvider
```

Cada adapter deve ter contract tests.

## Freshness

Definir SLA por tipo de dado. Exemplo inicial:

- preço diário: último pregão concluído;
- macro: última publicação oficial conhecida;
- fundamentos: último resultado publicado;
- tese: estado atual com data de revisão;
- notícia: timestamp da publicação e da coleta.

## Falhas

Se o dado necessário estiver ausente, stale ou inconsistente, o sistema deve retornar `insufficient_data` ou reduzir confiança. Nunca preencher silenciosamente com estimativa sem marcá-la.

## Licenciamento

Antes de produção/comercialização, cada provedor deve ter licença revisada para armazenamento, redistribuição, exibição e uso derivado. Fonte gratuita na web não implica direito de redistribuição em produto.

## Open Finance

Integrações via Open Finance são futuras e dependem de requisitos técnicos, consentimento, participantes e enquadramento aplicáveis. Não será criado scraping de internet banking.
