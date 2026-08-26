# ADR-0018 — Onboarding financeiro é configuração declarativa separada da carteira

**Status:** Aceita  
**Data:** 2026-08-26

## Contexto

Com o Portfolio Engine básico fechado, o MVP precisa conhecer informações financeiras mínimas antes de apresentar carteira e aporte: horizonte, tolerância a risco, reserva de emergência e objetivos.

Esses dados não são holdings, saldo corrente, fatos do ledger ou recomendação. Também não existe autenticação/persistência nesta etapa, portanto vincular o modelo a `User`, conta ou banco criaria dependências prematuras.

## Decisão

Criar o módulo de domínio `onboarding` com `FinancialProfile` como configuração declarativa independente de `Portfolio`.

O agregado recebe identidade UUID do caller e não gera identidade internamente. `FinancialProfileId` não é `UserId`, não representa autenticação e não é reutilizado como `PortfolioId`.

O perfil possui:

- `referenceCurrency`;
- `RiskTolerance`;
- `FinancialHorizon`;
- `emergencyReserveTarget` opcional;
- coleção de `FinancialGoal`.

Nenhum desses campos altera automaticamente `TargetAllocation`, limites ou recomendação de aporte.

## Tolerância a risco

A taxonomia inicial é deliberadamente pequena:

- `LOW`;
- `MEDIUM`;
- `HIGH`.

Ela representa uma preferência declarada. Não é suitability regulatório, score calculado, questionário psicométrico nem recomendação automática. A futura UI pode coletar respostas e pedir confirmação, mas qualquer transformação em política de investimento exige decisão explícita própria.

## Horizonte financeiro

A taxonomia inicial é:

- `SHORT`;
- `MEDIUM`;
- `LONG`.

Os nomes alinham com os horizontes conceituais já documentados, mas o domínio não calcula a categoria a partir de anos nem resolve fronteiras de calendário. O onboarding recebe a escolha explícita do caller.

## Reserva de emergência

`emergencyReserveTarget` é opcional. Quando configurado:

- usa `Money`;
- precisa ser estritamente positivo;
- precisa ter a mesma moeda de referência do perfil.

O perfil não armazena saldo atual da reserva, número de meses de despesas ou fórmula para derivar a meta. Esses dados exigem contratos próprios quando entrarem no produto.

`null` significa alvo ainda não configurado; não significa que o usuário não deva possuir reserva.

## Objetivos financeiros

Cada `FinancialGoal` possui identidade UUID própria, tipo, `targetAmount` e data-alvo opcional conforme a taxonomia.

Tipos iniciais:

- `NET_WORTH` — patrimônio-alvo;
- `PASSIVE_INCOME_MONTHLY` — renda passiva mensal-alvo, com unidade temporal explícita;
- `RETIREMENT` — objetivo de aposentadoria;
- `DATED_PURPOSE` — objetivo cuja data-alvo é obrigatória.

`targetAmount` deve ser estritamente positivo. Dentro de um `FinancialProfile`, todos os objetivos usam a moeda de referência do perfil.

`targetDate`, quando presente, usa data civil canônica `YYYY-MM-DD`. Não há validação relativa a “hoje”; isso evitaria determinismo e exigiria um relógio/as-of explícito. `DATED_PURPOSE` exige data, enquanto os demais tipos podem existir com ou sem data-alvo.

## Snapshot e ordenação

`FinancialProfileSnapshot` e `FinancialGoalSnapshot` expõem somente strings, arrays e snapshots monetários serializáveis. Não expõem `bigint`, classes ou infraestrutura.

Objetivos são copiados e ordenados por `FinancialGoalId`, de forma que ordem de entrada não seja tratada silenciosamente como prioridade financeira.

IDs duplicados são rejeitados após normalização.

## Erros

Configurações inválidas usam erros tipados do módulo `onboarding`. Divergência de moeda reutiliza `CurrencyMismatchError`, mantendo a regra monetária centralizada.

## Consequências positivas

- onboarding pode evoluir sem contaminar o agregado `Portfolio`;
- autenticação e persistência continuam fora do domínio;
- perfil declarado não vira política de alocação implicitamente;
- snapshots ficam prontos para futura API/persistência;
- metas não são confundidas com saldos atuais;
- datas não dependem do relógio do processo;
- renda passiva não fica ambígua quanto ao período.

## Limites deliberados

Este ADR não define:

- questionário de suitability;
- score de risco;
- perfil regulatório;
- fórmula de reserva por meses de despesas;
- saldo atual da reserva;
- progresso de objetivos;
- vínculo automático perfil -> `TargetAllocation`;
- autenticação;
- persistência;
- API ou UI;
- recomendação de ativos;
- IA.

## Alternativas rejeitadas

### Colocar esses campos em `Portfolio`

Rejeitada porque objetivos e tolerância pertencem à configuração financeira do usuário, enquanto `Portfolio` permanece identidade/configuração da carteira e posições/saldos são projeções próprias.

### Inferir alocação diretamente da tolerância a risco

Rejeitada porque transformaria três categorias declarativas em recomendação financeira sem metodologia explícita.

### Armazenar saldo da reserva no perfil

Rejeitada porque saldo é estado financeiro mutável/projetável, não configuração declarativa.

### Usar `PASSIVE_INCOME` sem período

Rejeitada porque um `Money` isolado não informa se a meta é mensal, anual ou outra periodicidade.
