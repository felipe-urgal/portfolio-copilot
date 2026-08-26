# Próxima Atividade — Portfolio Engine: unidade mínima negociável e elegibilidade do aporte

**Status:** READY após merge da política de microaporte e limite de destinos.

## Objetivo

Adicionar contratos determinísticos para representar se um destino de aporte pode ser executado e qual é sua unidade mínima negociável, sem buscar preço, lote ou dados de mercado dentro das funções puras do domínio.

## Escopo

- contrato explícito de elegibilidade para destinos de aporte;
- representação da unidade mínima negociável usando tipo exato adequado, sem `number` binário para quantidade;
- associação da restrição ao destino/ativo correspondente sem usar ticker como identidade;
- aplicação da elegibilidade após a seleção econômica por `AssetClass` e antes de qualquer recomendação executável por ativo;
- rejeição explícita de configurações inválidas;
- tratamento determinístico de destinos inelegíveis;
- preservação de `unallocatedContribution` quando restrições de execução impedirem alocação integral;
- testes de precisão, bordas, identidade e determinismo;
- documentação da fronteira entre regra de domínio e dados externos que futuramente alimentarão a regra.

## Fora de escopo

- consulta de preço em tempo real;
- FX;
- seleção/ranking de ticker dentro da classe;
- integração com corretora;
- execução de ordens;
- `softMaxWeight`/`hardMaxWeight` e demais limites de concentração;
- custos e impostos;
- venda/rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- nenhuma quantidade financeira relevante usa `number` binário;
- identidade de ativo usa `AssetId`, não ticker/provedor;
- elegibilidade é explícita e determinística;
- unidade mínima inválida é rejeitada por erro tipado;
- destino inelegível não recebe recomendação executável;
- restrições não alteram silenciosamente os cálculos de necessidade pós-aporte já estabelecidos;
- sobra causada por restrição permanece explícita;
- nenhuma chamada externa ocorre no meio do cálculo puro;
- execução repetida com a mesma entrada produz o mesmo resultado;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- destino elegível;
- destino inelegível;
- unidade mínima válida com precisão exata;
- unidade mínima zero/negativa ou shape inválido rejeitado conforme contrato definido;
- ativos distintos com ticker potencialmente igual continuam separados por `AssetId`;
- combinação de destinos elegíveis e inelegíveis;
- sobra quando nenhum destino pode executar o aporte;
- resultado reproduzível;
- nenhuma regressão nas políticas de microaporte e limite de destinos.
