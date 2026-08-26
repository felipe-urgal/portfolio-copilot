# Done

Histórico resumido de atividades concluídas.

## 2026-08-26 — Fundação documental

- visão, produto e Project Brief;
- arquitetura e ADRs iniciais;
- metodologia e política de investimentos;
- segurança, dados e regulatório;
- roadmap, backlog e processo de trabalho.

## 2026-08-26 — Fundação técnica

- pnpm workspace/monorepo;
- `apps/web` com Next.js e rota `/health`;
- `packages/domain` e `packages/shared`;
- Node.js 24 Active LTS, TypeScript 6.0.3 strict e ESLint 9.39.5 em combinação compatível;
- `.nvmrc` e `engines` para evitar drift involuntário de major do Node;
- Prettier e Vitest com testes iniciais;
- scripts raiz de quality gate;
- CI GitHub Actions com permissões mínimas e Actions pinadas por SHA;
- políticas de supply chain do pnpm com exceções estreitas e documentadas;
- `.env.example` e `.gitignore` seguros;
- ADR da stack técnica;
- fluxo obrigatório de PR formalizado: acompanhar CI, auto review sênior, corrigir findings, atualizar docs, validar o head final e só então mergear;
- handoff pós-merge documentado com comandos locais obrigatórios.

## 2026-08-26 — Higiene de artefatos locais

- `*.tsbuildinfo` adicionado ao `.gitignore` por ser cache incremental do TypeScript;
- tratamento de arquivos gerados pelo Next.js/TypeScript documentado em `docs/DEVELOPMENT.md`;
- regra de `git status` limpo de artefatos locais não intencionais reforçada antes de finalizar PRs.

## 2026-08-26 — Correção de versionamento do `next-env.d.ts`

- confirmado na documentação atual do Next.js que `next-env.d.ts` é regenerado por `next dev`, `next build` e `next typegen`;
- decisão anterior de manter `apps/web/next-env.d.ts` versionado corrigida;
- `next-env.d.ts` removido do repositório e adicionado ao `.gitignore`;
- `apps/web/tsconfig.json` continua incluindo `next-env.d.ts`, conforme recomendado pelo Next.js;
- `apps/web` passa a executar `next typegen && tsc --noEmit` no `typecheck`, garantindo que os tipos gerados do Next existam antes da validação TypeScript;
- documentação de desenvolvimento atualizada para refletir o comportamento correto.

## 2026-08-26 — Portfolio Engine: tipos financeiros fundamentais

- `CurrencyCode` criado como value object reutilizável e normalizado;
- `Money` criado com moeda explícita e `bigint` em unidades mínimas, sem `float` binário;
- entradas monetárias decimais aceitam `string` e usam arredondamento determinístico half away from zero;
- soma, subtração e comparação rejeitam moedas incompatíveis;
- snapshots monetários serializam unidades mínimas como string inteira para persistência futura segura;
- `Percentage` criado com quatro casas decimais de pontos percentuais e suporte legítimo a valores negativos ou acima de 100%;
- `AllocationWeight` criado com range estrito de 0% a 100%, validado antes do arredondamento;
- erros financeiros e snapshots inválidos usam erros de domínio tipados;
- testes de limites, arredondamento, moedas, snapshots e soma repetida sem drift;
- teste determinístico de round-trip sobre faixa ampla de centavos sem nova dependência property-based;
- auto code review sênior extraiu `CurrencyCode`, tipou erros de snapshot e endureceu o helper de arredondamento para `noUncheckedIndexedAccess`;
- ADR-0005 registra precisão, arredondamento, persistência e separação futura entre dinheiro, preço e quantidade.

## 2026-08-26 — Portfolio Engine: Asset e taxonomias

- `AssetId` criado como identidade interna opaca, estável e independente de ticker/provedor;
- UUID canônico é validado e normalizado sem gerar identidade dentro do domínio;
- `AssetClass` representa exposição econômica e não o veículo de investimento;
- `InstrumentType` representa o veículo/instrumento separadamente de `AssetClass`;
- taxonomia econômica inicial inclui caixa, renda fixa, ações, real estate, commodities, cripto e multi-asset;
- taxonomia de instrumentos inicial inclui caixa, renda fixa, ação, ETF, fundo imobiliário, fundo de investimento e cripto;
- um ETF de ações é `EQUITY + ETF`; um ETF de renda fixa é `FIXED_INCOME + ETF`;
- `Asset` criado como entidade imutável com nome, classe econômica, tipo de instrumento, moeda de referência e identificadores externos opcionais;
- `CurrencyCode` do domínio financeiro é reutilizado como contrato único de moeda;
- `ExternalAssetIdentifier` diferencia `MARKET_SYMBOL`, `ISIN` e `PROVIDER_ID` sem tratá-los como chave primária;
- símbolos de mercado e namespaces são normalizados; provider IDs preservam case quando necessário;
- ativos sem ticker são suportados como cidadãos de primeira classe, inclusive renda fixa;
- identificadores externos duplicados no mesmo ativo são rejeitados;
- dois ativos com o mesmo ticker continuam distintos quando possuem `AssetId` diferentes;
- erros específicos do domínio de ativos foram adicionados;
- testes cobrem identidade, classes, instrumentos, nomes, moedas, identificadores externos e estados inválidos;
- auto code review sênior identificou e corrigiu a mistura conceitual entre classe econômica e veículo de investimento;
- ADR-0006 registra identidade, taxonomias, limites deliberados de ISIN e separação futura do Asset Master.

## 2026-08-26 — Portfolio Engine: agregado Portfolio mínimo

- `PortfolioId` criado como identidade interna estável e semanticamente distinta de `AssetId`;
- validação/normalização de UUID foi centralizada em helper interno para evitar drift entre IDs do domínio;
- `Portfolio` criado com somente identidade, nome e moeda de referência/consolidação;
- nome é normalizado e rejeita vazio, excesso de tamanho e caracteres de controle;
- `CurrencyCode` é reutilizado para a moeda de referência;
- portfolios com o mesmo nome permanecem entidades distintas por `PortfolioId`;
- `PortfolioSnapshot` persiste apenas campos próprios do agregado e hidrata passando pelas mesmas invariantes de criação;
- holdings, saldo de caixa, custo médio, valor de mercado e alocação não são armazenados no agregado;
- ADR-0007 define o futuro transaction ledger como fonte histórica para projeções de posições e saldos;
- testes cobrem identidade, normalização, limites, moeda, snapshot e separação por ID.

## 2026-08-26 — Portfolio Engine: Transaction Ledger e quantidade de ativo

- `AssetQuantity` criado com `bigint` escalado em 12 casas decimais, separado de `Money`;
- quantidade decimal é recebida por `string`, nunca por `number` binário;
- excesso de 12 casas é rejeitado sem arredondamento silencioso;
- quantidade negativa é inválida; zero é permitido no value object, mas compra/venda exige valor maior que zero;
- `TransactionId` criado como identidade interna UUID e independente de corretora/provedor;
- `TransactionTimestamp` exige instante UTC canônico com milissegundos;
- taxonomia inicial contém apenas `BUY`, `SELL`, `CASH_IN` e `CASH_OUT`;
- `Transaction` é imutável e referencia `PortfolioId`/`AssetId`, nunca nomes ou tickers;
- compras/vendas exigem ativo e quantidade; fluxos de caixa proíbem esses campos;
- `settlementAmount` usa `Money`, é sempre positivo e preserva a moeda original da movimentação;
- direção econômica é dada pelo tipo da transação, não por números negativos;
- snapshots são determinísticos e não armazenam holdings, custo médio, P&L ou valor de mercado;
- testes cobrem precisão, IDs, timestamps, taxonomia, shapes inválidos, valores monetários e round-trip;
- ADR-0008 registra semântica do ledger, precisão, tempo e limites deliberados;
- fallback local de quality gate por SHA exato foi formalizado para períodos em que GitHub Actions não puder iniciar por billing/infra.

## 2026-08-26 — Portfolio Engine: projeção de posições por ativo

- `AssetPosition` criado como estrutura derivada com somente `AssetId` e `AssetQuantity`;
- `projectAssetPositions` reconstrói posições abertas exclusivamente a partir dos fatos do Transaction Ledger;
- fatos são isolados por `PortfolioId` antes de qualquer regra de posição;
- `BUY` soma e `SELL` subtrai `scaledUnits` exatos, sem `number` binário nem novo arredondamento;
- `CASH_IN` e `CASH_OUT` não alteram posições de ativos;
- venda acima da posição disponível lança `InsufficientAssetPositionError` com contexto auditável e nunca produz quantidade negativa;
- venda total remove o ativo da projeção atual, preservando o histórico somente no ledger;
- eventos são processados por `occurredAt`; empates preservam a ordem de entrada porque `TransactionId` não representa cronologia;
- resultado é ordenado por `AssetId` para manter saída estável;
- não entram ticker, preço, `settlementAmount`, custo médio, P&L, FX, persistência, API ou UI;
- testes cobrem portfolio vazio, compras, venda parcial/total, over-sell, múltiplos ativos, isolamento entre portfolios, cash flows, precisão e ordenação reproduzível;
- ADR-0009 registra fonte de verdade, ordem de eventos, política sem short selling e tratamento de posições zeradas;
- auto code review sênior confirmou fronteira `position` separada para evitar ciclo `portfolio ↔ transaction` e ausência de dependências/supply-chain novas.

## 2026-08-26 — Portfolio Engine: TargetAllocation

- `TargetAllocation` criado como configuração imutável e separada vinculada explicitamente a `PortfolioId`;
- buckets usam `AssetClass` como identidade econômica e `AllocationWeight` como contrato único de peso;
- pesos são somados com representação decimal exata e a política exige total de `100.0000%`;
- buckets presentes exigem peso maior que zero; classe ausente representa alvo zero;
- duplicidades são rejeitadas após normalização de `AssetClass`;
- `targetWeightFor` devolve o peso configurado ou `AllocationWeight.zero()` para classe ausente;
- buckets e snapshots são ordenados lexicalmente por código de classe para resultado determinístico;
- round-trip de snapshot reaplica as mesmas invariantes da criação;
- não entram posição atual, preço, ticker, instrumento, geografia, gap, recomendação de aporte, persistência, API ou UI;
- testes cobrem política de um/múltiplos buckets, soma exata, total abaixo/acima, duplicidade, peso zero, isolamento por portfolio e snapshot determinístico;
- ADR-0010 registra a escolha inicial por `AssetClass`, soma completa de 100%, semântica de peso zero e limites deliberados da taxonomia;
- não há nova dependência, lockfile, integração externa ou mudança de supply chain.

## 2026-08-26 — Portfolio Engine: AllocationGap

- módulo `contribution` iniciado com `calculateAllocationGaps` como cálculo puro e derivado;
- entrada associa explicitamente a base atual ao mesmo `PortfolioId` da `TargetAllocation`;
- valores atuais usam `Money`, precisam ser não negativos, de moeda única, sem buckets duplicados e reconciliados exatamente com `totalValue`;
- valores-alvo são calculados somente com `bigint` a partir de `AllocationWeight`;
- arredondamento monetário usa maiores restos e desempate lexical por `AssetClass`, garantindo que a soma dos valores-alvo seja exatamente igual ao total em centavos;
- classe-alvo sem posição atual usa valor atual zero; classe atual sem alvo permanece visível com peso/valor-alvo zero;
- gap é `max(0, targetValue - currentValue)` e nunca produz valor negativo silencioso;
- saída é imutável e ordenada lexicalmente por `AssetClass`;
- o cálculo representa o estado atual e não incorpora aporte futuro, preço, FX, valuation, Asset Master ou recomendação;
- erros de portfolio, duplicidade, valor negativo e reconciliação são tipados; divergência de moeda reutiliza `CurrencyMismatchError`;
- testes cobrem alvo exato, under/overweight, classes ausentes, moeda, duplicidade, reconciliação, arredondamento residual, portfolios distintos, negativos e determinismo;
- ADR-0011 registra a política de reconciliação em centavos e a fronteira com o futuro `ContributionAllocator`;
- não há nova dependência, lockfile, schema, persistência ou integração externa.

## 2026-08-26 — Portfolio Engine: ContributionAllocator

- `allocateContribution` criado como função pura para transformar política-alvo, estado atual reconciliado e aporte em plano por `AssetClass`;
- a base monetária do alvo usa explicitamente `portfolioValue + contribution`, evitando aplicar gaps pré-aporte como se fossem pós-aporte;
- estado atual continua exigindo uma moeda, valores não negativos, buckets sem duplicidade e soma exata igual ao `portfolioValue`;
- `TargetAllocation` precisa pertencer ao mesmo `PortfolioId` e o aporte precisa usar a mesma moeda da carteira;
- cálculo monetário usa somente `Money`/`bigint`, sem `number` binário;
- a política de maiores restos foi extraída para helper interno compartilhado e passou a ser reutilizada tanto por `AllocationGap` quanto pelo allocator;
- necessidade pós-aporte é `max(0, postContributionTargetValue - currentValue)`;
- somente necessidades positivas participam da distribuição e buckets overweight recebem zero;
- o baseline distribui proporcionalmente às necessidades positivas, reconcilia centavos por maiores restos e desempata lexicalmente por `AssetClass`;
- nenhuma alocação ultrapassa a necessidade do bucket nem a soma do aporte disponível;
- eventual parcela não distribuível permanece explicitamente em `unallocatedContribution`, sem inventar destino;
- saída inclui a união entre classes atuais e alvo, ordenada e imutável para auditabilidade;
- testes cobrem aporte zero, carteira no alvo, necessidade única/múltipla, overweight, pós-aporte, centavos, moedas, portfolio, estado atual inválido, limites e determinismo;
- ADR-0012 registra fórmula, arredondamento, sobra de caixa e fronteira com políticas futuras;
- não há nova dependência, lockfile, schema, persistência ou integração externa.
