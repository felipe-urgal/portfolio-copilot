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

## Implementação inicial de Market Data

A fundação em `@portfolio-copilot/market-data` separa contratos, snapshots materiais, freshness, cache, fallback e adapters. Nenhum adapter de infraestrutura altera `AssetId` ou a identidade canônica do domínio.

### Banco Central do Brasil — SGS

Fonte oficial inicial para macro e FX: Sistema Gerenciador de Séries Temporais (SGS) do Banco Central do Brasil.

- provider canônico: `BCB_SGS`;
- endpoint base: `https://api.bcb.gov.br/dados/serie/bcdata.sgs`;
- formato consumido: JSON, endpoint `dados/ultimos/1?formato=json`;
- licença declarada no Portal de Dados Abertos do BCB para os recursos usados: Open Data Commons Open Database License (ODbL);
- série SGS 432: Meta Selic definida pelo Copom, unidade `% ao ano`;
- série SGS 1: taxa de câmbio livre — dólar americano venda — diária, usada como `USD/BRL`;
- respostas do SGS são date-granular (`DD/MM/YYYY`); o adapter normaliza a data de referência para `00:00:00.000Z`. Esse `asOf` representa a **data de referência da observação**, não um horário de publicação inferido;
- `retrievedAt` representa o instante real de coleta;
- payload vazio retorna `MISSING`; HTTP, JSON ou formato inválido retornam `PROVIDER_ERROR` com código controlado, sem propagar payload ou erro bruto.

Referências de catálogo:

- `https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom`;
- `https://dadosabertos.bcb.gov.br/dataset/1-taxa-de-cambio---livre---dolar-americano-venda---diario`.

### Preços de ativos

`PriceProvider` é um contrato substituível e `InMemoryPriceProvider` é o adapter determinístico inicial para testes, composição e desenvolvimento. Nenhum fornecedor externo de preço é promovido a fonte de produção nesta etapa.

A escolha de um provider real de preços permanece condicionada à revisão explícita de:

- licença para armazenamento e redistribuição;
- cobertura de bolsas/instrumentos do Asset Master;
- definição de fechamento, timezone e corporate actions;
- SLA/freshness;
- limites de uso, custo e estratégia de fallback.

Isso evita transformar uma fonte gratuita ou um endpoint não revisado em dependência de produto por conveniência.

## Freshness

Definir SLA por tipo de dado. Exemplo inicial:

- preço diário: último pregão concluído;
- macro: última publicação oficial conhecida;
- fundamentos: último resultado publicado;
- tese: estado atual com data de revisão;
- notícia: timestamp da publicação e da coleta.

A política de runtime recebe TTL explícito por categoria (`PRICE`, `FX`, `MACRO`). Um snapshot é classificado como `FRESH`, `STALE` ou `FUTURE`; observação futura é conflito de qualidade, nunca dado atual.

## Cache

Cache não altera a qualidade do dado. A implementação inicial usa TTL explícito, expiração determinística e invalidação manual. Expiração do cache e freshness do snapshot são conceitos separados: um cache hit não torna dado stale em dado atual.

## Fallback

Fallback entre providers é opt-in e ordenado. A política declara separadamente se pode avançar em `MISSING` e/ou `PROVIDER_ERROR`. Toda tentativa fica disponível para auditoria operacional; não existe fallback implícito.

## Observabilidade

Eventos operacionais de Market Data podem conter somente metadados necessários para saúde do pipeline, como categoria, provider, outcome, número da tentativa e duração. Não registrar no evento padrão:

- valor financeiro;
- `AssetId` ou identificador solicitado;
- payload bruto do provider;
- URL de requisição com parâmetros potencialmente sensíveis;
- tokens, headers ou segredos;
- mensagens de exceção externas não sanitizadas.

## Falhas

Se o dado necessário estiver ausente, stale ou inconsistente, o sistema deve retornar `insufficient_data` ou reduzir confiança. Nunca preencher silenciosamente com estimativa sem marcá-la.

## Licenciamento

Antes de produção/comercialização, cada provedor deve ter licença revisada para armazenamento, redistribuição, exibição e uso derivado. Fonte gratuita na web não implica direito de redistribuição em produto.

A ODbL dos datasets BCB selecionados está registrada como condição da fonte, não como parecer jurídico sobre todo uso futuro. Alterações de fonte, redistribuição ou modelo comercial exigem nova revisão de licença.

## Open Finance

Integrações via Open Finance são futuras e dependem de requisitos técnicos, consentimento, participantes e enquadramento aplicáveis. Não será criado scraping de internet banking.
