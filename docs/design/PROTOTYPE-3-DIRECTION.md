# Direção visual canônica — Protótipo 3

## Status

**APROVADO — referência obrigatória da issue #69**

O **Protótipo 3 — Assistant-First Workspace** é a direção visual oficial do redesign completo do Portfolio Copilot.

Esta imagem **não é apenas inspiração**. Ela funciona como design reference para a nova fundação visual e de interação. A implementação pode refinar detalhes necessários para acessibilidade, responsividade, dados reais e limitações funcionais, mas não deve reinterpretar do zero a arquitetura ou a linguagem do produto a cada tela.

## Referência visual

![Protótipo 3 — Assistant-First Workspace](./prototypes/prototype-3-assistant-first-dashboard.jpg)

Arquivo canônico:

`docs/design/prototypes/prototype-3-assistant-first-dashboard.jpg`

## Elementos estruturais a preservar

- sidebar lateral limpa e persistente no desktop;
- navegação com hierarquia simples, item ativo claramente identificado e área de conta/sessão no rodapé;
- conteúdo principal com grid amplo, alta legibilidade e densidade financeira controlada;
- header de contexto enxuto, com poucas ações globais;
- KPIs compactos no topo como resumo, sem dominar a tela;
- grande área central para o panorama da carteira;
- painel lateral **Copiloto** como contexto e orientação, não como chat ocupando o produto inteiro;
- teses, eventos e próximos passos como blocos secundários abaixo da visão principal;
- indigo/violeta como accent restrito, com superfícies neutras e tipografia escura;
- informação financeira escaneável, comparável e com hierarquia visual explícita;
- uso de cards apenas quando representam unidades reais de informação ou interação.

## Linguagem de produto

A direção escolhida deve fazer o Portfolio Copilot parecer:

- produto financeiro confiável e contemporâneo;
- assistente de decisão, não terminal técnico;
- orientado a contexto e ação;
- premium sem excesso decorativo;
- inteligente sem depender de efeitos de IA como gimmick;
- denso o suficiente para finanças, mas não visualmente pesado.

## Ajustes permitidos e esperados

O protótipo foi gerado como conceito e contém dados/labels ilustrativos. Durante a implementação é obrigatório ajustar:

- valores e métricas para refletirem apenas capacidades reais do domínio;
- copy para não prometer informação indisponível;
- largura e comportamento do painel Copiloto;
- contraste e escala tipográfica;
- estados hover/focus/active/selected/disabled/loading/error;
- desktop, tablet e mobile;
- acessibilidade WCAG 2.2 AA;
- gráficos/tabelas conforme dados realmente existentes;
- iconografia para uma família consistente;
- motion apenas quando melhora compreensão.

## O que não pode acontecer

- redesenhar cada página com uma linguagem diferente;
- voltar ao padrão atual de grandes caixas técnicas e mensagens operacionais dominantes;
- transformar o dashboard em uma grade genérica de cards;
- transformar o Copiloto em um chat que substitua a navegação principal;
- adicionar chrome, badges, pills ou borders apenas para preencher espaço;
- alterar regras financeiras para fazer a interface "bater" com o mockup;
- inventar métricas ou dados para reproduzir números ilustrativos do conceito;
- implementar uma direção visual incompatível e ainda chamá-la de evolução do Protótipo 3.

## Aplicação nas superfícies

O mesmo sistema derivado deste protótipo deve ser expandido para:

- sign-in e sign-out;
- onboarding;
- dashboard;
- carteira;
- shell/navegação;
- perfil e sessão;
- formulários e transações;
- teses e eventos;
- empty/loading/error/success states;
- futura UI do Copiloto (#45);
- mobile/tablet/desktop.

## Gate de fidelidade

Para cada PR visual relevante:

1. identificar quais padrões do Protótipo 3 estão sendo aplicados;
2. implementar desktop e mobile no mesmo sistema;
3. preservar comportamento e regras existentes;
4. executar browser QA;
5. comparar screenshot da implementação com a direção aprovada;
6. registrar e justificar qualquer desvio material;
7. somente considerar a superfície concluída quando a solução parecer parte do mesmo produto do protótipo aprovado.

## Relação com o roadmap

- **R0** continua responsável pelo inventário completo do frontend atual;
- **R1** deixa de explorar uma direção visual do zero: deve **refinar, sistematizar e expandir o Protótipo 3** para todas as superfícies e estados;
- **R2** transforma essa direção em tokens e primitives;
- **R3–R9** aplicam o sistema progressivamente ao app inteiro;
- **R10** bloqueia novas superfícies fora dessa fundação.
