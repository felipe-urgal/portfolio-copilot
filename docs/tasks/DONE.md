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

## 2026-08-26 — Portfolio Engine: Asset e AssetClass

- `AssetId` criado como identidade interna opaca, estável e independente de ticker/provedor;
- UUID canônico é validado e normalizado sem gerar identidade dentro do domínio;
- `AssetClass` criado com taxonomia econômica inicial explícita e sem categoria genérica `OTHER`;
- `Asset` criado como entidade imutável com nome, classe, moeda de referência e identificadores externos opcionais;
- `CurrencyCode` do domínio financeiro é reutilizado como contrato único de moeda;
- `ExternalAssetIdentifier` diferencia `MARKET_SYMBOL`, `ISIN` e `PROVIDER_ID` sem tratá-los como chave primária;
- símbolos de mercado e namespaces são normalizados; provider IDs preservam case quando necessário;
- ativos sem ticker são suportados como cidadãos de primeira classe, inclusive renda fixa;
- identificadores externos duplicados no mesmo ativo são rejeitados;
- dois ativos com o mesmo ticker continuam distintos quando possuem `AssetId` diferentes;
- erros específicos do domínio de ativos foram adicionados;
- testes cobrem identidade, classes, nomes, moedas, identificadores externos e estados inválidos;
- ADR-0006 registra identidade, taxonomia, limites deliberados de ISIN e separação futura do Asset Master.
