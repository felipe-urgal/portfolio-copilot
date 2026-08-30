# Próxima Atividade — UX/UI R8: estados e componentes transversais do produto

**Status:** READY após merge da #79 / PR #92

## Issue canônica

- #80 — `UX/UI R8: estados e componentes transversais do produto`
- iniciativa guarda-chuva: #69

## Fundação concluída

O R8 parte das superfícies principais já migradas:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + direção do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- #75 — R3 AppShell/sidebar/navegação responsiva;
- #76 — R4 focused auth/session;
- #77 / PR #88 — R5 onboarding guiado;
- #78 / PR #91 — R6 Dashboard orientado a contexto, panorama e próxima ação;
- #79 / PR #92 — R7 Carteira organizada por tarefas;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/design/DASHBOARD.md`;
- `docs/design/PORTFOLIO.md`.

## Objetivo do R8

Eliminar as últimas ilhas visuais antigas e consolidar estados equivalentes em contratos reutilizáveis, sem reabrir a arquitetura das superfícies já concluídas.

## Escopo

- profile/session summary remanescente fora da Carteira;
- account migration surfaces remanescentes;
- recommendation/reason-code presentation reutilizável;
- provenance, stale, missing-data e conflict;
- alerts/feedback;
- empty states;
- loading/skeleton;
- error/recovery;
- success/confirmation;
- permission/auth transitions;
- health/operational UI quando exposta ao usuário;
- apresentação semântica de variações financeiras sem depender somente de cor;
- progressive disclosure para detalhe técnico/auditável.

## Regras

- não criar nova família visual quando uma primitive canônica puder ser evoluída;
- reason codes/provenance continuam auditáveis, mas não dominam a primeira hierarquia;
- estados financeiros não podem ser inferidos por copy/cores fora dos contratos de domínio;
- loading não pode parecer dado real;
- não reabrir Dashboard/Carteira sem finding transversal concreto;
- cumprir integralmente `AGENTS.md`, inclusive auto code review fullstack sênior.

## Gate

R9 (#81) só começa quando:

- nenhuma família transversal relevante permanecer como ilha visual antiga;
- loading/empty/error/success tiverem contratos consistentes;
- stale/missing/conflict permanecerem distinguíveis e acessíveis;
- desktop/mobile e teclado estiverem preservados;
- CI do head final estiver integralmente verde;
- auto code review fullstack sênior estiver concluído sem finding aberto;
- docs/issues estiverem reconciliados.

## Sequência

```text
#72 R0 audit ✓
  -> #73 R1 app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 AppShell ✓
  -> #76 R4 auth ✓
  -> #77 R5 onboarding ✓
  -> #78 R6 dashboard ✓
  -> #79 R7 portfolio ✓
  -> #80 R8 estados/componentes
  -> #81 R9 a11y/responsive/fidelity
  -> R10 / fechamento #69
```

## Referências canônicas

- `AGENTS.md`;
- `docs/DOCUMENTATION-MAP.md`;
- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/design/DASHBOARD.md`;
- `docs/design/PORTFOLIO.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI funcional temporária durante a #69. A futura superfície do Copiloto deve nascer sobre os contratos finais e consumir dados estruturados reais.
