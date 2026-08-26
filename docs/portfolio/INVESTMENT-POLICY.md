# Política de Investimentos — Base do Produto

> Política inicial de pesquisa e produto. Não é uma recomendação universal e deve ser parametrizada antes de atender outros perfis.

## Objetivo

Construir patrimônio no longo prazo sem comprometer liquidez de curto prazo, equilibrando segurança, crescimento, renda, valorização e diversificação.

## Caso-base atual

- aporte recorrente mínimo considerado no desenho: **R$ 1.000/mês**;
- horizonte: múltiplos buckets de curto, médio e longo prazo;
- preferência por processo simples e sustentável;
- evitar pulverização desnecessária;
- acompanhar profundamente menos ativos em vez de possuir muitos superficialmente.

## Hierarquia

1. reserva e obrigações de curto prazo;
2. proteção de poder de compra;
3. diversificação geográfica;
4. ativos de qualidade;
5. oportunidades de preço;
6. renda/dividendos sustentáveis;
7. satélites de maior risco em peso controlado.

## Carteira-modelo de referência

```text
Renda fixa       45%
Ações Brasil     22%
ETFs globais     18%
FIIs             10%
Alternativos      5%
```

Nenhum desses pesos deve ser hard-coded. O sistema deve permitir políticas diferentes por objetivo/perfil.

## Construção por fases

### Fase inicial

Foco em poucos instrumentos e 6–8 ações brasileiras no máximo, distribuídas por diferentes fontes de risco.

### Fase intermediária

8–10 ações se o patrimônio, aporte e capacidade de acompanhamento justificarem.

### Fase madura

12–15 ações somente se cada nova posição adicionar diversificação ou oportunidade real. Não adicionar ticker para preencher setor.

## Setores

Estrutura inicial de pesquisa:

| Setor/fator | Quantidade inicial aproximada | Objetivo |
|---|---:|---|
| Bancos/financeiro | 1–2 | qualidade, rentabilidade e dividendos |
| Energia/petróleo | 1 | geração de caixa/ciclo |
| Mineração/commodities | 1 | diversificação global/cíclica |
| Indústria | 1–2 | crescimento e internacionalização |
| Seguros | 1 | renda e negócio leve em capital |
| Consumo/shoppings | 0–1 | oportunidade doméstica |
| Tecnologia | via ETF no início | crescimento global diversificado |

Correlação e fatores econômicos importam mais que a contagem de empresas.

## Candidatos iniciais de pesquisa

### Carteira/radar inicial

- ITUB4 — financeiro;
- WEGE3 — indústria/eletrificação;
- EMBJ3 — indústria/aeroespacial/defesa;
- VALE3 — mineração/commodities;
- PETR4 — energia/petróleo;
- CXSE3 — seguros/serviços financeiros.

### Radar adicional

- ITSA4;
- ALOS3;
- BBSE3;
- B3SA3;
- PRIO3;
- small caps selecionadas futuramente.

A entrada depende de Quality, Opportunity e Portfolio Fit. Estar nesta lista não cria obrigação de compra.

## ETFs globais

Princípio: usar ETF como núcleo de diversificação para não precisar escolher dezenas de empresas estrangeiras individualmente.

Candidatos estudados:

- WRLD11 — núcleo global;
- NASD11 — satélite de crescimento/tecnologia.

A sobreposição entre ETFs deve ser medida; adicionar dois ETFs não significa automaticamente mais diversificação.

## FIIs

Objetivo: renda imobiliária e diversificação, sem perseguir dividend yield isolado.

Segmentos discutidos:

- logística;
- shopping;
- renda urbana;
- papel/CRI;
- híbridos.

Candidatos estudados:

- HGLG11;
- XPML11;
- KNCR11.

Avaliar vacância, contratos, crédito, alavancagem, qualidade de ativos/devedores e sustentabilidade dos rendimentos.

## Alternativos

Bitcoin foi discutido como satélite de alto risco, com peso-modelo de 5%.

Exemplo de limites conceituais:

```text
target    5%
soft max  6%
hard max  8%
```

Limites reais são configuração. Acima do soft limit, novos aportes podem ser bloqueados; acima do hard limit, deve haver alerta/revisão conforme política.

## Aporte recorrente

Para R$ 1.000/mês, não comprar todos os ativos mensalmente.

Exemplo de alocação por classe quando partindo de zero:

```text
Renda fixa       R$ 450
Ações Brasil     R$ 220
ETFs globais     R$ 180
FIIs             R$ 100
Alternativos     R$  50
```

Na carteira real, o `ContributionAllocator` deve usar:

- reserva pendente;
- gap de classe;
- gap setorial/fator;
- peso atual;
- Quality;
- Opportunity;
- Portfolio Fit;
- limites;
- aporte mínimo significativo;
- unidade mínima/custo;
- dados disponíveis.

Ele deve selecionar **poucos destinos relevantes** em vez de gerar microaportes.

## Rebalanceamento

Ordem preferencial:

1. aporte novo;
2. rendimentos recebidos;
3. venda somente quando necessária.

Motivos possíveis para venda/redução:

- quebra de tese;
- concentração/risco incompatível;
- necessidade de liquidez ligada ao objetivo;
- mudança estrutural de qualidade;
- oportunidade deixou de justificar posição e rebalanceamento por aporte não é suficiente;
- mudança de política.

Nunca vender apenas porque o preço caiu sem analisar tese.

## Critério de entrada

O motor deve evitar o raciocínio “empresa boa = comprar”.

Exemplo:

```text
Quality       9.5
Opportunity   5.0
Portfolio Fit 4.0
Recommendation: zero ou pequena
```

## Dividendos

Não selecionar por dividend yield isolado. Avaliar sustentabilidade, caixa, payout, dívida, capex e crescimento.

## Risco

Não existe garantia de retorno. O sistema deve comunicar volatilidade, possibilidade de perda e incerteza.

Ativos usados para objetivos de curto prazo devem ser compatíveis com liquidez e preservação esperadas.

## Revisões

Proposta inicial:

- carteira/gaps: recalculados a cada alteração material;
- recomendação de aporte: a cada novo aporte;
- teses: revisão trimestral ou após evento material;
- política de alocação: revisão semestral/anual, evitando mudanças por ruído de mercado.

A periodicidade final será configurável e testada no produto.
