# Próxima Atividade — Portfolio Engine: limites de concentração por AssetClass

**Status:** READY após merge das restrições de execução do aporte.

## Objetivo

Adicionar limites configuráveis de concentração ao fluxo de aporte, começando por `AssetClass`, para impedir que novas alocações ultrapassem limites duros e representar de forma explícita a política de limite suave sem depender de preço, ticker ou dados externos.

## Escopo

- contrato de concentração por `AssetClass`;
- `softMaxWeight` e `hardMaxWeight` usando `AllocationWeight`;
- validação explícita de `softMaxWeight <= hardMaxWeight`;
- aplicação sobre o estado monetário atual e a alocação de aporte já calculada;
- cálculo determinístico do peso projetado após o aporte usando unidades inteiras/exatas;
- `hardMaxWeight` impede nova alocação que viole o limite;
- semântica explícita para `softMaxWeight` como restrição/alerta do fluxo de novos aportes;
- tratamento determinístico de valor bloqueado, mantendo sobra em `unallocatedContribution`;
- nenhuma alocação acima do limite duro;
- testes de limites, bordas, precisão e determinismo;
- documentação da fronteira com concentração futura por ativo, setor, emissor, moeda/geografia e grupo econômico.

## Fora de escopo

- concentração por ativo individual que dependa de valuation/preço atual;
- setor, emissor, grupo econômico, moeda e geografia;
- preço em tempo real;
- FX;
- Quality/Opportunity/Portfolio Fit;
- custos e impostos;
- venda/rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- pesos usam `AllocationWeight`/representação exata, sem `number` binário financeiro;
- configuração inválida (`soft > hard`, duplicidade ou shape inválido) é rejeitada por erro tipado;
- classe sem limite explícito mantém comportamento anterior;
- limite duro nunca é ultrapassado pela recomendação final;
- política de limite suave é determinística e documentada;
- valor bloqueado não é perdido nem forçado silenciosamente para destino inválido;
- cálculos anteriores de necessidade pós-aporte não são reescritos;
- execução repetida com a mesma entrada produz o mesmo resultado;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- classe sem limite;
- classe abaixo do limite suave;
- classe entre limite suave e duro;
- classe que atingiria/excederia o limite duro;
- `softMaxWeight == hardMaxWeight`;
- `softMaxWeight > hardMaxWeight` rejeitado;
- duplicidade de configuração rejeitada;
- múltiplas classes com limites distintos;
- sobra explícita quando parte do aporte é bloqueada;
- arredondamento/limite em centavos sem float;
- resultado e ordem reproduzíveis.
