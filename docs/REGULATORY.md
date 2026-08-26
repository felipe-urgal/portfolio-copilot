# Regulatório

> Documento de engenharia de produto, não parecer jurídico. Revisar com profissional especializado antes de disponibilização pública ou monetização.

## Data de referência

26/08/2026.

## Fronteira principal

A Resolução CVM 19 define consultoria de valores mobiliários como orientação, recomendação e aconselhamento, de forma profissional, independente e individualizada, sobre investimentos no mercado de valores mobiliários, cuja adoção e implementação sejam exclusivas do cliente.

Fonte oficial:

- https://conteudo.cvm.gov.br/legislacao/resolucoes/resol019.html
- https://www.gov.br/cvm/pt-br/assuntos/noticias/2026/area-tecnica-da-cvm-orienta-sobre-atividade-de-consultoria-de-valores-mobiliarios

Em 19/01/2026, a CVM publicou orientação adicional (Ofício Circular CVM/SIN 2/2026) sobre a atividade, reforçando deveres de atuação profissional, independência, compreensão do perfil do cliente e melhor interesse.

## Suitability

A Resolução CVM 30 trata da adequação de produtos, serviços e operações ao perfil do cliente. Entre os elementos relevantes estão objetivos, horizonte, tolerância a risco, situação financeira, necessidade futura de recursos e conhecimento.

A CVM também publicou avaliação em 21/01/2025 sobre o processo de suitability.

Fontes:

- https://www.gov.br/cvm/pt-br/assuntos/noticias/2025/cvm-publica-estudo-sobre-o-processo-de-analise-do-perfil-do-investidor-suitability-e-a-eficacia-da-resolucao-cvm-30
- https://www.gov.br/cvm/pt-br/centrais-de-conteudo/publicacoes/estudos/arr-suitability.pdf/view

## Consequência para o produto

### Uso pessoal/controlado

A primeira fase será tratada como ferramenta interna de organização, pesquisa e apoio à própria decisão. Ainda assim, a arquitetura registra perfil, risco, método e explicações corretamente para evitar dívida regulatória.

### Produto público

Antes de permitir recomendação individualizada a terceiros, monetização, prestação profissional ou qualquer funcionalidade equivalente, abrir **Regulatory Gate** obrigatório para:

- revisão jurídica do modelo de negócio;
- confirmação de enquadramento perante CVM e demais regras aplicáveis;
- definição de entidade responsável e eventuais registros/autorizações;
- conflitos de interesse e modelo de remuneração;
- suitability;
- documentos e disclosures;
- retenção/auditoria;
- LGPD e política de privacidade;
- termos de uso;
- publicidade e linguagem de recomendação;
- atendimento e tratamento de reclamações.

Nenhuma feature flag transforma o produto em consultoria pública sem esse gate concluído.

## Relatórios gerenciais

O texto consolidado da Resolução CVM 19 contém exclusões e nuances específicas, inclusive para certas atividades de planejamento e relatórios gerenciais. Não inferir que isso automaticamente cobre o produto. O conjunto de funcionalidades e a forma de prestação devem ser analisados como um todo.

## Execução de ordens

Fora do MVP. Se for estudada futuramente, exige projeto regulatório, operacional e de segurança independente. Não é apenas uma integração técnica.

## Open Finance

É uma possível fonte futura de dados consentidos, não autorização automática para prestar recomendação ou executar investimentos. Consentimento, escopo, segurança e regras aplicáveis devem ser tratados separadamente.

## Regra de engenharia

Toda mudança que altere uma destas capacidades requer revisão deste documento:

- personalização da recomendação;
- usuários externos;
- cobrança/remuneração;
- ranking patrocinado;
- integração com distribuidor/corretora;
- execução/encaminhamento de ordem;
- compartilhamento de dados financeiros;
- Open Finance;
- publicidade de performance.
