# ADR-0025 — Portfolio Fit e ranking explicável por carteira

**Status:** Aceita

## Contexto

Após separar Quality, Opportunity e Dividend no Investment Engine (#41), o produto precisa ordenar candidatos sem transformar qualidade do ativo, preço atual e aderência à carteira em uma única caixa-preta.

`Portfolio Fit` depende de contexto que já pertence ao Portfolio Engine: gap de alocação, limites de concentração e restrições do pipeline de aporte. Esse contexto precisa estar ligado à mesma carteira usada no radar; misturar snapshots de carteiras diferentes produziria uma recomendação semanticamente inválida mesmo que os tipos individuais fossem corretos.

## Decisão

### Portfolio Fit permanece uma dimensão separada

`Portfolio Fit` é calculado separadamente de Quality e Opportunity e recebe três componentes auditáveis:

- gap de alocação;
- concentração;
- elegibilidade da decisão de aporte.

O baseline `PORTFOLIO_FIT_RANKING_BR@1.0.0` usa pesos de 40%, 30% e 30%, respectivamente. Os pesos são baseline de engenharia, versionados e não representam calibração financeira validada.

O componente de gap usa a proporção entre `AllocationGap.gap` e `AllocationGap.targetValue`, limitada a 100%. Quando não existe gap positivo, Portfolio Fit é zero e o engine não inventa contexto de aporte para elevar a nota.

Quando existe gap, a avaliação exige um `ContributionRecommendationSnapshot` da mesma carteira. A decisão aplicável é localizada pela classe do ativo. Snapshot de outra carteira, ativo incompatível ou ausência de contexto produz `INSUFFICIENT_DATA`.

### Restrições do pipeline de aporte são respeitadas

Um soft limit de concentração reduz somente o componente de concentração e preserva o reason code correspondente. Quando o pipeline informa `HARD_CONCENTRATION_LIMIT_APPLIED`, o componente de concentração é zero mesmo que ainda exista uma parcela executável; o Investment Engine não recalcula o limite, apenas torna explícito o sinal já produzido pelo Portfolio Engine.

Estados que bloqueiam o destino no pipeline de aporte — política, hard concentration limit, inelegibilidade ou custos conhecidos — zeram o Portfolio Fit final. O snapshot preserva `hardBlockStatus`, componentes e reason codes; o override nunca fica implícito.

### Ranking preserva as dimensões

O radar combina apenas candidatos com Quality, Opportunity e Portfolio Fit válidos no mesmo `evaluationAsOf` e na mesma carteira.

O baseline de ranking usa:

- Quality: 35%;
- Opportunity: 35%;
- Portfolio Fit: 30%.

O resultado guarda os três snapshots completos e a contribuição ponderada de cada dimensão. O score de ranking é apenas uma ordenação derivada, não substitui as dimensões como fonte de explicação.

Quality e Opportunity precisam usar a mesma metodologia/versionamento e a mesma classificação analítica. Portfolio Fit precisa usar a metodologia de ranking selecionada, pertencer ao `portfolioId` esperado pelo radar e ter a mesma classe de ativo da classificação analítica do candidato.

Qualquer dimensão com `INSUFFICIENT_DATA` deixa o candidato fora da lista ranqueada e o mantém na coleção explícita de insuficientes. Missing, stale, conflict ou outra insuficiência nunca são convertidos em nota neutra.

### Desempate determinístico

O ranking ordena por score decrescente. Empates usam o `AssetId` canônico em ordem ascendente. A regra faz parte do snapshot para tornar o resultado reproduzível.

## Consequências

### Positivas

- Quality, Opportunity e Portfolio Fit continuam separáveis e auditáveis;
- o ranking pode ser explicado por componentes e reason codes;
- restrições de aporte não são ignoradas por um score analítico alto;
- contexto de uma carteira não pode contaminar o radar de outra;
- classificação analítica e classe usada pelo Portfolio Fit não podem divergir silenciosamente;
- dados incompletos permanecem explicitamente incompletos;
- empates são estáveis e reproduzíveis.

### Custos

- callers precisam fornecer snapshots consistentes de Investment Engine e Portfolio Engine;
- o baseline adiciona mais uma metodologia que precisa de versionamento disciplinado;
- pesos e penalidades ainda precisam de pesquisa, calibração e backtesting antes de uso financeiro relevante;
- o `ContributionRecommendationSnapshot` atual não possui timestamp próprio, então o `evaluationAsOf` do radar continua sendo responsabilidade explícita da camada orquestradora.

## Alternativas rejeitadas

### Score único sem decomposição

Rejeitado porque impediria distinguir ativo de qualidade, oportunidade de preço e necessidade específica da carteira.

### Tratar dado ausente como zero ou média

Rejeitado porque cria falsa comparabilidade e pode alterar a ordem do radar sem evidência suficiente.

### Recalcular regras de concentração dentro do Investment Engine

Rejeitado porque duplicaria regras já pertencentes ao Portfolio Engine e criaria duas fontes de verdade.

### Aceitar somente a decisão individual de aporte

Rejeitado porque a decisão isolada não prova a qual carteira pertence. O Portfolio Fit recebe o snapshot completo para validar `portfolioId` antes de consumir a decisão.

### Desempatar pela ordem de entrada

Rejeitado porque tornaria o ranking dependente da ordem do caller e menos reproduzível.

## Referências

- issue #42;
- ADR-0011 — Allocation Gap;
- ADR-0015 — limites de concentração;
- ADR-0017 — contribution pipeline snapshot;
- ADR-0024 — Investment Engine scoring e valuation;
- `docs/INVESTMENT-ENGINE-METHODOLOGY.md`;
- `docs/ROADMAP.md` — Fase 5.
