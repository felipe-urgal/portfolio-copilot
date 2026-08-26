# Próxima Atividade — Portfolio Engine: custos e impactos tributários como restrições do aporte

**Status:** READY após merge dos limites de concentração por `AssetClass`.

## Objetivo

Adicionar contratos determinísticos para representar custos transacionais e impactos tributários materiais já conhecidos como restrições do aporte, sem calcular imposto a partir de regras externas nem buscar tarifas no meio do domínio puro.

## Escopo

- contrato explícito de custo por destino de aporte usando `Money`;
- representação separada de custo transacional e impacto tributário estimado/fornecido;
- validação de moeda e valores não negativos;
- aplicação sobre alocações já filtradas por política, execução e concentração;
- impedir aporte economicamente inviável quando custo conhecido consumir ou superar o valor destinado;
- preservação explícita de valor bloqueado em `unallocatedContribution`;
- sinalização auditável do motivo do bloqueio;
- nenhuma redistribuição silenciosa sem política própria;
- testes de borda, moeda, centavos, determinismo e integração com as camadas anteriores;
- documentação clara de que cálculo fiscal, tabela de corretora e provenance de dados são responsabilidades externas futuras.

## Fora de escopo

- cálculo de imposto de renda, come-cotas ou regras fiscais específicas;
- consulta de tarifa de corretora/provedor;
- preço em tempo real;
- FX;
- venda/rebalanceamento;
- concentração por ativo, setor, emissor, moeda/geografia ou grupo econômico;
- Quality/Opportunity/Portfolio Fit;
- persistência, banco e repositórios;
- API;
- UI;
- IA.

## Critérios de aceite

- custos monetários usam `Money`, sem `number` binário financeiro;
- moedas incompatíveis são rejeitadas explicitamente;
- custos negativos ou configurações inválidas falham por erro tipado;
- custo conhecido não é descontado silenciosamente da posição recomendada;
- destino inviável não produz recomendação executável incorreta;
- sobra causada pela restrição permanece explícita e reconciliada;
- nenhuma regra tributária externa é inventada dentro do domínio;
- mesma entrada produz mesma saída;
- `pnpm check` passa integralmente no head final validado.

## Casos de teste mínimos

- destino sem custo;
- custo transacional positivo menor que a alocação;
- custo igual à alocação;
- custo maior que a alocação;
- impacto tributário fornecido separadamente;
- combinação de custo + impacto tributário;
- moeda divergente;
- custo negativo;
- múltiplos destinos;
- preservação de sobra upstream;
- valores em centavos;
- resultado reproduzível e imutável.
