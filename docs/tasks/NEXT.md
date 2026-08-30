# Próxima Atividade — UX/UI R1: expandir o Protótipo 3 para o app inteiro

**Status:** READY

## Issue canônica

- #73 — `UX/UI R1: expandir Protótipo 3 para arquitetura e todas as superfícies`
- iniciativa guarda-chuva: #69

## R0 concluído

O audit de frontend foi registrado em:

- #72 — `UX/UI R0: audit completo do frontend atual`;
- `docs/design/FRONTEND-AUDIT.md`.

O audit confirmou três necessidades estruturais antes das migrações por tela:

1. arquitetura de informação canônica;
2. design tokens/primitives compartilhadas;
3. shell único e responsivo.

A experiência mobile atual foi auditada por código/breakpoints, mas não recebeu visual QA em viewport real. Isso está explicitamente registrado e será validado no produto redesenhado em #81.

## Objetivo

Transformar o **Protótipo 3 — Assistant-First Workspace** já aprovado em uma especificação completa do Portfolio Copilot, sem reabrir a escolha da direção visual.

R1 deve definir como essa mesma linguagem se aplica a:

- auth/sign-in/sign-out;
- onboarding;
- dashboard;
- carteira;
- shell/navegação;
- sessão/conta;
- estados empty/loading/error/success;
- desktop/tablet/mobile;
- futura presença do Copiloto.

## Escopo

- arquitetura da informação e navigation model;
- mapa de tarefas por superfície;
- grid/container/density model;
- tipografia, cor, superfície e iconografia;
- conceitos derivados completos para auth, onboarding e carteira;
- refinamento do dashboard aprovado;
- comportamento responsive da sidebar e painel Copiloto;
- progressive disclosure para segurança, provenance e informação operacional;
- registro de desvios materiais do Protótipo 3 quando necessários.

## Regras

- Protótipo 3 é referência canônica, não inspiração opcional;
- não criar rotas vazias para imitar o mockup;
- não inventar métricas, market data, patrimônio, retorno ou capacidades;
- não alterar regras financeiras, auth, ownership ou persistência por motivo visual;
- conceitos precisam cobrir desktop e mobile antes da implementação ampla.

## Gate

R2 (#74) só começa quando arquitetura, superfícies principais e estados responsivos estiverem definidos suficientemente para evitar decisões visuais ad hoc durante coding.

## Sequência já decomposta

```text
#73 R1 direção/arquitetura
  -> #74 R2 tokens + primitives
  -> #75 R3 shell/sidebar
  -> #76 R4 auth
  -> #77 R5 onboarding
  -> #78 R6 dashboard
  -> #79 R7 carteira
  -> #80 R8 estados transversais
  -> #81 R9 accessibility/responsive/fidelity QA
  -> R10 fechamento da #69
```

## Referências canônicas

- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/FRONTEND-AUDIT.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 permanece a próxima iniciativa funcional de IA, mas sua superfície visual só nasce sobre a nova fundação.
