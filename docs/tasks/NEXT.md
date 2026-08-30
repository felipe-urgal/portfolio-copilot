# Próxima Atividade — UX/UI R2: design tokens e primitives canônicas

**Status:** READY

## Issue canônica

- #74 — `UX/UI R2: design tokens e primitives canônicas`
- iniciativa guarda-chuva: #69

## R0 e R1 concluídos

A fundação de decisão visual está registrada em:

- #72 — audit do frontend atual;
- #73 — arquitetura e expansão da direção aprovada;
- `docs/design/FRONTEND-AUDIT.md`;
- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`.

O R1 definiu:

- navigation model sem rotas futuras fictícias;
- AppShell com sidebar no desktop e drawer em tablet/mobile;
- context rail/Copiloto responsivo e opcional;
- focused auth sem sidebar;
- onboarding dentro do shell canônico;
- dashboard orientado a panorama e ação, sem métricas inventadas;
- carteira dividida progressivamente por tarefa;
- estados loading/empty/missing/stale/error/success/disabled;
- progressive disclosure de provenance, reason codes e detalhe técnico;
- accessibility como contrato desde a fundação.

## Objetivo do R2

Transformar a arquitetura aprovada em contratos reutilizáveis de interface antes de migrar qualquer tela grande.

R2 deve eliminar a autoridade visual local das features para os padrões fundamentais. Depois dele, R3–R8 não devem recriar botão, field, focus ring, container, status ou loading por módulo.

## Escopo

### Semantic tokens

- cores de superfície, texto, border, accent e feedback;
- tipografia e hierarchy financeira;
- spacing;
- radius;
- elevation;
- focus ring;
- motion e reduced motion;
- largura/container/grid/gutters;
- z-index somente onde houver necessidade real.

### Primitives mínimas

- `Container`;
- `Stack`;
- `Cluster`;
- `Grid`;
- `PageHeader`;
- `Button` e `LinkButton`;
- `Field`, `Label`, `HelpText`, `FieldError`;
- `TextInput` e `Select`;
- `ChoiceCard`/`SegmentedControl` apenas se necessários aos fluxos aprovados;
- `Surface`;
- `Status`/`Badge` com variantes restritas;
- `Alert`;
- `EmptyState`;
- loading/skeleton;
- apresentação canônica de valores/métricas financeiras;
- icon wrapper;
- helpers de composição responsiva suficientes para R3–R7.

### Estados

Quando aplicável:

- default;
- hover;
- focus-visible;
- active/pressed;
- selected;
- disabled;
- loading;
- error;
- success.

## Regras

- não criar framework genérico interno;
- não introduzir biblioteca visual por conveniência;
- promover apenas padrões comprovadamente necessários pelo R1 e pelo frontend existente;
- nenhuma primitive pode alterar regra de domínio;
- nenhuma primitive pode depender de dados fictícios do Protótipo 3;
- WCAG 2.2 AA e `prefers-reduced-motion` fazem parte da implementação, não são polish posterior;
- CSS local de uma feature não deve redefinir semantic token fundamental.

## Gate

R3 (#75) só começa quando o shell puder ser composto exclusivamente com a fundação canônica, sem inventar styling paralelo.

O R2 deve entregar:

- tokens documentados;
- primitives testadas;
- contratos de variantes/estados claros;
- exemplos suficientes para R3–R7;
- `pnpm check` verde;
- auto code review sem finding aberto.

## Sequência

```text
#74 R2 tokens + primitives
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
- `docs/design/FRONTEND-AUDIT.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua funcionalmente posterior à nova fundação visual: não criar uma UI temporária de Copiloto durante R2.
