# Próxima Atividade — Produto MVP: explicação local determinística do aporte

**Status:** READY após merge do snapshot auditável do pipeline de aporte.

## Objetivo

Transformar `ContributionRecommendationSnapshot` em uma explicação humana, local e determinística do aporte, usando exclusivamente `status` e `reasonCodes` estruturados como fonte das causas e os valores já serializados no snapshot como contexto, sem IA e sem reimplementar regras financeiras.

## Escopo

- evoluir `/portfolio` a partir do `ContributionRecommendationSnapshot` canônico já consolidado;
- consumir somente o snapshot final como entrada da camada de explicação, sem remontar allocator, política, concentração, execução ou custos;
- criar uma camada pura de apresentação que traduza cada reason code fechado do domínio para texto PT-BR estável e não prescritivo;
- preservar a ordem dos `reasonCodes` recebida do domínio, sem repriorizar ou inferir causa por comparação de valores;
- explicar o estado final de cada decisão a partir do `status` fechado do snapshot;
- contextualizar cada decisão com `AssetClass`, nome local do Asset quando houver, baseline, pós-política, pós-concentração e valor investível já presentes no snapshot;
- distinguir claramente alerta de concentração, bloqueio rígido, inelegibilidade e bloqueio por custos conhecidos;
- explicar que custo conhecido em destino bloqueado pode permanecer visível enquanto `consumedKnownCost = 0`;
- manter `methodologyVersion` visível como provenance da explicação;
- manter a reconciliação e a sobra final como fatos do snapshot, sem novo cálculo financeiro na camada de apresentação;
- manter toda explicação local/efêmera nesta etapa;
- garantir leitura acessível e responsiva, com hierarquia simples e sem card grid redundante;
- adicionar testes que cubram todos os reason codes, todos os status finais, combinações de múltiplos motivos e preservação da ordem canônica.

## Fora de escopo

- geração de texto por IA/LLM ou linguagem probabilística;
- inferir motivo a partir de diferenças monetárias quando não houver reason code correspondente;
- alterar ou criar reason codes/status no domínio;
- nova fórmula de alocação, redistribuição, concentração, execução ou custos;
- recomendação de compra/venda, ranking de ativos ou seleção automática de destino;
- Market Data, preço, FX, valuation ou quantidade comprável;
- cálculo tributário ou consulta de tarifas;
- persistência/API/Server Actions;
- `asOf`, timestamp ou provenance de fonte externa;
- autenticação/autorização;
- execução real de ordens ou corretora.

## Critérios de aceite

- a explicação recebe somente um `ContributionRecommendationSnapshot` válido;
- causas humanas são derivadas exclusivamente dos `reasonCodes` e estados finais exclusivamente de `status`;
- nenhum texto de causa é inferido comparando valores intermediários;
- a ordem dos motivos exibidos é idêntica à ordem canônica do snapshot;
- `CONTRIBUTION_POLICY_ADJUSTED`, `SOFT_CONCENTRATION_LIMIT_EXCEEDED`, `HARD_CONCENTRATION_LIMIT_APPLIED`, `EXECUTION_DESTINATION_INELIGIBLE` e `KNOWN_COSTS_BLOCKED_DESTINATION` possuem cobertura explícita;
- `EXECUTABLE`, `NOT_SELECTED_BY_POLICY`, `BLOCKED_CONCENTRATION_LIMIT`, `BLOCKED_INELIGIBLE` e `BLOCKED_KNOWN_COSTS` possuem apresentação explícita;
- `methodologyVersion`, sobra final e reconciliação permanecem visíveis sem novo cálculo;
- a copy evita linguagem que implique ordem, garantia, previsão ou aconselhamento financeiro individualizado;
- nenhuma dependência, regra financeira, preço, persistência ou IA é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: explicação de rebalanceamento;
- `docs/FINANCIAL-METHODOLOGY.md` — pipeline determinístico do aporte;
- `docs/adr/0017-contribution-pipeline-snapshot.md` — status finais, reason codes e provenance;
- `packages/domain/src/contribution/contribution-recommendation-pipeline.ts` — `ContributionRecommendationSnapshot`.
