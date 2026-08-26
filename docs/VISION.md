# Visão do Produto

## Missão

Construir um copiloto de investimentos que transforme patrimônio, objetivos, risco, dados de mercado e metodologia financeira em decisões de aporte compreensíveis e auditáveis.

## North Star

A experiência principal deve responder com clareza:

> **Onde aportar meu dinheiro este mês, quanto em cada destino e por quê?**

## Para quem nasce

A primeira fase é de uso pessoal e controlado. Isso permite validar metodologia, ergonomia e qualidade dos cálculos antes de qualquer decisão de disponibilização pública.

## O que o produto deve fazer

- consolidar carteira, posições, aportes e objetivos;
- medir alocação atual versus alocação desejada;
- indicar desequilíbrios de classe, setor, ativo e risco;
- avaliar qualidade e oportunidade de ativos;
- priorizar aportes com regras reproduzíveis;
- manter teses de investimento e eventos que as afetem;
- mostrar o que mudou desde a última revisão;
- simular cenários sem apresentar projeções como garantias;
- registrar snapshots das decisões para auditoria e backtesting posterior.

## O que o produto não deve fazer no início

- executar ordens em corretoras;
- custodiar recursos;
- armazenar senha ou token de corretora;
- operar intraday;
- prometer retorno;
- reagir automaticamente a uma notícia isolada;
- usar LLM como calculadora financeira autoritativa;
- esconder metodologia em prompts ou modelos opacos.

## Princípios de produto

### 1. Simples na superfície, rigoroso por baixo

A interface pode mostrar cinco decisões de aporte; internamente cada decisão precisa ser rastreável até regras, pesos, dados e versão da metodologia.

### 2. Menos ruído

O app não deve ser um feed infinito de mercado. Deve destacar apenas informação que altera risco, preço, fundamento ou tese.

### 3. Sem falsa precisão

Scores e projeções são instrumentos comparativos. Devem exibir incerteza, data de referência e limitações.

### 4. Comportamento acima de previsão

Aporte recorrente, horizonte, diversificação, custos e disciplina têm prioridade sobre tentativa de prever movimentos de curto prazo.

### 5. Personalização com limites

A carteira pode respeitar objetivos e tolerância a risco, mas regras de segurança e concentração não devem ser removidas silenciosamente.

## Métricas futuras do produto

Quando houver usuários suficientes para medir produto, avaliar:

- percentual de aportes planejados que viram aportes registrados;
- percentual de recomendações com explicação aberta pelo usuário;
- desvio médio entre carteira atual e alvo;
- redução de concentração involuntária;
- taxa de atualização de teses após eventos materiais;
- cobertura e atualidade dos dados;
- número de recomendações posteriormente invalidadas por erro de dado ou cálculo — meta próxima de zero.
