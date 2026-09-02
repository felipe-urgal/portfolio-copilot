# Próxima Atividade — UX/UI R8: estados e componentes transversais do produto

**Status:** IN PROGRESS — prioridade canônica atual em 2026-09-02

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

## Reconciliação operacional

Em 31/08/2026, #97 / PR #98 preparou a foundation de produção pessoal/privada em Vercel + Neon e #99 / PR #100 ativou o Production Contract após validação real do ambiente.

Esse trabalho operacional está concluído e **não altera a sequência UX/UI**: #80 continua sendo a única atividade canônica. A produção ativa é single-user/controlada e não satisfaz o Regulatory Gate público da #50.

## Progresso do R8

Entregas concluídas em 02/09/2026:

- PR #95 — primeira vertical transversal, incluindo a primitive canônica `Disclosure` e início da consolidação de progressive disclosure;
- PR #105 — `FinancialProfileAccountMigration` normalizada com `Alert`/`Disclosure`, feedback semântico tipado e regressões de markup; merge `329282739284effaf179913fbe4316e8bc466fe2`;
- PR #106 — `/health` migrada para primitives/tokens R2, styling global legado correspondente removido e regressões adicionadas; merge `2a3af838d5b61d6891c1da9ffdf736745066b8d1`;
- CI pós-merge #554 — verde no `main` após o PR #106.

Vertical atual:

- PR #107 — `feat: consolidar reason codes no R8`;
- branch `feat/r8-recommendation-reason-codes`;
- consolidar presentation reutilizável de reason codes sem mover mapping/copy financeira para `components/ui`;
- substituir disclosures locais da recomendação pelo `Disclosure` canônico;
- manter explicação humana antes do código auditável, preservando a ordem e as causas fornecidas pelo domínio;
- não alterar `ContributionRecommendationSnapshot`, fórmulas, status, reason codes ou reconciliação financeira;
- `docs/UX-UI-REDESIGN-ROADMAP.md` reconciliado para R8 `EM ANDAMENTO`.

Depois dessa vertical, o R8 ainda precisa auditar/consolidar principalmente provenance/stale/missing/conflict e quaisquer estados transversais equivalentes que continuem como ilha visual.

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
  -> #80 R8 estados/componentes (em andamento)
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
- `docs/ROADMAP.md`;
- `docs/PRODUCTION.md`.

A #45 continua sem UI funcional temporária durante a #69. A futura superfície do Copiloto deve nascer sobre os contratos finais e consumir dados estruturados reais.
