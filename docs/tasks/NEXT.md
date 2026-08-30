# Próxima Atividade — UX/UI R3: novo AppShell, sidebar e navegação responsiva

**Status:** READY após merge da #74

## Issue canônica

- #75 — `UX/UI R3: novo app shell, sidebar e navegação responsiva`
- iniciativa guarda-chuva: #69

## Fundação concluída

As fases anteriores deixam o R3 sem necessidade de reabrir direção visual ou criar styling fundamental paralelo:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + expansão do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- `docs/design/FRONTEND-AUDIT.md`;
- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`.

O R2 centraliza semantic tokens, layout primitives, actions, fields, choice patterns, surfaces, feedback, loading, apresentação financeira e iconografia. O R3 deve consumir essa fundação; não deve recriar botão, field, focus ring, container, status, loading ou outras primitives equivalentes dentro do shell.

## Objetivo do R3

Construir o **AppShell canônico** reconhecível como derivação do Protótipo 3 e torná-lo a composição compartilhada das superfícies protegidas.

O shell deve resolver navegação, landmarks, brand, conta/sessão e comportamento responsive sem inventar rotas ou capacidades ainda inexistentes.

## Escopo

### Desktop

- sidebar persistente quando houver espaço funcional;
- brand do Portfolio Copilot;
- primary navigation baseada somente em rotas/capacidades reais;
- secondary/utilities navigation quando necessária;
- active, hover, focus-visible e disabled states;
- account/session affordance no rodapé;
- page content/container model;
- suporte ao futuro context rail sem renderizar uma UI fictícia de Copiloto.

### Tablet e mobile

- sidebar não deve ser comprimida;
- navegação passa para drawer quando necessário;
- trigger com accessible name;
- fechamento por ação explícita e Escape;
- focus management e retorno ao trigger;
- backdrop e layering derivados dos tokens canônicos;
- conteúdo principal mantém leitura e touch targets adequados.

### Accessibility

- skip link;
- `header`/`nav`/`main`/landmarks coerentes;
- foco visível;
- navegação por teclado;
- active state não depende apenas de cor;
- drawer com semântica e focus lifecycle corretos;
- `prefers-reduced-motion` respeitado pela fundação R2.

### Integração

- superfícies protegidas devem poder usar o mesmo shell;
- onboarding deixa de depender arquiteturalmente de um shell paralelo, sem executar ainda o redesign completo da #77;
- auth focused (`/sign-in`) permanece fora da sidebar conforme R1;
- não alterar domínio, OAuth, ownership ou persistência.

## Regras

- usar tokens/primitives do R2;
- nenhuma rota futura vazia para reproduzir o mockup;
- nenhuma métrica fictícia;
- nenhuma UI funcional de Copiloto antes da capacidade correspondente;
- não reescrever dashboard, carteira ou onboarding neste PR além do necessário para adoção estrutural do shell;
- comportamento responsive faz parte da implementação, não é polish posterior;
- manter progressive disclosure para informação operacional/técnica.

## Gate

R4 (#76) só começa quando:

- AppShell estiver compartilhado e consumível pelas superfícies protegidas;
- desktop/tablet/mobile estiverem definidos no código;
- sidebar/drawer tiverem keyboard/focus behavior correto;
- landmarks e skip link estiverem presentes;
- não houver shell visual fundamental paralelo necessário para as próximas migrações;
- `pnpm check` estiver verde;
- auto code review estiver sem finding aberto.

## Sequência

```text
#72 R0 audit ✓
  -> #73 R1 app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 AppShell/sidebar
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
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI temporária durante o redesign. Superfícies futuras devem nascer sobre AppShell + design system canônicos.
