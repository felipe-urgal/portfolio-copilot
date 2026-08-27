# Próxima Atividade — Produto MVP: snapshot auditável do pipeline de aporte

**Status:** READY após merge de custos conhecidos e impacto tributário reservado.

## Objetivo

Substituir a composição manual de provenance do fluxo local por `buildContributionRecommendationSnapshot`, usando o pipeline canônico completo para produzir um snapshot serializável, determinístico e auditável sem reimplementar regras financeiras na aplicação.

## Escopo

- evoluir `/portfolio` a partir das entradas locais já existentes de allocator, política, concentração, execução e custos;
- introduzir `methodologyVersion` explícita e local como string canônica, sem gerar versão ou timestamp implicitamente;
- usar `buildContributionRecommendationSnapshot` como única fonte do resultado consolidado do aporte;
- preservar a ordem canônica `allocator -> policy -> concentration -> execution -> costs -> snapshot`;
- exibir `cashRemainder` cumulativo após allocator, política, concentração, execução e custos;
- exibir `totalInvestableAmount`, `totalConsumedKnownCost` e `unallocatedContribution` finais;
- apresentar decisões materiais por `AssetClass` com eventual `AssetId`, valores intermediários, status final e reason codes;
- tratar reason codes como provenance estruturada e status como estado operacional final, sem inferir regras por texto;
- preservar a distinção entre custo conhecido e custo efetivamente consumido;
- manter seleção humana de Asset por nome na UI e IDs apenas como contrato interno;
- manter todo input e snapshot local/efêmero nesta etapa;
- traduzir `InvalidContributionMethodologyVersionError` para feedback acessível;
- adicionar testes de reconciliação, determinismo, ordem de reason codes e estados finais representativos.

## Fora de escopo

- persistência/API/Server Actions;
- `asOf`, timestamp ou provenance de fonte externa;
- Market Data, preço, FX ou valuation;
- cálculo tributário ou consulta de tarifas;
- ranking de ativos, Quality, Opportunity ou Portfolio Fit;
- redistribuição adicional ou nova fórmula financeira;
- conversão `Money ↔ AssetQuantity`;
- execução real de ordens ou corretora;
- autenticação/autorização;
- explicação ou recomendação por IA.

## Critérios de aceite

- o snapshot final vem exclusivamente de `buildContributionRecommendationSnapshot`;
- `methodologyVersion` é explícita, não vazia e sem whitespace periférico;
- sobra por etapa é exibida como valor cumulativo, não incremental;
- decisões preservam baseline, política, concentração, execução e custos sem reconstrução paralela de regras;
- status e reason codes vêm do domínio e mantêm ordem estável;
- destino bloqueado por custos expõe custo conhecido, mas `consumedKnownCost = 0`;
- reconciliação final preserva `contribution = totalInvestableAmount + totalConsumedKnownCost + unallocatedContribution`;
- nenhuma regra financeira, preço, timestamp, persistência ou integração nova é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — pipeline determinístico do aporte;
- `docs/adr/0017-contribution-pipeline-snapshot.md` — snapshot auditável e reason codes;
- `packages/domain/src/contribution/contribution-recommendation-pipeline.ts` — `buildContributionRecommendationSnapshot`.
