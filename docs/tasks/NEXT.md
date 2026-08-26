# Próxima Atividade — Produto MVP: política local do aporte por AssetClass

**Status:** READY após merge de `TargetAllocation` local + baseline determinístico do aporte.

## Objetivo

Evoluir o aporte local para aplicar a primeira política operacional sobre o baseline já validado, usando `applyContributionPolicy` para tratar microaportes e limitar a quantidade de classes destinatárias sem introduzir preço, seleção de ativo, execução ou nova fórmula financeira na camada web.

## Escopo

- evoluir o painel de aporte em `/portfolio` a partir do mesmo `PortfolioId`, `TargetAllocation`, base monetária manual e `ContributionPlan` já existentes;
- receber `minimumMeaningfulContribution` como string monetária na moeda de referência do Portfolio e convertê-la por `Money`;
- receber `maxDestinationsPerContribution` como configuração inteira explícita da política;
- reutilizar `applyContributionPolicy` como única fonte para seleção/priorização de classes, redistribuição e sobra após a política;
- mostrar lado a lado o baseline do allocator e o resultado após a política, preservando provenance suficiente para entender o que mudou;
- mostrar classes removidas por microaporte/limite de destinos sem escolher um `Asset` dentro da classe;
- manter `unallocatedContribution` explícito e nunca inventar destino para a sobra;
- traduzir erros tipados de valor mínimo, moeda e limite de destinos para feedback acessível;
- manter toda a configuração e resultado exclusivamente local/efêmero;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para mínimo zero/positivo, limite amplo/restritivo, redistribuição, sobra e configurações inválidas.

## Fora de escopo

- escolher/rankear `Asset` destino dentro de uma classe;
- converter `Money` em `AssetQuantity`;
- preço, Market Data, FX ou valuation;
- unidade mínima negociável e elegibilidade por ativo;
- limites de concentração;
- custos ou impactos tributários;
- pipeline completo de `ContributionRecommendationSnapshot`;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação por IA.

## Critérios de aceite

- a política é aplicada somente sobre um `ContributionPlan` válido produzido pelo allocator;
- `minimumMeaningfulContribution` usa `Money` e não passa por `number` binário;
- `maxDestinationsPerContribution` chega ao contrato do domínio como inteiro seguro válido;
- `applyContributionPolicy` é a única fonte de seleção de classes, redistribuição e sobra pós-política;
- o baseline original continua visível para comparação auditável;
- nenhuma classe sem necessidade positiva recebe aporte por invenção da UI;
- toda parcela não distribuída permanece em `unallocatedContribution`;
- nenhuma quantidade, preço, ativo destino ou valuation é inferido;
- erros tipados do domínio são traduzidos para feedback acessível;
- estado continua local/efêmero e isso permanece explícito;
- nenhuma fórmula financeira, persistência, API ou integração externa é adicionada;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — metodologia financeira do aporte;
- `docs/adr/0012-contribution-allocator.md` — baseline determinístico;
- `docs/adr/0013-contribution-policy.md` — microaporte e limite de destinos;
- `packages/domain/src/contribution/contribution-allocator.ts` — `ContributionPlan`;
- `packages/domain/src/contribution/contribution-policy.ts` — `applyContributionPolicy`.
