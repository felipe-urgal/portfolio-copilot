# Próxima Atividade — UX/UI R0: audit completo do app

**Status:** READY

## Issue canônica

- #69 — `UX/UI: redesign completo do app e novo design system`

## Objetivo

Executar o R0 da iniciativa de redesign completo do Portfolio Copilot: auditar todas as telas, fluxos, componentes, estilos e estados atuais antes de definir a nova arquitetura da informação e direção visual.

Esta atividade substitui temporariamente a #45 como próxima atividade visual. A UI do copiloto de IA deve nascer sobre o novo design system/shell, não criar uma terceira linguagem visual paralela.

## Escopo

### Rotas e superfícies

Inventariar e revisar pelo menos:

- `/`;
- `/sign-in`;
- `/sign-out`;
- `/onboarding`;
- `/dashboard`;
- `/portfolio`;
- `/health` quando houver apresentação para usuário;
- shell/navegação/sessão;
- componentes financeiros compartilhados.

### Estados

Mapear quando aplicável:

- default;
- empty;
- loading;
- error;
- success;
- hover;
- focus;
- active/selected;
- disabled;
- sessão expirada/reentrada;
- mobile/tablet/desktop.

### Front-end inventory

- CSS global;
- CSS Modules;
- cores/spacing/radius/shadow hardcoded;
- padrões tipográficos;
- componentes duplicados ou visualmente divergentes;
- layout primitives implícitas;
- breakpoints/responsividade;
- iconografia;
- padrões de formulários e feedback.

### UX audit

Para cada fluxo relevante, registrar:

- tarefa principal do usuário;
- hierarquia atual;
- informação secundária competindo com a ação principal;
- carga cognitiva;
- inconsistências de navegação;
- fricções;
- conteúdo técnico desnecessário na primeira ordem visual;
- oportunidades de progressive disclosure.

### Accessibility audit

- landmarks/semantics;
- keyboard navigation;
- focus visibility/order;
- contraste;
- accessible names;
- touch targets;
- reduced motion quando houver motion.

## Entregáveis

- documento de audit;
- inventário de páginas/estados/componentes;
- screenshots de referência desktop + mobile;
- findings classificados em `UX`, `VISUAL`, `A11Y` e `FRONTEND_DEBT`;
- severidade/prioridade dos findings;
- lista de padrões a preservar, remover ou consolidar;
- critérios mensuráveis para a nova direção;
- recomendação de decomposição da #69 em child issues/PRs após o R0.

## Fora de escopo deste R0

- implementar o redesign;
- escolher biblioteca UI antes do audit;
- trocar auth/persistência;
- alterar regras financeiras;
- iniciar a UI da #45;
- tentar preservar o visual atual por compatibilidade.

## Gate

O R1 só começa quando o audit estiver completo e houver entendimento claro de todas as superfícies relevantes.

Depois do R0:

```text
R1 arquitetura da informação + direção visual
  -> conceitos desktop/mobile
  -> aprovação explícita
  -> R2 design system
  -> migração completa do app
```

## Referências canônicas

- issue #69;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`;
- #45 permanece próxima iniciativa funcional de IA, mas sua superfície visual depende da nova fundação.
