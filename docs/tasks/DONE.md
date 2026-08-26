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

## 2026-08-26 — Portfolio Engine: política de microaporte e limite de destinos

- `applyContributionPolicy` criado como camada pura sobre o `ContributionPlan`, preservando o baseline econômico do `ContributionAllocator`;
- `minimumMeaningfulContribution` usa `Money`, precisa ser não negativo e da mesma moeda do plano;
- `maxDestinationsPerContribution` é validado como inteiro positivo seguro e possui erro de domínio tipado;
- somente classes com necessidade pós-aporte positiva podem ser destinos;
- quando o limite é restritivo, destinos são priorizados por maior necessidade pós-aporte e desempate lexical por `AssetClass`;
- distribuição entre destinos selecionados reutiliza maiores restos e unidades monetárias inteiras;
- alocação positiva abaixo do mínimo remove o destino da rodada e dispara redistribuição entre os restantes;
- a política nunca infla um microaporte apenas para alcançar o mínimo;
- nenhuma alocação excede a necessidade do bucket e a soma nunca excede o aporte;
- valor que não pode ser distribuído sob as restrições permanece em `unallocatedContribution`;
- mínimo zero e limite não restritivo preservam o resultado baseline;
- testes cobrem limite amplo, limite de um destino, empate, aporte pequeno, redistribuição, cap por necessidade, combinação de mínimo/limite, moeda, configuração inválida, imutabilidade e determinismo;
- ADR-0013 registra ordem de seleção, política de mínimo, reconciliação e fronteira com unidade mínima negociável/elegibilidade;
- não há nova dependência, lockfile, schema, persistência ou integração externa.

## 2026-08-26 — Portfolio Engine: restrições de execução do aporte

- `applyContributionExecutionConstraints` criado como camada pura posterior ao `ContributionPlan` e à política de microaporte;
- cada `AssetClass` com alocação monetária positiva exige exatamente um destino previamente escolhido, evitando introduzir ranking de ativos nesta etapa;
- destinos usam `AssetId` como identidade e não dependem de ticker/provider;
- elegibilidade é explícita e validada em runtime;
- `minimumTradableQuantity` reutiliza `AssetQuantity`, com `bigint` escalado em 12 casas e exigência adicional de valor estritamente positivo;
- zero, negativo e shape inválido de quantidade mínima são rejeitados por erro tipado;
- destino elegível preserva exatamente a alocação monetária já calculada;
- destino inelegível não recebe recomendação por ativo e seu valor retorna para `unallocatedContribution`;
- valores bloqueados não são redistribuídos, preservando a decisão econômica anterior;
- nenhuma conversão `Money ↔ AssetQuantity` ocorre sem preço;
- testes cobrem elegível/inelegível, mistura de destinos, ausência de destino, quantidade mínima, duplicidades, shape de elegibilidade, identidade por `AssetId`, integração com microaporte, imutabilidade e determinismo;
- `FINANCIAL-METHODOLOGY.md` diferencia quantidade mínima negociável de futuro valor monetário mínimo derivado de preço;
- ADR-0014 registra a fronteira entre decisão econômica, restrição operacional e futura etapa de preço/quantidade;
- não há nova dependência, lockfile, schema, persistência ou integração externa.

## 2026-08-26 — Portfolio Engine: limites de concentração por AssetClass

- `applyAssetClassConcentrationLimits` criado como camada pura sobre `ContributionPlan`;
- `softMaxWeight` e `hardMaxWeight` usam `AllocationWeight` e configuração duplicada por `AssetClass` é rejeitada;
- a política exige `softMaxWeight <= hardMaxWeight` e erros de configuração são tipados no domínio de contribuição;
- o denominador de concentração é o `postContributionValue` já calculado pelo allocator;
- limite duro é convertido em teto monetário usando somente `bigint` e unidades escaladas de peso;
- a camada preserva a parcela da alocação que cabe no hard limit e bloqueia apenas o excedente;
- classe já acima do hard limit não recebe novo aporte, sem venda ou rebalanceamento implícito;
- `softMaxWeight` é alert-only na primeira versão e sinaliza `softLimitExceeded` sem reduzir valor sozinho;
- `blockedAmount` registra por classe a parcela cortada pelo hard limit;
- valor bloqueado é somado ao `unallocatedContribution` upstream sem redistribuição silenciosa;
- classes sem limite preservam exatamente o comportamento anterior;
- testes cobrem soft/hard, igualdade de limites, centavos, configuração inválida, múltiplas classes, sobra upstream, imutabilidade e determinismo;
- ADR-0015/D-023 registram fórmula, precisão, semântica soft/hard e fronteira com concentração futura mais granular;
- não há nova dependência, lockfile, schema, persistência ou integração externa.

## 2026-08-26 — Portfolio Engine: custos e impactos tributários do aporte

- `applyContributionCostTaxConstraints` criado como camada pura posterior ao `ContributionExecutionPlan`;
- configuração de custo é vinculada a `AssetId` já presente no plano de execução, sem ticker/provider;
- `transactionCost` e `estimatedTaxImpact` permanecem campos monetários separados e usam `Money`;
- valores precisam ser não negativos e usar a mesma moeda do aporte;
- ausência de configuração para um destino significa custo conhecido zero;
- configuração duplicada ou para `AssetId` fora do plano é rejeitada por erro tipado;
- `allocatedAmount` permanece como orçamento bruto para provenance;
- destino executável expõe `totalKnownCost` e `investableAmount = allocatedAmount - totalKnownCost`;
- quando custos conhecidos igualam ou superam a alocação, o destino recebe `BLOCKED_KNOWN_COSTS`, valor investível zero e o orçamento bruto retorna para `unallocatedContribution`;
- custo hipotético de operação bloqueada não é debitado;
- `estimatedTaxImpact` é somente valor fornecido/reservado pelo chamador: o domínio não calcula imposto nem inventa regra fiscal;
- não existe redistribuição automática após bloqueio por custo;
- testes cobrem custo zero/positivo, impacto tributário, combinação, igualdade/excesso, moedas, negativos, duplicidade, custo órfão, múltiplos destinos, centavos, integração, imutabilidade e determinismo;
- ADR-0016/D-024 registram reconciliação, semântica tributária e fronteira com adapters externos;
- não há nova dependência, lockfile, schema, persistência ou integração externa.

## 2026-08-26 — Portfolio Engine: orquestração e snapshot auditável do aporte

- `buildContributionRecommendationSnapshot` criado como orquestrador puro do pipeline canônico de aporte;
- ordem fixa: allocator -> política de microaporte -> concentração por `AssetClass` -> restrições de execução -> custos/impacto tributário;
- o orquestrador reutiliza as funções existentes e não reimplementa fórmulas financeiras;
- entrada composta reutiliza os contratos das cinco camadas e recebe `methodologyVersion` explicitamente;
- snapshot final usa somente strings/números/booleanos/enums serializáveis, sem `bigint` ou value objects expostos;
- por decisão material, preserva valores atual/alvo/need, alocação baseline, após política e após concentração;
- thresholds soft/hard, valor bloqueado, elegibilidade, unidade mínima, custos e valor investível permanecem auditáveis;
- reason codes têm ordem estável e sobrevivem a bloqueios posteriores;
- status final diferencia política, concentração, inelegibilidade, custo e destino executável;
- custo conhecido bloqueado permanece visível, mas `consumedKnownCost` fica zero porque a operação não ocorre;
- agregado reconcilia aporte como valor investível + custos efetivamente consumidos + sobra final;
- erros tipados das camadas internas propagam sem wrapping genérico;
- snapshot e coleções internas são congelados e reproduzíveis para a mesma entrada;
- `methodologyVersion` vazia ou com whitespace periférico é rejeitada por erro tipado;
- ADR-0017/D-025 registram ordem do pipeline, reason codes, reconciliação e fronteira com provenance externo;
- não há nova dependência, lockfile, schema, persistência, API, UI ou integração externa.

## 2026-08-26 — Portfolio Engine: testes de invariantes do pipeline de aporte

- suíte property-style determinística adicionada sobre `buildContributionRecommendationSnapshot` sem dependência nova;
- corpus executa 512 cenários reproduzíveis identificados por seed explícita;
- cenários variam de uma a quatro classes, distribuição atual reconciliada, pesos-alvo positivos somando exatamente 100%, aporte zero/centavos/valores maiores, política de microaporte, concentração, elegibilidade e custos;
- gerador de custos cria apenas constraints para destinos que realmente sobreviveram às camadas anteriores, mantendo o corpus válido sem mascarar erros do pipeline final;
- custos exercitam regimes zero, menor, igual e maior que o orçamento bruto do destino;
- invariantes provam reconciliação `contribution = investable + consumedKnownCost + unallocated`, valores não negativos e agregados por decisão;
- sobra cumulativa é validada como monotônica entre allocator, política, concentração, execução e custos;
- hard limits são recalculados independentemente a partir do snapshot e nunca permitem novo aporte positivo acima do teto monetário;
- destino bloqueado nunca possui valor investível positivo e custo consumido nunca supera o orçamento de concentração;
- decisões e reason codes preservam ordenação estável;
- mesma entrada é executada novamente e precisa produzir snapshot estruturalmente idêntico e JSON byte-for-byte estável;
- `JSON.stringify`/`JSON.parse` validam que o snapshot final não depende de `bigint` ou value objects na fronteira serializada;
- falha do corpus inclui seed e parâmetros primitivos suficientes para reprodução;
- auto code review do gerador identificou e corrigiu correlação entre quantidade de classes e modo de concentração, garantindo cobertura estrutural de hard limit exato/parcial/total;
- a suíte exige cobertura observada de aporte zero, poucos centavos, uma/múltiplas classes, ajuste de política, hard limit exato/parcial/total, inelegibilidade e custos executáveis/bloqueados;
- nenhum código de produção, fórmula financeira, lockfile ou dependência externa foi alterado;
- nenhum ADR novo foi necessário porque o vertical apenas verifica contratos já aceitos, sem criar decisão arquitetural/financeira nova.

## 2026-08-26 — Produto MVP: contratos de domínio do onboarding financeiro

- módulo `onboarding` adicionado ao pacote de domínio sem dependência de `Portfolio`, autenticação, persistência ou UI;
- `FinancialProfileId` e `FinancialGoalId` usam UUID canônico fornecido pelo caller e permanecem identidades distintas;
- `FinancialProfile` registra moeda de referência, tolerância a risco, horizonte, alvo opcional da reserva e objetivos;
- tolerância a risco usa taxonomia explícita `LOW`/`MEDIUM`/`HIGH`, sem score ou suitability implícito;
- horizonte usa taxonomia explícita `SHORT`/`MEDIUM`/`LONG`, sem converter anos automaticamente;
- alvo de reserva usa `Money`, é opcional, estritamente positivo e não representa saldo atual;
- objetivos usam tipos `NET_WORTH`, `PASSIVE_INCOME_MONTHLY`, `RETIREMENT` e `DATED_PURPOSE`;
- `PASSIVE_INCOME_MONTHLY` explicita a periodicidade da meta monetária;
- todo objetivo exige `targetAmount` positivo e moeda compatível com o perfil;
- `targetDate` usa data civil canônica `YYYY-MM-DD`; `DATED_PURPOSE` exige data e os demais tipos podem tê-la opcionalmente;
- datas não são comparadas com o relógio do processo, preservando determinismo;
- objetivos duplicados por identidade normalizada são rejeitados e a coleção é copiada/ordenada por ID sem tratar ordem de entrada como prioridade;
- snapshots usam somente strings/arrays/snapshots de `Money`, suportam round-trip e JSON determinístico sem `bigint` exposto;
- entradas runtime malformadas relevantes falham com erros tipados em vez de `TypeError` acidental;
- testes cobrem horizontes/risco, IDs, reserva nula/positiva/inválida, moeda, tipos de objetivo, datas, duplicidade, snapshot, round-trip e isolamento de mutabilidade;
- ADR-0018/D-026 registram a separação entre perfil declarativo, carteira, saldos e recomendação;
- `docs/tasks/NEXT.md` promove o fluxo web de onboarding como próximo vertical do MVP;
- nenhuma dependência, lockfile, schema, autenticação, persistência, API ou regra de recomendação foi adicionada.

## 2026-08-26 — Produto MVP: fluxo web do onboarding financeiro

- rota `/onboarding` adicionada como primeiro fluxo utilizável do MVP;
- fluxo dividido em perfil, reserva, objetivos e revisão, com progresso explícito;
- moeda de referência permanece texto na UI; valores monetários não passam por `number` ou `parseFloat`;
- vírgula decimal da entrada brasileira é normalizada apenas como representação textual antes de `Money.fromDecimal`;
- tolerância a risco e horizonte reutilizam as taxonomias fechadas exportadas pelo domínio;
- meta da reserva é opcional e a interface deixa explícito que representa alvo, não saldo atual;
- objetivos podem ser adicionados/removidos e usam tipo, valor-alvo e data-alvo;
- `DATED_PURPOSE` apresenta data como obrigatória, mas a regra continua sendo validada por `FinancialGoal.create`;
- `FinancialProfile.create` e `FinancialGoal.create` permanecem fonte de verdade das invariantes financeiras;
- erros tipados do domínio são traduzidos para feedback de campo sem duplicar regras financeiras no componente;
- IDs são gerados na camada web por `crypto.randomUUID`, nunca dentro do domínio;
- etapa final renderiza `FinancialProfileSnapshot` validado pelo domínio;
- estado permanece exclusivamente local/efêmero e a interface informa que não existe salvamento automático;
- home passa a oferecer o onboarding como ação principal e mantém `/health` como utilitário secundário;
- layout possui stepper lateral no desktop e compacto no mobile, sem dashboard ou métricas fictícias;
- controles possuem labels semânticas, fieldsets, foco visível, `aria-invalid`, `aria-describedby` e resumo acessível de erros;
- auto review sênior removeu anúncios duplicados de erros, reforçou foco por teclado e ajustou microcopy para não confundir tolerância declarada com suitability;
- testes puros cobrem reducer, adicionar/remover objetivos, dinheiro, reserva, datas, erros e geração do snapshot;
- renderização estática testa estrutura acessível, labels, grupos de escolha, progresso e aviso de estado local;
- `apps/web` passa a declarar dependência workspace explícita de `@portfolio-copilot/domain`;
- nenhuma dependência externa, API, autenticação, persistência, Market Data, IA ou fórmula financeira nova foi adicionada;
- `docs/tasks/NEXT.md` promove o dashboard base com estados vazios honestos como próximo vertical da Fase 3.

## 2026-08-26 — Produto MVP: dashboard base com estados honestos

- rota `/dashboard` adicionada e a raiz passa a direcionar para o dashboard como superfície principal do MVP;
- shell visual reutilizável criado com marca, navegação para dashboard/onboarding, utilitário de saúde e skip link;
- dashboard é server-rendered e não adiciona estado cliente, fetch ou dependência externa sem necessidade;
- patrimônio total, aporte do mês e reserva de emergência aparecem como estados indisponíveis explicados, nunca como zero ou valor demonstrativo;
- a interface deixa explícito que o onboarding continua local/efêmero e ainda não alimenta o dashboard;
- região de carteira usa estado vazio sem gráfico, holdings, patrimônio, pesos ou desvios fictícios;
- objetivos e reserva distinguem indisponibilidade de ausência real, evitando inferir que o usuário não configurou algo;
- próximos passos seguem a dependência real do MVP: onboarding -> carteira -> aporte;
- layout reutiliza a linguagem visual clara do onboarding, com uma única superfície principal, separadores e hierarquia responsiva em vez de grade de métricas fake;
- navegação e ações principais possuem foco visível, `aria-current`, labels semânticas e link para pular ao conteúdo;
- testes de renderização estática cobrem navegação, copy crítica, estados vazios e ausência de valores monetários/percentuais fictícios;
- auto review sênior manteve loading/error fora do vertical porque nenhuma fonte assíncrona existe ainda; simular esses estados seria menos honesto que representar indisponibilidade real;
- nenhuma fórmula financeira, persistência, API, autenticação, Market Data, IA, lockfile ou dependência externa foi adicionada;
- `docs/tasks/NEXT.md` promove carteira base com cadastro local do agregado `Portfolio` como próximo vertical da Fase 3.
