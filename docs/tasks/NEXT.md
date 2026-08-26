# Próxima Atividade — Portfolio Engine: política de microaporte e limite de destinos

**Status:** READY após merge de ContributionAllocator.

## Objetivo

Adicionar uma camada determinística de política sobre o baseline do `ContributionAllocator` para evitar microaportes artificiais e limitar a quantidade de destinos de um aporte, preservando as invariantes monetárias e a prioridade por necessidade pós-aporte.

## Escopo

- `minimumMeaningfulContribution` como valor monetário mínimo configurável para uma alocação sugerida;
- `maxDestinationsPerContribution` como limite inteiro positivo configurável;
- aplicação da política sobre necessidades/alocações produzidas pelo baseline do `ContributionAllocator`;
- priorização determinística das classes com maior necessidade pós-aporte quando nem todos os destinos puderem ser atendidos;
- desempate determinístico por `AssetClass`;
- redistribuição/reconciliação do aporte somente entre destinos selecionados, sem exceder a necessidade de nenhum bucket;
- sobra explícita em caixa quando as restrições impedirem distribuir todo o aporte;
- contratos e erros tipados para configurações inválidas;
- testes de invariantes, bordas e determinismo;
- documentação clara da relação entre baseline proporcional e política de concentração do aporte.

## Fora de escopo

- unidade mínima negociável de ativo;
- preço, FX ou valuation;
- escolha de ticker/ativo específico dentro da classe;
- `softMaxWeight`/`hardMaxWeight` e demais limites de concentração da carteira;
- elegibilidade por ativo;
- custos e impostos;
- venda/rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- configuração não usa `number` para valores monetários;
- `minimumMeaningfulContribution` é não negativo e usa a mesma moeda do aporte/plano;
- `maxDestinationsPerContribution` é validado explicitamente como inteiro positivo;
- destinos com necessidade pós-aporte zero continuam inelegíveis;
- quando houver mais destinos elegíveis que o limite, a seleção segue maior necessidade e desempate lexical;
- alocações abaixo do mínimo configurado não são emitidas como microaportes artificiais;
- qualquer redistribuição continua reconciliada em unidades mínimas;
- nenhuma alocação ultrapassa a necessidade do bucket;
- soma alocada nunca ultrapassa o aporte;
- sobra não distribuível permanece explícita e não é forçada para um destino inválido;
- execução repetida com a mesma entrada produz o mesmo resultado;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- mínimo igual a zero preserva comportamento baseline;
- limite maior que a quantidade de destinos elegíveis preserva comportamento baseline;
- limite de um destino seleciona a maior necessidade;
- empate de necessidade usa ordem lexical;
- aporte pequeno demais para qualquer destino fica como sobra;
- bucket que receberia valor abaixo do mínimo é removido e o valor é redistribuído quando possível;
- redistribuição não excede a necessidade dos destinos restantes;
- combinação de mínimo e limite de destinos;
- configuração monetária em moeda diferente é rejeitada;
- limite zero, negativo, fracionário ou inválido é rejeitado;
- ordem e resultado reproduzíveis.
