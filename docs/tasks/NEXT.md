# Próxima Atividade — Portfolio Engine: TargetAllocation

**Status:** READY após merge da projeção de posições por ativo.

## Objetivo

Modelar a política de alocação-alvo de um `PortfolioId` como configuração determinística e validada, reutilizando `AllocationWeight` e a taxonomia econômica já existente, sem ainda calcular gaps, recomendar aportes ou usar valores de mercado.

## Escopo

- estrutura imutável de `TargetAllocation` vinculada a `PortfolioId`;
- buckets de alocação com identidade/taxonomia explícita e peso-alvo;
- reutilização de `AllocationWeight`, sem `number` binário;
- política explícita para soma dos pesos da configuração;
- rejeição de buckets duplicados;
- snapshot determinístico somente se fizer sentido para a configuração;
- testes de invariantes, limites e round-trip quando aplicável;
- documentação da decisão e das fronteiras com `AllocationGap`.

## Fora de escopo

- cálculo de `AllocationGap`;
- valor atual da carteira;
- preço de ativo;
- FX;
- recomendação de aporte;
- `ContributionAllocator`;
- limites de concentração `softMaxWeight`/`hardMaxWeight`;
- unidade mínima negociável;
- custos, impostos e rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- a configuração pertence explicitamente a um `PortfolioId`;
- pesos usam `AllocationWeight` e mantêm precisão determinística;
- a soma total segue uma política explícita e testada;
- buckets duplicados não são aceitos silenciosamente;
- não existe dependência de preço, posição atual ou dado externo;
- a API não antecipa o cálculo de gap nem recomendação;
- execução repetida/snapshot, quando houver, é determinística;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- configuração válida com um bucket;
- configuração válida com múltiplos buckets;
- soma válida dos pesos;
- soma abaixo da política permitida/rejeitada conforme decisão explícita;
- soma acima da política rejeitada;
- bucket duplicado;
- peso zero quando permitido/rejeitado conforme decisão explícita;
- portfolios diferentes permanecem configurações distintas;
- snapshot/round-trip determinístico quando aplicável.
