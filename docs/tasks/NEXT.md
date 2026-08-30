# Próxima Atividade — UX/UI R5: redesenhar onboarding financeiro completo

**Status:** READY após merge da #76

## Issue canônica

- #77 — `UX/UI R5: redesenhar onboarding financeiro completo`
- iniciativa guarda-chuva: #69

## Fundação concluída

O R5 parte dos contratos visuais já implementados e não deve recriar uma arquitetura paralela:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + direção do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- #75 — R3 AppShell/sidebar/navegação responsiva;
- #76 — R4 focused auth e sessão;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`.

O R3 já colocou `/onboarding` dentro do `AppShell` e removeu o chrome global paralelo. O R5 deve redesenhar o **conteúdo guiado** do onboarding: progressão, hierarchy, campos, choices, goals, review e estados de validação, preservando a lógica de domínio existente.

## Objetivo do R5

Transformar o onboarding financeiro atual em um guided flow mais leve, consistente e responsivo, consumindo as primitives do R2 e o AppShell do R3 sem mudar o significado dos dados, validações ou snapshot financeiro.

## Escopo

### Progressão

- quatro etapas existentes: Perfil, Reserva, Objetivos e Revisão;
- progress/stepper visualmente subordinado ao AppShell;
- uma decisão principal por bloco;
- Back/Continue claros;
- re-entry/resume existente preservado.

### Form primitives

- migrar inputs/selects para `Field` e contratos canônicos quando compatíveis;
- choices de risco e horizonte sobre primitives R2;
- switch/reserva sem controle paralelo desnecessário;
- goals editáveis com hierarchy clara e sem cards dentro de cards;
- review final legível antes da confirmação;
- ações sobre `Button`/`LinkButton` canônicos.

### Validação e estado

- regras de domínio e reducer atuais preservados;
- erros próximos aos campos e summary somente quando necessário;
- foco no primeiro erro permanece previsível;
- estado salvo/persistido aparece em segunda ordem;
- nenhum erro parcial vira snapshot válido.

### Responsividade e acessibilidade

- desktop/tablet/mobile;
- stepper compacto em telas pequenas;
- choices/goals empilham sem reduzir legibilidade;
- touch targets canônicos;
- keyboard-only flow;
- labels, fieldsets, legends, `aria-describedby` e `aria-invalid` preservados ou melhorados;
- focus-visible herdado do R2.

## Regras

- não alterar regras de domínio, Money, goals ou snapshot por motivo visual;
- não recriar shell/header/navigation dentro da feature;
- não criar Button/Field/Choice/Alert/Loading paralelos se houver primitive canônica;
- não ampliar escopo para Dashboard (#78) ou Carteira (#79);
- preservar persistência local/conta e seus contratos atuais;
- nenhuma capability fictícia;
- progressive disclosure para detalhes de persistência e implementação.

## Gate

R6 (#78) só começa quando:

- onboarding não possuir primitive visual paralela evitável;
- progressão das quatro etapas estiver clara e mais leve;
- validações e focus order continuarem acessíveis;
- lógica funcional/testes atuais estiverem preservados;
- desktop/mobile estiverem definidos no código;
- `pnpm check` estiver verde;
- auto code review estiver sem finding aberto.

## Sequência

```text
#72 R0 audit ✓
  -> #73 R1 app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 AppShell/sidebar ✓
  -> #76 R4 auth ✓
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
- `docs/design/AUTH-SESSION.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI temporária durante o redesign. Qualquer superfície futura deve nascer sobre os contratos visuais já fechados.
