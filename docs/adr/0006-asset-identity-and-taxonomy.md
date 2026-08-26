# ADR-0006 — Identidade e taxonomia de ativos

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

O Portfolio Copilot precisa representar ações, renda fixa, ETFs, FIIs, fundos, caixa e cripto sem acoplar a identidade do ativo a um ticker, bolsa, corretora ou provedor de market data.

Tickers e códigos externos podem mudar, ser reutilizados, variar por mercado ou ter formatos diferentes conforme o fornecedor. Usá-los como chave primária tornaria holdings, transações e snapshots históricos frágeis.

## Decisão

### AssetId

- cada `Asset` possui um `AssetId` interno, opaco e estável;
- `AssetId` usa UUID canônico como contrato inicial;
- o domínio aceita UUIDs RFC com versão explícita e variante padrão, permitindo geração v4 hoje e v7 futuramente;
- geração do UUID pertence à camada de aplicação/infraestrutura; o domínio apenas valida e normaliza a identidade recebida;
- ticker, ISIN, CNPJ ou provider ID nunca substituem o `AssetId`.

### AssetClass

A taxonomia inicial é econômica e deliberadamente ampla:

- `CASH`;
- `FIXED_INCOME`;
- `EQUITY`;
- `ETF`;
- `REAL_ESTATE_FUND`;
- `INVESTMENT_FUND`;
- `CRYPTO_ASSET`.

Não existe `OTHER` nesta etapa. Uma classe nova deve ser adicionada conscientemente, com impacto em regras, dados e UX avaliado.

Subtipos não entram em `AssetClass`. Exemplos:

- Tesouro Selic, Tesouro IPCA+, CDB, LCI e LCA continuam em `FIXED_INCOME`;
- indexador, emissor, vencimento, liquidez e garantias serão metadados/tipos específicos de renda fixa;
- ações ordinárias/preferenciais continuam em `EQUITY`;
- setor econômico não é `AssetClass` e será tratado separadamente quando necessário;
- FII brasileiro entra em `REAL_ESTATE_FUND`, preservando uma taxonomia que não depende do nome local do produto.

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
- classe;
- moeda de referência;
- identificadores externos opcionais.

Preço, quantidade, posição, custo médio, setor, fundamentals, vencimento e demais atributos específicos ficam fora desta entidade básica.

## Consequências positivas

- mudança de ticker não quebra histórico;
- provedores podem ser substituídos sem migração da identidade do domínio;
- holdings e transações futuras poderão referenciar `AssetId` estável;
- classes permanecem pequenas e compreensíveis;
- ativos sem ticker, como parte da renda fixa, são cidadãos de primeira classe.

## Trade-offs

- será necessário manter um Asset Master que reconcilie identificadores externos com `AssetId`;
- validações profundas de ISIN/CNPJ/provider IDs pertencem a adapters ou evoluções específicas;
- subtipos e metadados por classe exigirão modelos próprios posteriormente;
- UUID é uma decisão de identidade interna, não um identificador amigável para o usuário.
