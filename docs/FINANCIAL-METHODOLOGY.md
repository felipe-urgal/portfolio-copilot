# Metodologia Financeira

## Objetivo

Definir uma metodologia explícita, versionada e testável para apoiar alocação e aportes. Esta documentação descreve uma base de engenharia financeira; os pesos serão calibrados com pesquisa, testes e backtesting antes de uso relevante.

## Ordem de decisão

```text
1. segurança e liquidez
2. elegibilidade
3. risco da carteira
4. gap de alocação
5. qualidade do ativo
6. oportunidade/preço
7. aderência à carteira
8. tamanho do aporte
9. explicação e snapshot
```

Um score alto nunca ignora uma regra de risco.

## Horizonte

### Curto prazo

Dinheiro necessário em aproximadamente 0–2 anos: prioridade em liquidez e preservação. Renda variável não deve ser usada para obrigação de curto prazo.

### Médio prazo

Aproximadamente 2–7 anos: mistura de preservação, proteção inflacionária e risco moderado, sempre compatível com a data do objetivo.

### Longo prazo

7+ anos: maior capacidade de tolerar volatilidade e maior uso de ativos de crescimento, ações, ETFs e outros riscos controlados.

## Reserva

A reserva de emergência é uma restrição de segurança, não uma oportunidade de maximização de retorno.

Política inicial configurável:

```text
reserveTarget = essentialMonthlyExpenses * reserveMonths
```

Valor inicial sugerido de `reserveMonths`: 6, mas deve ser configurável.

Se a reserva estiver abaixo da política mínima, o motor pode priorizar sua recomposição antes de ativos de maior risco.

## Alocação

A política de investimento define pesos por classe. Exemplo de carteira-modelo usada somente como referência inicial:

```text
renda fixa       45%
ações Brasil     22%
ETFs globais     18%
FIIs             10%
alternativos      5%
```

Os valores não são hard-coded no domínio. São configuração versionada por carteira.

## Gap de alocação

Para cada bucket:

```text
targetValueAfterContribution = (portfolioValue + contribution) * targetWeight
gap = max(0, targetValueAfterContribution - currentValue)
```

O aporte-base pode ser normalizado pelos gaps positivos. Regras adicionais podem limitar concentração, aporte mínimo significativo, custos, elegibilidade e unidade mínima negociável.

## Diversificação

Diversificação deve considerar fontes de risco, não apenas número de ativos.

Avaliar no mínimo:

- classe;
- setor;
- emissor;
- moeda/geografia;
- fatores cíclicos;
- concentração por ativo;
- concentração por grupo econômico quando disponível.

Ter quatro bancos não equivale a quatro riscos independentes.

A política de diversificação é um objetivo de carteira, não uma obrigação de comprar todos os ativos todos os meses.

## Asset Quality Score

Avalia qualidade estrutural, sem decidir preço de entrada. Estrutura inicial para ações:

```text
profitability       20%
capital efficiency  15%
balance sheet       15%
competitive quality 15%
growth quality      15%
cash generation     10%
governance           5%
predictability       5%
```

Não aplicar o mesmo modelo cegamente a banco, seguradora, commodity, FII e título de renda fixa. Cada classe/setor terá adapter de metodologia.

## Asset Opportunity Score

Avalia oportunidade atual. Pode combinar:

- valuation versus histórico;
- valuation versus pares;
- retorno implícito em cenários;
- tendência de revisões de lucro/caixa;
- ciclo econômico/setorial;
- margem de segurança;
- risco de tese.

Preço atual e data de referência são obrigatórios.

## Dividend Score

Dividend yield isolado não basta. Considerar:

- payout;
- geração de caixa;
- recorrência;
- dívida;
- necessidade de capex;
- crescimento do lucro/caixa;
- sustentabilidade da distribuição.

## Portfolio Fit

Responde se o ativo deve receber dinheiro **nesta carteira agora**.

Entradas mínimas:

- Quality Score;
- Opportunity Score;
- gap da classe;
- gap do setor/fator;
- peso atual do ativo;
- limites de risco;
- horizonte;
- liquidez;
- custos e impactos tributários relevantes quando conhecidos;
- restrições pessoais.

Conceitualmente:

```text
portfolioFit = f(quality, opportunity, allocationNeed, diversificationBenefit, riskPenalty, costPenalty)
```

A fórmula exata será versionada e testada. Não será criada por prompt em tempo de execução.

## Recommendation Engine

Uma recomendação de aporte deve ser um problema de alocação sob restrições, não uma lista de maiores scores.

Invariantes:

- soma das recomendações <= valor disponível;
- nenhum ativo proibido recebe aporte;
- hard limit de concentração nunca é ultrapassado;
- recomendação de risco não usa dinheiro reservado para objetivo incompatível;
- valores são arredondados com política explícita;
- custo/transação não pode tornar um microaporte economicamente irracional;
- sobra de caixa é aceitável quando não há destino elegível.

### Aporte mínimo significativo

Pesos-alvo são metas de longo prazo. O motor **não deve fragmentar automaticamente um aporte pequeno entre todos os ativos da carteira**.

Exemplo: com R$ 1.000 disponíveis e uma carteira com 15 posições, não existe obrigação de gerar 15 compras de R$ 20–R$ 100.

A política deverá suportar parâmetros como:

```text
minimumMeaningfulContribution
maxDestinationsPerContribution
minimumTradableAmount
```

O algoritmo poderá escolher apenas os melhores destinos elegíveis do mês, priorizando gaps e Portfolio Fit, enquanto mantém os demais pesos como meta futura.

Comportamento conceitual:

1. eliminar destinos proibidos ou acima de limites;
2. ordenar candidatos por necessidade da carteira e Portfolio Fit;
3. respeitar unidade mínima/custo;
4. selecionar um subconjunto de destinos com aporte significativo;
5. recalcular o efeito do aporte sobre a carteira;
6. manter eventual sobra em caixa elegível quando não houver destino racional.

Isso evita falsa diversificação e reduz complexidade operacional para aportes recorrentes como R$ 1.000/mês.

## Limites

A política deve suportar:

- `targetWeight`;
- `softMaxWeight` — bloqueia novos aportes ou gera alerta conforme regra configurada;
- `hardMaxWeight` — impede recomendação;
- limites por classe/setor/moeda/emissor.

Exemplo conceitual para ativo de alto risco:

```text
target 5%
soft max 6%
hard max 8%
```

Os números são configuração, não recomendação universal.

## Rebalanceamento

Preferência inicial:

1. novos aportes;
2. dividendos/juros recebidos;
3. venda somente quando necessária por risco, mudança de tese, liquidez do objetivo ou desvio persistente relevante.

Isso reduz giro, custos e decisões emocionais.

## Teses

Uma posição individual deve possuir tese com:

- papel na carteira;
- drivers positivos;
- riscos;
- indicadores de acompanhamento;
- critérios de invalidação;
- data da última revisão.

Notícia não altera tese automaticamente. Ela gera evento candidato a revisão.

## IA

IA pode:

- resumir resultado trimestral;
- extrair eventos de notícias;
- comparar texto novo com tese existente;
- gerar explicação em linguagem natural a partir de outputs estruturados.

IA não pode:

- inventar preço, fundamento ou taxa ausente;
- alterar limite de risco;
- substituir cálculo de valuation determinístico;
- executar ordem;
- produzir recomendação sem os inputs mínimos exigidos.

## Backtesting

Backtesting futuro deve evitar look-ahead bias e survivorship bias. Recomendações históricas devem utilizar apenas dados disponíveis no `asOf` original.

## Versão

Toda saída material deve registrar `methodologyVersion`.
