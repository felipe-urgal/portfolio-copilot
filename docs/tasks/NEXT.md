# Próxima Atividade — Produto MVP: custos conhecidos e impacto tributário reservado do aporte

**Status:** READY após merge dos limites locais de concentração por AssetClass.

## Objetivo

Inserir a camada local posterior às restrições de execução usando `applyContributionCostTaxConstraints` para representar custos transacionais conhecidos e impacto tributário monetário informado externamente, preservando orçamento bruto, valor investível e sobra sem calcular imposto, tarifa, preço ou redistribuição silenciosa.

## Escopo

- evoluir o fluxo de aporte em `/portfolio` a partir do `ContributionExecutionPlan` já validado;
- configurar opcionalmente por destino executável `transactionCost` e `estimatedTaxImpact` como strings até `Money`;
- vincular a configuração somente ao `AssetId` já presente no plano de execução, mantendo seleção humana por nome na UI;
- ausência de configuração para um destino significa custo conhecido zero, sem inventar tarifa padrão;
- reutilizar `applyContributionCostTaxConstraints` como única fonte para `totalKnownCost`, `investableAmount`, status final e `unallocatedContribution` acumulado;
- preservar lado a lado o orçamento bruto recebido da execução, custo transacional, impacto tributário reservado e valor investível;
- mostrar `estimatedTaxImpact` explicitamente como valor informado/reservado, nunca como imposto calculado pelo domínio;
- quando `totalKnownCost < allocatedAmount`, manter o destino executável e expor o valor investível líquido dos custos conhecidos;
- quando `totalKnownCost >= allocatedAmount`, bloquear o destino, zerar `investableAmount` e devolver o orçamento bruto inteiro para a sobra;
- preservar sobra upstream e não redistribuir automaticamente valor de destino bloqueado;
- traduzir erros tipados de destino desconhecido/duplicado, valor inválido/negativo e moeda incompatível para feedback acessível;
- manter toda configuração e resultado local/efêmero;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para destino sem configuração, custo parcial, custo + impacto tributário, bloqueio por custo igual/maior ao orçamento, valor negativo/inválido, destino desconhecido e sobra acumulada.

## Fora de escopo

- cálculo de imposto, alíquota, faixa de isenção, come-cotas, compensação de prejuízo, regime tributário ou jurisdição;
- consulta de tarifa de corretora ou descoberta automática de custos;
- custo percentual, spread, slippage ou preço de mercado;
- Market Data, FX ou valuation;
- redistribuição automática após bloqueio por custos;
- reexecução da política de microaporte após custos;
- conversão `Money ↔ AssetQuantity`;
- ordem real ou integração com corretora;
- pipeline completo de `ContributionRecommendationSnapshot`;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação por IA.

## Critérios de aceite

- destino sem configuração preserva orçamento bruto, usa custos conhecidos zero e permanece executável;
- `transactionCost` e `estimatedTaxImpact` passam por `Money`, usam a moeda do aporte e rejeitam valores negativos;
- `totalKnownCost` e `investableAmount` vêm exclusivamente de `applyContributionCostTaxConstraints`;
- custo conhecido parcial reduz apenas o valor investível, sem alterar silenciosamente o orçamento bruto;
- custo total igual ou superior ao orçamento bloqueia o destino e devolve o orçamento bruto inteiro para a sobra;
- impacto tributário é rotulado como estimativa/reserva informada, não como imposto calculado;
- sobra upstream é preservada e acrescida somente do orçamento de destinos bloqueados;
- valor bloqueado não é redistribuído silenciosamente;
- nenhuma fórmula fiscal, preço, tarifa descoberta externamente, persistência ou integração nova é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — políticas e restrições do aporte;
- `docs/adr/0014-contribution-execution-constraints.md` — plano de execução por AssetId;
- `docs/adr/0015-asset-class-concentration-limits.md` — camada de concentração anterior;
- `docs/adr/0016-contribution-cost-tax-constraints.md` — custos conhecidos e impacto tributário reservado;
- `packages/domain/src/contribution/contribution-cost-tax-constraints.ts` — `applyContributionCostTaxConstraints`.
