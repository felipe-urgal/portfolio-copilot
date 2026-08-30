# Próxima Atividade — UX/UI R4: redesenhar autenticação e sessão

**Status:** READY após merge da #75

## Issue canônica

- #76 — `UX/UI R4: redesenhar autenticação e sessão`
- iniciativa guarda-chuva: #69

## Fundação concluída

O R4 parte de uma arquitetura visual já fechada e não deve reabrir decisões fundamentais:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + direção do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- #75 — R3 AppShell/sidebar/navegação responsiva;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`.

O R3 deixa Dashboard, Carteira e Onboarding consumindo o mesmo shell protegido. Auth continua deliberadamente fora desse shell: a arquitetura do R1 define `/sign-in` e estados de reentrada como uma superfície focada, sem sidebar concorrendo com a ação de autenticação.

## Objetivo do R4

Redesenhar autenticação e sessão para que a jornada tenha **uma ação principal clara**, preserve as garantias atuais de GitHub OAuth/ownership e mantenha privacidade, segurança e diagnóstico acessíveis por progressive disclosure em vez de colocá-los na primeira hierarquia visual.

## Escopo

### Sign-in

- `/sign-in` com composição focused-auth canônica;
- brand e contexto mínimo do produto;
- uma CTA principal para GitHub OAuth;
- loading/disabled/error/re-entry usando primitives do R2;
- remover `/health` como CTA concorrente do login;
- informação de privacidade/segurança disponível sem dominar a tarefa;
- desktop/tablet/mobile.

### Sessão e saída

- `/sign-out`;
- affordance de conta/sessão já exposta pelo AppShell;
- expired/re-entry quando aplicável;
- estados de erro/recovery existentes;
- copy clara sobre sessão sem expor subject interno ou detalhes técnicos desnecessários.

### Segurança e compatibilidade

- preservar provider GitHub atual;
- preservar callback/redirect validation existente;
- preservar ownership e canonical identity;
- não alterar contratos de persistência financeira;
- não transformar health ou diagnóstico em sinal visual de confiança artificial;
- nenhuma mudança de regra financeira.

### Accessibility

- keyboard-only flow;
- focus order e focus-visible canônicos;
- accessible names e status de loading/error;
- sem ação concorrente ambígua;
- touch targets adequados;
- reduced motion herdado do R2.

## Regras

- usar tokens/primitives R2;
- respeitar o AppShell R3, mas **não** inserir sidebar no focused auth;
- não criar Button/Field/Alert/Loading paralelos;
- não trocar provider ou fluxo OAuth por motivo visual;
- não ampliar o escopo para redesign completo do onboarding/dashboard/carteira;
- nenhuma rota ou capability fictícia;
- informação técnica permanece auditável em segunda ordem.

## Gate

R5 (#77) só começa quando:

- sign-in possuir uma CTA primária inequívoca;
- auth errors/re-entry estiverem claros;
- `/health` não competir com login;
- account/session affordance estiver coerente com o AppShell;
- provider, redirect safety e ownership permanecerem inalterados;
- desktop/mobile estiverem definidos no código;
- `pnpm check` estiver verde;
- auto code review estiver sem finding aberto.

## Sequência

```text
#72 R0 audit ✓
  -> #73 R1 app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 AppShell/sidebar ✓
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
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI temporária durante o redesign. Qualquer superfície futura deve nascer sobre os contratos visuais fechados pelos R2/R3.
