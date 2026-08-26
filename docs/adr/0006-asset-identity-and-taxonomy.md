# ADR-0006 — Identidade e taxonomia de ativos

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Copilot precisa representar ações, renda fixa, ETFs, FIIs, fundos, caixa, commodities e cripto sem acoplar a identidade do ativo a ticker, bolsa, corretora ou provedor de market data.

Também precisamos evitar uma ambiguidade estrutural importante: **classe econômica** e **veículo de investimento** não são a mesma dimensão. Um ETF pode carregar exposição a ações, renda fixa, commodities ou cripto; da mesma forma, um fundo de investimento pode ser multimercado ou especializado. Se `ETF` fosse tratado como `AssetClass`, o futuro `TargetAllocation` misturaria exposição econômica com embalagem jurídica/operacional do produto.

Tickers e códigos externos podem mudar, ser reutilizados, variar por mercado ou ter formatos diferentes conforme o fornecedor. Usá-los como chave primária tornaria holdings, transações e snapshots históricos frágeis.

## Decisão

### AssetId

- cada `Asset` possui um `AssetId` interno, opaco e estável;
- `AssetId` usa UUID canônico como contrato inicial;
- o domínio aceita UUIDs RFC com versão explícita e variante padrão, permitindo geração v4 hoje e v7 futuramente;
- geração do UUID pertence à camada de aplicação/infraestrutura; o domínio apenas valida e normaliza a identidade recebida;
- ticker, ISIN, CNPJ ou provider ID nunca substituem o `AssetId`.

### AssetClass — exposição econômica

A taxonomia inicial representa a exposição econômica predominante do ativo:

- `CASH`;
- `FIXED_INCOME`;
- `EQUITY`;
- `REAL_ESTATE`;
- `COMMODITY`;
- `CRYPTO_ASSET`;
- `MULTI_ASSET`.

Não existe `OTHER` nesta etapa. Uma classe nova deve ser adicionada conscientemente, com impacto em regras, dados e UX avaliado.

Exemplos:

- Tesouro Selic, Tesouro IPCA+, CDB, LCI e LCA usam `FIXED_INCOME`;
- uma ação usa `EQUITY`;
- um FII de tijolo ou papel permanece economicamente em `REAL_ESTATE` nesta primeira taxonomia;
- um ETF de ações usa `EQUITY`, não `ETF`;
- um ETF de renda fixa usa `FIXED_INCOME`, não `ETF`;
- um fundo multimercado pode usar `MULTI_ASSET` quando não houver uma exposição predominante suficientemente clara.

Indexador, emissor, vencimento, liquidez, setor, região geográfica e demais dimensões não entram em `AssetClass`.

### InstrumentType — veículo/instrumento

O veículo é modelado separadamente por `InstrumentType`:

- `CASH_BALANCE`;
- `FIXED_INCOME_INSTRUMENT`;
- `STOCK`;
- `ETF`;
- `REAL_ESTATE_FUND`;
- `INVESTMENT_FUND`;
- `CRYPTO_ASSET`.

Essa dimensão descreve como o investidor acessa a exposição, não qual risco econômico o ativo representa.

Exemplos:

- ação brasileira: `AssetClass=EQUITY`, `InstrumentType=STOCK`;
- ETF de S&P 500: `AssetClass=EQUITY`, `InstrumentType=ETF`;
- ETF de títulos: `AssetClass=FIXED_INCOME`, `InstrumentType=ETF`;
- Tesouro/CDB: `AssetClass=FIXED_INCOME`, `InstrumentType=FIXED_INCOME_INSTRUMENT`;
- FII: `AssetClass=REAL_ESTATE`, `InstrumentType=REAL_ESTATE_FUND`.

Combinações economicamente estranhas não são bloqueadas nesta etapa porque essa compatibilidade poderá depender de subtipos e metadados ainda inexistentes. A validação cruzada deve ser adicionada quando houver informação suficiente para fazê-la sem regras artificiais.

### Moeda de referência

`Asset.referenceCurrency` reutiliza o `CurrencyCode` criado no ADR-0005. Isso representa a moeda de referência/cotação do ativo, não conversão cambial nem moeda consolidada da carteira.

### Identificadores externos

Identificadores externos são opcionais e nunca participam da identidade interna. O domínio suporta inicialmente:

- `MARKET_SYMBOL`: símbolo + mercado, com normalização explícita para maiúsculas;
- `ISIN`: formato de 12 caracteres normalizado para maiúsculas; nesta etapa não há validação completa do dígito verificador;
- `PROVIDER_ID`: namespace do provedor normalizado, preservando o valor do provedor porque ele pode ser case-sensitive.

Um mesmo ticker pode aparecer em dois `Asset` distintos sem torná-los a mesma entidade. Dentro de um único `Asset`, identificadores externos duplicados são rejeitados.

### Asset

`Asset` é imutável e contém somente:

- identidade interna;
- nome;
- classe econômica;
- tipo de instrumento;
- moeda de referência;
- identificadores externos opcionais.

Preço, quantidade, posição, custo médio, setor, fundamentals, vencimento e demais atributos específicos ficam fora desta entidade básica.

## Consequências positivas

- mudança de ticker não quebra histórico;
- provedores podem ser substituídos sem migração da identidade do domínio;
- holdings e transações futuras poderão referenciar `AssetId` estável;
- `TargetAllocation` poderá trabalhar com classes econômicas sem confundir ETF/fundo com exposição;
- o motor poderá analisar veículo e risco em dimensões independentes;
- ativos sem ticker, como parte da renda fixa, são cidadãos de primeira classe.

## Trade-offs

- será necessário manter um Asset Master que reconcilie identificadores externos com `AssetId`;
- validações profundas de ISIN/CNPJ/provider IDs pertencem a adapters ou evoluções específicas;
- subtipos e metadados por classe/instrumento exigirão modelos próprios posteriormente;
- algumas combinações `AssetClass` + `InstrumentType` só poderão ser validadas quando o domínio tiver metadados suficientes;
- UUID é uma decisão de identidade interna, não um identificador amigável para o usuário.
