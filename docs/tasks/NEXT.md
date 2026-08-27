# Próxima Atividade — Produto MVP: limites locais de concentração por AssetClass

**Status:** READY após merge dos destinos locais e restrições de execução do aporte.

## Objetivo

Inserir a camada local de limites de concentração entre a política de aporte e as restrições de execução, usando `applyAssetClassConcentrationLimits` para representar `softMaxWeight` e `hardMaxWeight` por `AssetClass` sem preço, Market Data, venda ou redistribuição silenciosa.

## Escopo

- evoluir o fluxo de aporte em `/portfolio` a partir do mesmo `ContributionPlan` pós-política já validado;
- configurar limites opcionais por `AssetClass` usando `softMaxWeight` e `hardMaxWeight` como strings até `AllocationWeight`;
- aceitar apenas classes configuradas explicitamente, sem inventar limites padrão;
- reutilizar `applyAssetClassConcentrationLimits` como única fonte para alocação após concentração, `blockedAmount`, flags soft/hard e `unallocatedContribution` acumulado;
- preservar lado a lado o valor após política e o valor após concentração para provenance auditável;
- mostrar `softLimitExceeded` como alerta, sem bloquear valor por conta própria;
- mostrar `hardLimitApplied` e o valor bloqueado quando o hard limit restringir novo aporte;
- manter valor bloqueado na sobra sem redistribuir para outra classe;
- fazer as restrições de execução consumirem o plano já filtrado por concentração, preservando a ordem canônica `allocator -> policy -> concentration -> execution`;
- traduzir erros tipados de duplicidade, peso inválido e faixa `soft > hard` para feedback acessível;
- manter toda configuração e resultado local/efêmero;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para classe sem limite, soft alert-only, hard parcial/total, classe já acima do hard, configuração inválida, sobra e integração com a etapa de execução.

## Fora de escopo

- concentração por Asset individual, emissor, setor, moeda, geografia ou grupo econômico;
- preço, Market Data, FX ou valuation;
- venda/rebalanceamento para corrigir concentração existente;
- redistribuição automática do valor bloqueado;
- seleção/ranking automático de Asset;
- conversão `Money ↔ AssetQuantity`;
- custos ou impactos tributários;
- pipeline completo de `ContributionRecommendationSnapshot`;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação por IA.

## Critérios de aceite

- classe sem limite preserva exatamente a alocação pós-política;
- `softMaxWeight`/`hardMaxWeight` passam por `AllocationWeight` e respeitam `soft <= hard`;
- soft limit apenas sinaliza atenção e não reduz valor sozinho;
- hard limit nunca permite que novo aporte empurre a classe acima do teto monetário calculado pelo domínio;
- classe já acima do hard limit não recebe novo aporte e nenhuma venda é inferida;
- `blockedAmount` e a sobra acumulada permanecem explícitos;
- valor bloqueado não é redistribuído silenciosamente;
- `applyAssetClassConcentrationLimits` é a única fonte do resultado pós-concentração;
- restrições de execução consomem o plano pós-concentração, não o plano pós-política direto;
- nenhuma fórmula financeira nova, persistência, API ou integração externa é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — políticas e restrições do aporte;
- `docs/adr/0013-contribution-policy.md` — plano pós-política;
- `docs/adr/0015-asset-class-concentration-limits.md` — soft/hard limits e ordem canônica;
- `packages/domain/src/contribution/asset-class-concentration-limits.ts` — `applyAssetClassConcentrationLimits`;
- `packages/domain/src/contribution/contribution-execution-constraints.ts` — etapa posterior de execução.
