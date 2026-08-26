# Project Brief — Portfolio Copilot

## Objetivo deste documento

Este é o resumo canônico das decisões de descoberta do Portfolio Copilot. Ele existe para que ideias discutidas antes e durante a fundação do projeto não fiquem dependentes de memória ou histórico de conversa.

Quando houver conflito entre uma ideia antiga e uma decisão posterior registrada em ADR/DECISIONS, a decisão mais recente e explicitamente aceita prevalece.

## Origem do produto

O projeto começou a partir da necessidade de montar e acompanhar uma carteira pessoal de investimentos com três horizontes:

- curto prazo;
- médio prazo;
- longo prazo.

A carteira deveria buscar uma combinação de:

- segurança e liquidez;
- crescimento de patrimônio;
- dividendos/renda;
- valorização por qualidade e preço;
- diversificação geográfica e setorial;
- exposição limitada a ativos de maior risco.

A evolução natural da planilha/manual de carteira levou à ideia de criar um **copiloto inteligente de investimentos**.

## Problema central

A principal pergunta que o produto deve responder é:

> **Tenho R$ X para investir agora. Considerando minha carteira, meus objetivos, meu risco, o preço/qualidade dos ativos e o cenário, onde faz mais sentido aportar e por quê?**

O sistema não deve responder apenas “compre X”. Ele deve dizer:

- quanto aportar;
- em qual ativo/classe;
- por que aquele destino foi priorizado;
- qual problema de alocação ele corrige;
- quais riscos permanecem;
- quais ativos não devem receber aporte naquele momento e por quê.

## Filosofia financeira discutida

### Horizontes

- curto prazo: aproximadamente 0–2 anos, prioridade para liquidez e preservação;
- médio prazo: aproximadamente 2–7 anos, equilíbrio entre preservação e crescimento;
- longo prazo: 7+ anos, maior capacidade de tolerar volatilidade.

### Três motores da renda variável

A pesquisa de ações deve distinguir:

1. **crescimento** — expansão de receita, lucro, retorno sobre capital e mercado endereçável;
2. **dividendos/qualidade** — geração de caixa, recorrência, balanço e capacidade sustentável de distribuir;
3. **valor/valorização** — diferença favorável entre preço e valor/fundamentos, com margem de segurança.

Uma ideia inicial para pesquisa foi 40% crescimento, 35% dividendos/qualidade e 25% valor dentro da parcela de ações, mas isso não é hard-coded nem política universal.

### Carteira-modelo V1 discutida

Como ponto de partida de estudo foi criada uma alocação-modelo:

```text
renda fixa       45%
ações Brasil     22%
ETFs globais     18%
FIIs             10%
Bitcoin           5%
```

Ela é referência de produto/metodologia, não recomendação permanente. A política final deve ser configurável por carteira.

### Ativos estudados na V1

Renda fixa:

- Tesouro Selic;
- Tesouro IPCA+;
- CDB/LCI/LCA oportunísticos.

Ações brasileiras inicialmente estudadas:

- ITUB4;
- WEGE3;
- EMBJ3;
- VALE3;
- PETR4;
- CXSE3.

ETFs globais inicialmente estudados:

- WRLD11;
- NASD11.

FIIs inicialmente estudados:

- HGLG11;
- XPML11;
- KNCR11.

Alternativos:

- Bitcoin, limitado a uma parcela pequena e tratado como satélite de alto risco.

Esses nomes são **candidatos de pesquisa**, não uma lista eterna de compra. O Investment Engine deve conseguir substituir, adicionar ou bloquear ativos conforme metodologia e dados.

### Radar discutido

Outros ativos citados para acompanhamento, sem obrigação de estarem na carteira:

- ITSA4;
- ALOS3;
- BBSE3;
- B3SA3;
- PRIO3;
- outras small caps selecionadas futuramente.

O produto deve separar claramente **carteira** de **radar**.

## Diversificação por setores

Uma decisão importante da descoberta foi **não comprar 3 ou 4 ações de cada setor apenas para parecer diversificado**.

Diversificação deve ser por fontes de risco, não quantidade de tickers.

Exemplo de estrutura inicial para ações brasileiras:

- bancos/financeiro: 1–2;
- energia/petróleo: 1;
- mineração/commodities: 1;
- indústria: 1–2;
- seguros: 1;
- consumo/shoppings: opcional conforme oportunidade;
- tecnologia global: preferencialmente via ETF no início.

Evolução sugerida conforme patrimônio, aporte e capacidade de acompanhamento:

```text
fase inicial        6–8 ações brasileiras
carteira madura     8–10 ações brasileiras
carteira maior      12–15 ações, somente se houver justificativa
```

Não existe meta de chegar a 15 ações. É um teto operacional aproximado antes de justificar complexidade adicional.

## Aporte mínimo discutido

O caso-base pessoal informado é **investir no mínimo R$ 1.000 por mês**.

Consequência de produto:

- o sistema não deve dividir R$ 1.000 mecanicamente entre 10–15 posições;
- pesos-alvo são objetivos de longo prazo;
- cada mês pode concentrar o aporte em poucos destinos elegíveis;
- o motor deve corrigir gaps com aportes ao longo do tempo;
- deve existir `minimumMeaningfulContribution` e `maxDestinationsPerContribution`;
- comprar zero de um ativo em determinado mês é comportamento normal.

Exemplo conceitual discutido para R$ 1.000/mês, antes de considerar carteira já existente:

```text
renda fixa        R$ 450
Ações Brasil      R$ 220
ETFs globais      R$ 180
FIIs              R$ 100
Bitcoin           R$  50
```

Esse exemplo ilustra pesos, mas o algoritmo real deve priorizar poucos destinos com gaps relevantes em vez de gerar microaportes.

## Core + Satellite

A arquitetura financeira deve suportar um modelo conceitual de **Core + Satellite**:

- Core: aproximadamente 70–80% em componentes robustos e diversificados;
- Satellite: aproximadamente 20–30% em teses mais específicas/agressivas.

Percentuais são referência de pesquisa e configuráveis.

Exemplos de Core:

- renda fixa de segurança/proteção;
- ETF global;
- empresas de alta qualidade;
- FIIs selecionados.

Exemplos de Satellite:

- teses específicas de crescimento/reprecificação;
- commodities cíclicas em peso controlado;
- small caps;
- Bitcoin.

## Protótipos anteriores

Antes do app foram criados dois artefatos conceituais:

### PDF

Função: servir como **manual da carteira**, contendo tese, função de cada ativo, horizonte, riscos, acompanhamento e regras de rebalanceamento.

### Planilha

Função: servir como **protótipo operacional**, contendo:

- pesos-alvo;
- aporte mensal editável;
- patrimônio atual;
- gaps;
- aporte recomendado;
- cenários de R$ 1.000, R$ 3.000, R$ 5.000 e R$ 10.000;
- teses e fontes.

O app deve absorver essas duas funções: **manual/explicabilidade + motor operacional**.

## Experiência principal do app

### Dashboard

Ideia de experiência discutida:

```text
Patrimônio
R$ 48.430

Resultado
+R$ 4.390
+9,97%

Aporte deste mês
R$ 1.000

[ Onde investir meus R$ 1.000? ]
```

O CTA de aporte deve ser a principal ação do produto.

### Resultado do aporte

Exemplo conceitual:

```text
WRLD11          R$ 300
Tesouro Selic   R$ 250
WEGE3           R$ 200
HGLG11          R$ 150
CXSE3           R$ 100
```

Cada linha deve ser expansível e explicar:

- necessidade da carteira;
- qualidade;
- oportunidade;
- efeito na diversificação;
- riscos;
- motivo de não selecionar alternativas.

### Radar

Estados discutidos:

- comprar/aportar;
- manter/aguardar preço;
- evitar novo aporte;
- observação;
- tese em revisão.

O radar não é uma lista de “dicas”; ele é uma fila de pesquisa e decisão.

### O que mudou?

O app deve filtrar ruído e destacar eventos materiais desde a última revisão.

Exemplos:

- resultado trimestral alterou rentabilidade;
- inadimplência mudou;
- guidance foi revisado;
- capex aumentou;
- novo contrato relevante;
- política de dividendos mudou;
- tese permanece intacta ou precisa revisão.

### Objetivos

O app deve permitir metas como:

- reserva de emergência;
- patrimônio-alvo;
- renda passiva-alvo;
- aposentadoria;
- objetivos com data e necessidade de liquidez.

### Simulador

Cenários discutidos:

- aporte mensal;
- 10/20+ anos;
- conservador/base/otimista;
- inflação;
- reinvestimento;
- comparação de aportes (ex.: R$ 1.000 vs R$ 1.500).

Projeções devem ser apresentadas como cenários, nunca garantias.

## Inteligência de mercado

O sistema poderá acompanhar e estruturar dados/eventos relacionados a:

- Selic/Copom;
- IPCA;
- atividade econômica;
- Fed e juros dos EUA;
- câmbio;
- petróleo;
- minério e outras commodities relevantes;
- resultados trimestrais;
- guidance;
- fatos relevantes;
- dividendos;
- fusões/aquisições;
- mudanças regulatórias;
- eventos geopolíticos quando materialmente ligados à tese.

Notícias não disparam ordens nem mudam score automaticamente sem regras e dados suficientes.

## Motores discutidos

### Portfolio Engine

- patrimônio;
- holdings;
- transações;
- pesos atuais/alvo;
- gaps;
- limites;
- aporte;
- rebalanceamento;
- risco.

### Investment Ranking Engine

Avalia qualidade, crescimento, valuation, rentabilidade, dívida, dividendos, momentum operacional e risco, com metodologias específicas por tipo de ativo/setor.

### Portfolio Fit Engine

Evita recomendar o maior score isolado quando a carteira já está concentrada. Combina oportunidade com necessidade da carteira.

### Market Intelligence

Transforma dados/notícias em eventos estruturados ligados a ativos e teses.

### Explainability Engine

Transforma outputs estruturados em uma justificativa clara, sem inventar cálculos.

## Separação essencial de conceitos

```text
Asset Quality
    ↓
A empresa/ativo é bom?

Asset Opportunity
    ↓
Está interessante ao preço/cenário atual?

Portfolio Fit
    ↓
Faz sentido para esta carteira agora?

Recommendation
    ↓
Quanto do aporte deve ir para onde?
```

Uma empresa excelente pode receber recomendação zero se estiver cara, acima do peso ou piorar a diversificação.

## Snapshot e aprendizado

Toda recomendação deve gerar `RecommendationSnapshot` imutável contendo:

- data/hora;
- carteira usada;
- aporte disponível;
- dados e `asOf`;
- metodologia/versionamento;
- scores;
- regras aplicadas;
- valores sugeridos;
- explicações.

Isso permitirá no futuro:

- reconstruir por que uma decisão foi tomada;
- medir qualidade do sistema;
- realizar backtesting honesto;
- comparar versões da metodologia.

O “aprendizado comigo” discutido significa salvar preferências e restrições explícitas — como aporte mínimo, objetivos e limites — e não permitir que uma IA altere regras silenciosamente.

## Segurança e execução

Decisão inicial:

- sem execução de ordens;
- sem senha/credencial de corretora;
- integração financeira futura preferencialmente read-only;
- usuário executa externamente e registra/importa depois.

## App, planilha e hospedagem

Foi discutido que um app oferece mais valor do que manter somente planilha, especialmente como PWA acessível no navegador/celular.

Também foi discutida a possibilidade de hospedagem em tiers gratuitos/serverless. **Nenhum fornecedor foi escolhido.** A decisão foi adiada para depois da documentação e fundação técnica.

Logo:

- PWA/web é direção proposta;
- infraestrutura gratuita/baixo custo é objetivo;
- Vercel/Cloudflare/Supabase ou equivalentes podem ser avaliados posteriormente;
- decisão de fornecedor precisa considerar segurança, banco, custos, limites e portabilidade.

## Evolução do produto discutida

### V1

Carteira, alocação, aportes e rebalanceamento.

### V2

Fundamentos, ranking, valuation e radar.

### V3

Notícias/eventos e IA assistiva.

### V4

Backtesting e avaliação histórica das recomendações.

### V5

Integrações read-only/Open Finance conforme viabilidade e enquadramento.

### V6

Alertas inteligentes.

### V7

Simulador avançado de patrimônio/objetivos.

### V8

Motor tributário, se a complexidade e fontes justificarem.

### V9+

Possíveis capacidades multiusuário/produto público, somente depois do Regulatory Gate.

## Princípio final

O Portfolio Copilot deve ser capaz de dizer **“não investir neste ativo agora”**, **“deixar parte em caixa”** ou **“dados insuficientes”**. Um sistema que sempre encontra uma compra não é inteligente; é perigoso.
