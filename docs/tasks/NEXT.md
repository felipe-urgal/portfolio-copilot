# Próxima Atividade — Produto MVP: destino local e restrições de execução do aporte

**Status:** READY após merge da política local de microaporte e limite de destinos.

## Objetivo

Evoluir o aporte local para associar cada `AssetClass` com alocação positiva após a política a um `Asset` local previamente cadastrado e aplicar `applyContributionExecutionConstraints`, representando elegibilidade e quantidade mínima negociável sem converter `Money` em `AssetQuantity`, buscar preço ou executar ordens.

## Escopo

- evoluir o fluxo de aporte em `/portfolio` a partir do mesmo `PortfolioId`, baseline e plano pós-política já validados;
- disponibilizar como candidatos apenas `AssetSnapshot` já existentes na sessão e apresentar seleção humana por nome/classe, nunca UUID como campo principal;
- exigir exatamente um destino por `AssetClass` com alocação monetária positiva após a política;
- resolver `AssetId` internamente a partir do ativo local selecionado e preservar a classe econômica do Asset;
- receber `isEligible` como configuração booleana explícita do destino;
- receber `minimumTradableQuantity` como string e validá-la por `AssetQuantity`, sem `number` binário;
- reutilizar `applyContributionExecutionConstraints` como única fonte para destinos executáveis e `unallocatedContribution` após elegibilidade;
- preservar lado a lado o valor pós-política e o resultado de execução para provenance auditável;
- mostrar destino inelegível como bloqueado e manter seu valor monetário na sobra, sem redistribuição silenciosa;
- mostrar a quantidade mínima apenas como restrição operacional do destino, sem afirmar que o valor alocado consegue comprá-la;
- traduzir erros tipados de destino ausente/duplicado, elegibilidade, identidade e quantidade mínima para feedback acessível;
- manter configuração e resultado exclusivamente local/efêmero;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para destinos elegíveis/inelegíveis, destino ausente, duplicidade, quantidade mínima inválida e sobra após bloqueio.

## Fora de escopo

- escolher ou ranquear automaticamente um `Asset` dentro da classe;
- converter `Money` em `AssetQuantity`;
- verificar se o valor monetário compra a quantidade mínima;
- preço, Market Data, FX ou valuation;
- lote/regra específica de corretora ou execução de ordem;
- limites de concentração;
- custos ou impactos tributários;
- pipeline completo de `ContributionRecommendationSnapshot`;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação por IA.

## Critérios de aceite

- somente classes com alocação positiva após a política exigem destino;
- o destino é escolhido entre Assets locais por informação humana visível e o `AssetId` fica interno;
- cada classe positiva possui exatamente um destino válido;
- `minimumTradableQuantity` usa `AssetQuantity` e não passa por `number` binário;
- `isEligible` chega ao domínio como booleano explícito;
- `applyContributionExecutionConstraints` é a única fonte do plano de execução e da sobra após elegibilidade;
- destino inelegível não recebe recomendação por ativo e seu valor retorna integralmente para `unallocatedContribution`;
- não existe redistribuição após bloqueio de execução;
- a quantidade mínima é exibida como restrição, não como quantidade recomendada/comprável;
- nenhuma quantidade de compra, preço, valuation ou execução real é inferida;
- erros tipados do domínio são traduzidos para feedback acessível;
- estado continua local/efêmero e isso permanece explícito;
- nenhuma fórmula financeira, persistência, API ou integração externa é adicionada;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — fronteira entre valor de aporte e quantidade negociável;
- `docs/adr/0013-contribution-policy.md` — plano pós-política;
- `docs/adr/0014-contribution-execution-constraints.md` — destino, elegibilidade e quantidade mínima;
- `packages/domain/src/contribution/contribution-policy.ts` — `applyContributionPolicy`;
- `packages/domain/src/contribution/contribution-execution-constraints.ts` — `applyContributionExecutionConstraints`.
