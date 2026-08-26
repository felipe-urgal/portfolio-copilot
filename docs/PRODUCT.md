# Especificação de Produto

## Proposta de valor

Portfolio Copilot é uma ferramenta de apoio à decisão para o investidor que quer construir patrimônio com método. O produto combina carteira, objetivos, risco, fundamentos, valuation e eventos de mercado para produzir um plano de aporte explicável.

## Jornada principal

1. usuário define objetivos, horizonte, reserva e tolerância a risco;
2. cadastra ou importa patrimônio e posições;
3. define política de alocação ou aceita uma política-base revisável;
4. informa o valor disponível para o próximo aporte;
5. o motor identifica gaps da carteira;
6. o motor de investimentos classifica ativos elegíveis;
7. o Portfolio Fit combina qualidade, oportunidade e necessidade da carteira;
8. o sistema sugere destinos e valores;
9. o usuário entende os motivos e decide se executa externamente;
10. após executar, registra a transação e a carteira é recalculada.

## Telas do MVP

### Dashboard

- patrimônio total;
- aporte planejado do mês;
- progresso da reserva;
- alocação atual versus alvo;
- principais desvios;
- botão principal: **Onde investir meu aporte?**

### Carteira

- posições;
- custo médio;
- valor atual quando houver cotação;
- peso atual;
- peso alvo;
- classe e setor;
- risco;
- tese associada.

### Aporte do mês

Entrada: valor disponível.

Saída:

- destino;
- valor sugerido;
- motivo;
- efeito sobre a alocação;
- alertas de concentração;
- ativos bloqueados para novo aporte e motivo.

### Radar

Estados iniciais:

- carteira;
- candidato;
- acompanhar;
- aguardando preço;
- evitar novo aporte;
- tese em revisão.

### Teses

Cada tese deve conter:

- motivo de posse;
- drivers;
- riscos;
- indicadores a acompanhar;
- valuation de referência quando aplicável;
- eventos relevantes;
- critérios de redução/saída;
- data da última revisão.

### Configurações

- perfil e objetivos;
- alocação-alvo;
- limites de concentração;
- aporte mínimo;
- preferências de classes de ativos;
- fontes e atualidade dos dados.

## Conceitos que não podem ser misturados

### Asset Quality

Responde: **o ativo/empresa é bom?**

### Asset Opportunity

Responde: **a relação preço, fundamentos e risco está interessante agora?**

### Portfolio Fit

Responde: **este ativo ajuda esta carteira neste momento?**

### Recommendation

É consequência das três análises anteriores mais restrições, elegibilidade, liquidez e valor disponível.

## Requisitos de explicabilidade

Toda recomendação deve apresentar no mínimo:

- data/hora de referência;
- valor do aporte analisado;
- carteira usada no cálculo;
- política de alocação usada;
- scores e regras relevantes;
- principais motivos positivos;
- principais riscos;
- fontes/datas dos dados;
- versão do motor/metodologia.

## Requisitos de auditoria

Criar `RecommendationSnapshot` imutável com entrada, saída, metodologia e dados essenciais. A recomendação futura nunca deve sobrescrever a recomendação histórica.

## Fora de escopo do MVP

- execução de ordens;
- social trading;
- ranking público de usuários;
- alavancagem;
- derivativos;
- day trade;
- copy trading;
- indicação baseada somente em sentimento de notícia.
