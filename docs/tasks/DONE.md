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
- auto code review sênior removeu anúncios duplicados de erros, reforçou foco por teclado e ajustou microcopy para não confundir tolerância declarada com suitability;
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

## 2026-08-26 — Produto MVP: carteira base com cadastro local do Portfolio

- rota `/portfolio` adicionada ao shell do produto e a navegação passa a cobrir dashboard, carteira e onboarding;
- formulário mínimo recebe somente nome e moeda de referência, sem holdings, patrimônio, preço ou alocação inventados;
- IDs locais são gerados por `crypto.randomUUID` na camada web e validados por `PortfolioId`;
- moeda passa por `CurrencyCode` e a criação final passa por `Portfolio.create`, mantendo o domínio como fonte de verdade;
- erros tipados de nome, moeda e identidade são traduzidos para feedback acessível sem duplicar invariantes no componente;
- estado permanece local/efêmero e a interface informa explicitamente que recarregar a página remove a carteira;
- após criação, a UI apresenta somente o `PortfolioSnapshot` validado: identidade, nome e moeda de referência;
- posições permanecem em estado vazio explícito e são descritas como projeção futura do Transaction Ledger, nunca como holdings editáveis;
- dashboard passa a oferecer acesso à carteira, mas continua informando corretamente que não recebe esse estado enquanto não houver persistência;
- layout segue o shell visual existente, com formulário principal, rail explicativo e estado validado responsivo;
- testes puros cobrem criação, normalização e tradução de erros; renderização estática cobre navegação, formulário, snapshot, posições vazias e ausência de métricas fictícias;
- nenhuma dependência externa, lockfile, fórmula financeira, persistência, API, autenticação, Market Data ou IA foi adicionada;
- `docs/tasks/NEXT.md` promove cadastro local do Transaction Ledger, iniciando por `CASH_IN`/`CASH_OUT`, como próximo vertical da Fase 3.

## 2026-08-26 — Produto MVP: Transaction Ledger local com fluxos de caixa

- `/portfolio` passa a registrar `CASH_IN` e `CASH_OUT` somente após existir um `PortfolioSnapshot` validado na sessão;
- identidade, `PortfolioId`, tipo e timestamp passam por `TransactionId`, `PortfolioId`, `TransactionType` e `TransactionTimestamp` antes da criação;
- valor monetário permanece texto na UI, aceita vírgula ou ponto decimal e passa por `Money.fromDecimal` sem `number` binário;
- settlement usa a moeda de referência do portfolio enquanto FX permanece fora de escopo;
- cada movimentação é criada por `Transaction.create` e a lista apresenta snapshots reais do domínio, com valor, timestamp e identidade auditáveis;
- `BUY` e `SELL` aparecem explicitamente indisponíveis até existir seleção real de `Asset`, sem pedir UUID interno como atalho de UX;
- cash flows não carregam `AssetId`/quantidade e a UI mantém posições de ativos vazias mesmo quando o ledger possui movimentações;
- a interface não calcula saldo, patrimônio, custo médio, P&L ou qualquer outra métrica financeira a partir dos cash flows;
- carteira e ledger continuam local/efêmeros; recarregar ou sair da tela remove todo o estado da sessão;
- formulário usa fieldset, radios nativos, feedback por `aria-invalid`/`aria-describedby` e estados desabilitados explícitos;
- layout do ledger reutiliza o sistema visual da carteira e colapsa para uma coluna em viewports menores;
- testes puros cobrem `CASH_IN`, `CASH_OUT`, vínculo ao portfolio, normalização decimal, valor inválido/zero e falhas técnicas de ID/timestamp;
- testes de renderização estática cobrem controles do ledger, estado vazio, snapshots reais e ausência de posições fictícias para cash flows;
- metadata de `/portfolio` passa a descrever também os fluxos de caixa locais;
- nenhuma dependência externa, lockfile, fórmula financeira, persistência, API, autenticação, Market Data ou IA foi adicionada;
- `docs/tasks/NEXT.md` promove Asset local + `BUY`/`SELL` como próximo vertical da Fase 3.

## 2026-08-26 — Produto MVP: Asset local, BUY/SELL e posições derivadas

- `/portfolio` passa a manter um catálogo local de `Asset` após existir um `Portfolio` válido na sessão;
- criação de ativos reutiliza `AssetId`, `AssetClass`, `InstrumentType`, `CurrencyCode` e `Asset.create`, sem ticker, provider ou Asset Master improvisado;
- UUID de ativo é gerado por `crypto.randomUUID` na camada web e nunca é solicitado como campo primário do usuário;
- compra e venda selecionam o ativo por nome e classe visíveis, resolvendo `AssetId` internamente;
- `BUY`/`SELL` reutilizam `Transaction`, `TransactionId`, `TransactionTimestamp`, `AssetQuantity` e `Money`, mantendo quantidade e valor como strings até os Value Objects;
- cada transação candidata é validada junto do ledger atual por `projectAssetPositions` antes de entrar no estado da sessão;
- venda acima da posição disponível é rejeitada por `InsufficientAssetPositionError` e traduzida para feedback de quantidade sem gravar fato inválido;
- o ledger permanece em ordem cronológica de criação e a UI inverte somente a apresentação, preservando a semântica de desempate por ordem de entrada do projetor;
- `CASH_IN`/`CASH_OUT` continuam disponíveis e não alteram posições de ativos;
- a seção de posições usa exclusivamente `projectAssetPositions` e mostra somente quantidade aberta por ativo;
- histórico do ledger formata a quantidade diretamente do `AssetQuantitySnapshot`, sem usar projeção de posição para representar um fato individual;
- nenhum preço, valor de mercado, patrimônio, custo médio ou P&L é derivado das quantidades;
- carteira, ativos, ledger e posições permanecem explicitamente locais/efêmeros;
- testes puros cobrem Asset, taxonomias, BUY/SELL, precisão de quantidade, vínculo portfolio/asset, cash flows, projeção e over-sell;
- renderização estática cobre seleção humana de ativo, bloqueio sem Asset, histórico, posição derivada e ausência de métricas fictícias;
- layout preserva acessibilidade, foco e responsividade sem adicionar dependência externa;
- nenhuma dependência, lockfile, fórmula financeira, persistência, API, autenticação, Market Data ou IA foi adicionada;
- `docs/tasks/NEXT.md` promove `TargetAllocation` local e baseline do aporte por `AssetClass`, usando base monetária manual explícita até existir Market Data.

## 2026-08-26 — Produto MVP: TargetAllocation local e baseline do aporte

- `/portfolio` passa a incluir um painel local de aporte vinculado ao `PortfolioId` da carteira atual;
- pesos-alvo são strings por `AssetClass` e passam por `TargetAllocation.create`, mantendo duplicidade, range, peso zero e soma exata de 100% no domínio;
- valores atuais por classe são declarados manualmente e permanecem explicitamente separados das quantidades projetadas pelo Transaction Ledger;
- `portfolioValue`, valores atuais e aporte passam por `Money` na moeda de referência do Portfolio, sem `number` binário;
- valores atuais precisam reconciliar exatamente com a base total pelas invariantes do domínio;
- `allocateContribution` é a única fonte para valor pós-aporte, necessidade por classe, baseline alocado e `unallocatedContribution`;
- o estado cliente armazena somente snapshots serializáveis do resultado, sem Value Objects ou `bigint`;
- a UI mostra base, aporte, total pós-aporte, necessidade, baseline e sobra reais, sem escolher Asset destino;
- quantidade, preço, valor de mercado, patrimônio, custo médio, P&L ou conversão `Money ↔ AssetQuantity` não são inferidos;
- `TargetAllocation`, base monetária manual e baseline permanecem locais/efêmeros e a limitação é explícita no painel;
- o painel é um componente isolado do `PortfolioWorkspace`, recebendo apenas o `PortfolioSnapshot` e não o ledger/posições;
- formulários usam labels semânticas, tabela acessível, estados de erro e navegação por teclado; tabelas têm scroll horizontal responsivo;
- testes puros cobrem alvo válido/inválido, reconciliação, negativos, aporte zero/positivo, moeda BRL/USD e baseline determinístico;
- renderização estática cobre estado manual vazio e resultado real sem métricas/valuation fictícios;
- metadata de `/portfolio` passa a descrever o baseline local com base manual;
- nenhuma dependência, lockfile, fórmula financeira, persistência, API, autenticação, Market Data ou IA foi adicionada;
- `docs/tasks/NEXT.md` promove a política local de microaporte e limite de destinos por `AssetClass` usando `applyContributionPolicy`.

## 2026-08-27 — Produto MVP: política local de microaporte e limite de destinos

- o painel de aporte em `/portfolio` passa a aplicar uma segunda etapa somente depois de existir um baseline válido do allocator;
- `minimumMeaningfulContribution` permanece string na UI e passa por `Money` na moeda de referência do Portfolio, sem `number` binário;
- `maxDestinationsPerContribution` é convertido apenas como configuração inteira e a validade final de inteiro positivo seguro permanece no domínio;
- `applyContributionPolicy` é a única fonte de priorização de classes, corte de microaportes, redistribuição entre destinos remanescentes e sobra pós-política;
- o adapter reidrata um `ContributionPlan` transitório a partir do snapshot validado e devolve somente snapshots serializáveis para o estado cliente;
- baseline e resultado pós-política aparecem lado a lado por `AssetClass`, mantendo o valor original auditável;
- classes com baseline positivo e alocação final zero são marcadas apenas como “Removida pela política”; a UI não inventa causa específica entre mínimo e limite porque o contrato atual não expõe reason code isolado;
- classes sem baseline permanecem distintas de classes removidas pela política;
- `unallocatedContribution` após a política continua explícito e nenhum destino é inventado para a sobra;
- edição da base invalida baseline e política; edição apenas da configuração de política invalida somente o resultado pós-política;
- política e resultados permanecem locais/efêmeros e a limitação continua explícita no painel;
- controles usam labels, `aria-invalid`, `aria-describedby`, mensagens tipadas e tabelas responsivas com scroll horizontal;
- testes puros cobrem mínimo vazio/zero/negativo/inválido, limite amplo/restritivo/inválido, redistribuição, classe removida, classe sem baseline e sobra;
- renderização estática cobre estados sem baseline, baseline validado e política aplicada sem preço, quantidade ou Asset destino inventados;
- metadata de `/portfolio` passa a descrever baseline e política operacional do aporte;
- nenhuma dependência, lockfile, fórmula financeira, persistência, API, autenticação, Market Data, FX ou IA foi adicionada;
- `docs/tasks/NEXT.md` promove destino local por `AssetClass` + elegibilidade + quantidade mínima usando `applyContributionExecutionConstraints`.

## 2026-08-27 — Produto MVP: destinos locais e restrições de execução do aporte

- `/portfolio` passa a usar os Assets locais da própria sessão como candidatos explícitos aos destinos do aporte;
- a etapa de execução só é liberada após existir baseline e política de aporte válidos;
- somente `AssetClass` com alocação monetária positiva após a política exige destino de execução;
- candidatos são filtrados pela mesma `AssetClass` e apresentados por nome e instrumento, mantendo `AssetId` interno à interface;
- cada classe recebe no máximo um destino local explícito, sem ranking ou seleção automática de ativo;
- elegibilidade é declarada explicitamente como elegível ou inelegível antes da validação do plano;
- `minimumTradableQuantity` permanece string na UI e passa por `AssetQuantity`, preservando precisão exata de até 12 casas decimais;
- quantidade mínima é apresentada somente como restrição operacional e nunca como quantidade recomendada ou comprável;
- `applyContributionExecutionConstraints` é a única fonte para destinos executáveis e `unallocatedContribution` após as restrições;
- destino elegível preserva exatamente a alocação monetária recebida da política;
- destino inelegível fica bloqueado e seu valor retorna para a sobra explícita, sem redistribuição silenciosa;
- a UI preserva lado a lado valor após política, destino escolhido, quantidade mínima e resultado após restrições;
- ausência de Asset local para uma classe positiva é mostrada como estado indisponível real, sem inventar ticker ou destino;
- erros de destino ausente/inválido, elegibilidade, quantidade mínima e duplicidade são traduzidos para feedback acessível;
- editar baseline ou política invalida naturalmente a etapa de execução, mantendo provenance entre as camadas;
- toda configuração e resultado continuam locais/efêmeros e desaparecem com a sessão;
- testes cobrem destinos elegíveis/inelegíveis, classe sem candidato, destino ausente, Asset errado, duplicidade, quantidade mínima inválida e plano sem alocações positivas;
- nenhuma conversão `Money ↔ AssetQuantity`, preço, Market Data, FX, ordem de corretora, persistência ou fórmula financeira nova foi adicionada;
- `docs/tasks/NEXT.md` promove limites locais de concentração por `AssetClass` como próximo vertical, preservando a ordem canônica `allocator -> policy -> concentration -> execution`.

## 2026-08-27 — Produto MVP: limites locais de concentração por AssetClass

- `/portfolio` passa a inserir uma etapa explícita de concentração entre política e restrições de execução do aporte;
- limites são configurados opcionalmente por `AssetClass`, sem valores padrão inventados;
- cada classe usa `softMaxWeight` e `hardMaxWeight` como strings até a validação por `AllocationWeight`;
- classes sem configuração preservam exatamente a alocação pós-política;
- `applyAssetClassConcentrationLimits` é a única fonte para alocação pós-concentração, `blockedAmount`, flags soft/hard e sobra acumulada;
- soft limit é alert-only e nunca reduz valor sozinho;
- hard limit bloqueia somente a parcela de novo aporte que ultrapassaria o teto;
- classe já acima do hard limit não recebe novo aporte e nenhuma venda ou rebalanceamento é inferido;
- valor bloqueado permanece explícito em `blockedAmount` e é somado a `unallocatedContribution` sem redistribuição;
- a UI mostra lado a lado valor após política, após concentração, thresholds, valor bloqueado e estado;
- limites são opt-in, com feedback acessível para peso inválido e faixa `soft > hard`;
- a etapa de execução passa a consumir exclusivamente o snapshot pós-concentração;
- classes zeradas pelo hard limit deixam de gerar destino de execução;
- Assets continuam selecionados por contexto humano e `AssetId` permanece interno;
- toda configuração e resultado continuam locais e efêmeros;
- testes cobrem ausência de limite, soft alert-only, hard parcial, hard total/classe acima do teto, configuração inválida e integração com destinos de execução;
- nenhuma fórmula financeira nova, preço, Market Data, FX, venda, redistribuição, ranking de Asset ou conversão `Money ↔ AssetQuantity` foi adicionada;
- `docs/tasks/NEXT.md` promove custos conhecidos e impacto tributário reservado via `applyContributionCostTaxConstraints` como próximo vertical.

## 2026-08-27 — Produto MVP: custos conhecidos e impacto tributário reservado do aporte

- `/portfolio` passa a inserir custos conhecidos como etapa explícita posterior às restrições de execução;
- somente destinos já validados como executáveis recebem configuração de custos;
- destinos bloqueados por inelegibilidade permanecem fora desta etapa e não recebem custos hipotéticos;
- `transactionCost` e `estimatedTaxImpact` permanecem strings na UI e são convertidos para `Money` na moeda do aporte;
- campo monetário vazio representa custo conhecido zero, sem tarifa padrão inventada;
- `estimatedTaxImpact` representa somente uma reserva monetária informada pelo usuário e não imposto calculado pelo domínio;
- `applyContributionCostTaxConstraints` é a única fonte para `totalKnownCost`, `investableAmount`, status e sobra após custos;
- orçamento bruto herdado da execução permanece explícito e não é sobrescrito pelo valor investível;
- quando o custo conhecido total é menor que o orçamento bruto, somente `investableAmount` é reduzido;
- quando o custo conhecido total é igual ou superior ao orçamento bruto, o destino é bloqueado e `investableAmount` fica zero;
- em destino bloqueado por custos, o orçamento bruto inteiro retorna para `unallocatedContribution` e nenhum custo hipotético é debitado;
- a sobra acumulada das etapas anteriores é preservada e não existe redistribuição automática após custos;
- a UI mostra lado a lado orçamento bruto, custo transacional, reserva tributária, custo conhecido total, valor investível e estado;
- editar a execução invalida naturalmente a etapa de custos, evitando resultado órfão ou stale;
- configuração e resultado continuam locais e efêmeros;
- testes cobrem custo zero, custos abaixo do orçamento, igualdade, excesso, valores inválidos/negativos, destino desconhecido e duplicidade;
- nenhuma regra fiscal, consulta de tarifa, preço, Market Data, FX, spread, slippage, execução de ordem ou conversão `Money ↔ AssetQuantity` foi adicionada;
- nenhuma dependência, lockfile, domínio ou fórmula financeira nova foi alterada;
- `docs/tasks/NEXT.md` promove `buildContributionRecommendationSnapshot` como próximo vertical para consolidar provenance, status, reason codes e reconciliação do pipeline completo.

## 2026-08-27 — Produto MVP: snapshot auditável do pipeline de aporte

- `/portfolio` passa a consolidar o fluxo local de aporte em um snapshot final auditável e serializável;
- `buildContributionRecommendationSnapshot` é a única fonte do resultado consolidado do pipeline completo;
- a ordem canônica permanece `allocator -> policy -> concentration -> execution -> costs -> snapshot`;
- `methodologyVersion` é informada explicitamente, sem valor padrão, trim ou timestamp implícito;
- a UI exibe a sobra cumulativa após allocator, política, concentração, execução e custos;
- `totalInvestableAmount`, `totalConsumedKnownCost` e `unallocatedContribution` finais permanecem explícitos e reconciliáveis;
- decisões materiais por `AssetClass` preservam baseline, política, concentração, execução, custos, status final e reason codes;
- status e reason codes vêm diretamente do domínio e são apresentados sem inferência paralela por diferenças monetárias;
- destinos bloqueados por custos preservam custo conhecido informado, mas `consumedKnownCost` permanece zero conforme o domínio;
- `AssetId` continua interno ao contrato e a UI resolve nomes somente a partir do catálogo local disponível;
- o adapter web reidrata apenas os inputs canônicos já validados e deixa o domínio recalcular o pipeline completo;
- teste dedicado adultera outputs monetários intermediários e prova que eles não são usados como fonte paralela de verdade;
- testes cobrem reconciliação, determinismo, ordem estável de reason codes, estados finais e `methodologyVersion` inválida;
- o gate público passou com formatter, lint, typecheck, testes e build no código do vertical antes do fechamento documental;
- nenhuma regra financeira, preço, Market Data, FX, valuation, timestamp, persistência, IA, execução de ordem ou nova dependência foi adicionada;
- `docs/tasks/NEXT.md` promove explicação local determinística do aporte baseada exclusivamente no snapshot, status e reason codes, sem IA.

## 2026-08-27 — Produto MVP: explicação local determinística do aporte

- `/portfolio` passa a apresentar uma leitura humana do `ContributionRecommendationSnapshot` já consolidado;
- o snapshot final é a única entrada da camada de explicação e nenhuma etapa do pipeline é reconstruída;
- os cinco status finais do domínio possuem tradução PT-BR explícita e estável;
- os cinco reason codes do domínio possuem tradução PT-BR explícita e não prescritiva;
- a ordem dos reason codes exibidos é exatamente a ordem recebida do snapshot, sem repriorização local;
- causas são derivadas exclusivamente de reason codes e estados exclusivamente de status;
- valores de baseline, política, concentração, custos e investível são usados somente como contexto visual e nunca para inferir motivo;
- teste dedicado adultera os valores monetários intermediários e prova que a explicação de causas/estados permanece idêntica;
- `methodologyVersion`, aporte, valor investível, custo conhecido consumido e sobra final permanecem visíveis como fatos do snapshot;
- nomes de Assets são resolvidos somente pelo catálogo local disponível e `AssetId` continua fora da UX primária;
- destino bloqueado por custos conhecidos explica explicitamente que o custo informado pode permanecer visível enquanto `consumedKnownCost = 0`;
- decisões sem reason code adicional informam que nenhuma causa extra é inferida;
- a UI mantém a tabela auditável existente e acrescenta uma lista aberta/responsiva de explicações, sem card grid redundante;
- a copy deixa explícito que a leitura não representa ordem de compra/venda, garantia, previsão ou seleção automática de ativo;
- testes cobrem todos os status, todos os reason codes, múltiplos motivos em ordem canônica, ausência de inferência monetária e renderização integrada;
- nenhuma IA, fórmula financeira, Market Data, FX, persistência, API, dependência ou regra de domínio foi adicionada;
- `docs/tasks/NEXT.md` promove o compartilhamento local em memória do `FinancialProfileSnapshot` entre Onboarding, Dashboard e Carteira, sem inventar progresso de objetivos/reserva.

## 2026-08-27 — Produto MVP: perfil financeiro compartilhado na sessão

- `FinancialSessionProvider` passa a ser a única fonte cliente em memória para `FinancialProfileSnapshot | null` e fica no Root Layout para sobreviver à navegação cliente;
- o onboarding publica no contexto somente o snapshot final validado pelo domínio e mantém o último snapshot válido enquanto o usuário edita o draft;
- recomeçar o onboarding limpa explicitamente o perfil compartilhado;
- Dashboard e Carteira passam a consumir o mesmo snapshot de sessão sem duplicar regras financeiras;
- moeda de referência, tolerância a risco, horizonte, meta de reserva e objetivos são apresentados a partir do snapshot validado;
- meta de reserva permanece explicitamente uma meta desejada, nunca saldo atual ou percentual concluído;
- objetivos permanecem metas declaradas, sem progresso, associação automática ao patrimônio ou recomendação nova;
- IDs internos continuam fora da UX primária e são usados apenas como identidade técnica quando necessário;
- ausência de perfil, reserva ou objetivos possui estado explícito e não é convertida em zero ou métrica fictícia;
- a interface diferencia o contexto financeiro compartilhado dos dados de Portfolio/Assets/Ledger, que continuam locais à Carteira;
- o estado continua sem persistência e a copy deixa claro que reload/fechamento pode descartá-lo;
- testes cobrem reducer da sessão, estados presentes/ausentes, Dashboard, Carteira e contrato de apresentação sem IDs/progresso inventado;
- auto code review sênior confirmou a fronteira do provider no Root Layout e ausência de nova regra financeira, dependência ou integração externa;
- CI do head `ffc729321206df327544a87dcb115698f93ea1bd` passou formatter, lint, typecheck, testes e build antes do merge do PR #32;
- PR #32 foi mergeado em `f0ba3d178a1c37e6a0aa415b9fd551613b7ed851`;
- `docs/tasks/NEXT.md` promove persistência local opt-in e versionada somente do perfil financeiro como próximo vertical seguro antes de autenticação/server-side persistence.
