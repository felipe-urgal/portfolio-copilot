# Próxima Atividade — Portfolio Engine: testes de invariantes do pipeline de aporte

**Status:** READY após merge da orquestração e snapshot auditável.

## Objetivo

Fechar a fundação do pipeline de aporte com testes de invariantes em uma matriz determinística ampla de cenários, validando reconciliação monetária, limites, ordenação e reprodutibilidade sem adicionar novas regras financeiras.

## Escopo

- suíte de invariantes sobre `buildContributionRecommendationSnapshot` e as camadas que ele compõe;
- geração determinística de cenários com diferentes aportes em centavos, valores atuais e distribuições-alvo válidas;
- combinações de política de microaporte, limites soft/hard, elegibilidade e custos conhecidos;
- verificar sempre `contribution = totalInvestableAmount + totalConsumedKnownCost + unallocatedContribution`;
- nenhum valor investível ou sobra final negativos;
- destino bloqueado nunca possui valor investível positivo;
- hard limit nunca deixa novo aporte acima do teto na granularidade monetária definida;
- custo consumido nunca excede o orçamento bruto do destino executável;
- reason codes e decisões mantêm ordem determinística;
- mesma entrada produz snapshot equivalente em execuções repetidas;
- snapshots permanecem serializáveis sem `bigint`, classes ou objetos de infraestrutura;
- priorizar corpus gerado deterministicamente com Vitest já existente; nova dependência property-based só entra se houver ganho claro e revisão de supply chain;
- documentar qualquer bug de domínio revelado pelos invariantes e corrigi-lo no mesmo vertical.

## Fora de escopo

- novas fórmulas de alocação;
- preço em tempo real;
- FX;
- cálculo fiscal;
- ranking de ativos;
- Quality Score, Opportunity Score ou Portfolio Fit;
- venda/rebalanceamento;
- persistência, API ou UI;
- adapters de dados;
- IA.

## Critérios de aceite

- corpus cobre centenas de combinações reproduzíveis sem aleatoriedade não controlada;
- reconciliação monetária é provada para todos os casos válidos do corpus;
- nenhum hard limit, bloqueio de elegibilidade ou custo conhecido é violado;
- snapshots podem passar por `JSON.stringify` de forma determinística;
- falhas apresentam cenário mínimo/reproduzível suficiente para diagnóstico;
- nenhuma dependência nova é adicionada sem justificativa explícita;
- `pnpm check` passa integralmente no head final validado.

## Casos mínimos

- aporte zero e aportes de poucos centavos;
- uma e múltiplas classes;
- pesos com restos monetários;
- política sem restrição e política concentradora;
- hard limit exato, parcial e bloqueio total;
- destino elegível e inelegível;
- custo zero, menor, igual e maior que a alocação;
- sobra originada em cada etapa do pipeline;
- combinações de dois ou mais bloqueios;
- repetição do mesmo cenário e serialização JSON estável.
