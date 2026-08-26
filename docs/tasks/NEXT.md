# Próxima Atividade — Portfolio Engine: orquestração do pipeline de aporte e snapshot auditável

**Status:** READY após merge das restrições de custo e impacto tributário.

## Objetivo

Compor as camadas já existentes do Portfolio Engine em um fluxo único e determinístico de recomendação de aporte, produzindo um snapshot final auditável sem adicionar novas regras financeiras.

## Escopo

- função/orquestrador puro para executar o pipeline canônico de aporte;
- ordem explícita: allocator -> política de microaporte -> concentração por `AssetClass` -> restrições de execução -> custos/impacto tributário;
- entrada composta reutilizando os contratos já existentes, sem duplicar validações financeiras;
- saída final com destinos, valores brutos, valor investível, custos conhecidos, unidade mínima e sobra explícita;
- reason/status codes determinísticos para decisões materiais de bloqueio ou alerta que sobrevivam ao pipeline;
- preservação de `PortfolioId`, moeda e identidades `AssetId`/`AssetClass`;
- snapshot imutável e reproduzível;
- campo explícito de `methodologyVersion` fornecido pela camada chamadora, sem inventar versão em runtime;
- testes end-to-end do domínio cobrindo composição e reconciliação monetária;
- documentação da fronteira entre motor puro e futuros adapters de dados/provenance.

## Fora de escopo

- novas fórmulas de alocação;
- Quality Score, Opportunity Score ou Portfolio Fit;
- ranking de ativos;
- preço em tempo real;
- FX;
- cálculo fiscal;
- consulta de tarifas;
- venda/rebalanceamento;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- o orquestrador reutiliza as funções existentes em vez de reimplementar regras;
- nenhuma etapa posterior perde silenciosamente a provenance de bloqueios/alertas anteriores;
- soma entre valores investíveis, custos consumidos e sobra final reconcilia com o aporte sob as semânticas já definidas;
- `methodologyVersion` é explícita e estável na saída;
- ordem dos destinos e reason codes é determinística;
- erros tipados das camadas internas continuam observáveis sem wrapping genérico;
- nenhuma dependência externa é chamada pelo domínio puro;
- execução repetida com a mesma entrada produz snapshot equivalente;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- fluxo sem restrições adicionais;
- microaporte concentrado;
- hard limit bloqueando parte da alocação;
- destino inelegível;
- custo reduzindo valor investível;
- custo bloqueando destino;
- combinação de múltiplas restrições;
- sobra upstream preservada entre etapas;
- múltiplos destinos com ordem estável;
- erro de uma camada interna propagado tipado;
- `methodologyVersion` preservada;
- resultado imutável e reproduzível.
