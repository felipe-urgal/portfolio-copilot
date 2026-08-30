# UX/UI Redesign — Roadmap do app completo

## Status

**INICIATIVA ATIVA — #69**

Estado após o PR #92:

- R0 #72 — concluído;
- R1 #73 — concluído;
- R2 #74 — concluído;
- R3 #75 — concluído;
- R4 #76 — concluído;
- R5 #77 — concluído;
- R6 #78 — concluído;
- R7 #79 — concluído neste PR;
- **próxima fase: R8 #80 — estados/componentes transversais**;
- R9 #81 — accessibility/responsive/fidelity QA;
- R10 — gate final e fechamento da #69.

O objetivo não é aplicar um tema sobre o frontend antigo. É migrar o produto para uma arquitetura visual única, preservando domínio, autenticação, segurança, persistência e honestidade dos dados.

## Referências canônicas

1. `docs/design/PROTOTYPE-3-DIRECTION.md` — direção visual aprovada;
2. `docs/design/FRONTEND-AUDIT.md` — baseline histórico R0;
3. `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md` — arquitetura de informação/composição;
4. `docs/design/DESIGN-SYSTEM.md` — tokens/primitives R2;
5. `docs/design/APP-SHELL.md` — shell/navegação R3;
6. `docs/design/AUTH-SESSION.md` — focused auth R4;
7. `docs/design/ONBOARDING.md` — guided onboarding R5;
8. `docs/design/DASHBOARD.md` — Dashboard R6;
9. `docs/design/PORTFOLIO.md` — Carteira R7;
10. este documento — sequência/gates R0–R10;
11. `docs/DOCUMENTATION-MAP.md` — ownership e precedência documental.

## Direção visual canônica

O **Protótipo 3 — Assistant-First Workspace** é a referência oficial.

![Protótipo 3 — Assistant-First Workspace](./design/prototypes/prototype-3-assistant-first-dashboard.jpg)

A referência não autoriza copiar literalmente dados, métricas, rotas ou capabilities inexistentes. Fidelidade significa preservar arquitetura, hierarquia, densidade, linguagem visual e modelo de interação dentro das capabilities reais.

## Princípios fechados

1. **Um app, um sistema:** tokens/primitives/shell compartilhados.
2. **Uma prioridade visual por contexto:** CTA principal não compete com detalhe operacional.
3. **Menos chrome, mais estrutura:** whitespace, grid e tipografia antes de cards/badges.
4. **Dados honestos:** missing/stale/unsupported não viram zero, KPI ou conteúdo fictício.
5. **Copiloto contextual:** não substitui a UI financeira e não aparece como IA funcional antes da #45.
6. **Responsive desde a concepção:** desktop/tablet/mobile são estados da mesma solução.
7. **WCAG 2.2 AA como gate:** foco, teclado, contraste, touch target, semantics e reduced motion.
8. **Sem regressão de domínio:** visual não muda fórmula, ownership, auth, persistência ou metodologia.
9. **Progressive disclosure:** provenance, reason codes e detalhes técnicos permanecem acessíveis sem dominar a primeira hierarquia.
10. **Sem sistema paralelo:** feature CSS cuida de anatomy/composição, não recria primitives fundamentais.

## R0 — Audit completo — CONCLUÍDO — #72

Entrega: `docs/design/FRONTEND-AUDIT.md`.

Confirmou design system implícito/duplicado, onboarding com shell próprio, Carteira excessivamente densa e informação operacional ocupando hierarquia demais. O frontend antigo não recebeu browser QA mobile real; isso permanece como justificativa para o gate final do R9, não como requisito de preservar o layout antigo.

## R1 — Arquitetura Assistant-First — CONCLUÍDO — #73

Entrega: `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`.

Fechou:

- navigation model baseado apenas em capabilities reais;
- shell desktop/tablet/mobile;
- densidades de conteúdo;
- focused auth;
- onboarding no shell;
- dashboard orientado a panorama/ação;
- carteira por tarefas/progressive disclosure;
- papel/limites do Copiloto;
- estados missing/stale/empty/error/success/disabled;
- accessibility/responsividade/fidelity gates.

## R2 — Design system — CONCLUÍDO — #74

Entregas:

- `apps/web/src/styles/tokens.css`;
- `apps/web/src/components/ui/`;
- `docs/design/DESIGN-SYSTEM.md`;
- D-038.

Inclui layout primitives, PageHeader, Button/LinkButton, form controls, ChoiceCard/SegmentedControl, feedback, Surface, loading/skeleton, valores financeiros e icon wrapper, todos sobre semantic tokens.

## R3 — AppShell e navegação — CONCLUÍDO — #75

Entrega: `docs/design/APP-SHELL.md`.

Implementado:

- sidebar desktop;
- drawer tablet/mobile;
- rotas somente reais;
- account/session utility;
- skip link e landmarks;
- active/focus states;
- focus trap/escape/return focus;
- reduced motion;
- apenas `displayName` atravessa a ilha client da navegação;
- `ProductShell` legado removido.

## R4 — Auth e sessão — CONCLUÍDO — #76

Entrega: `docs/design/AUTH-SESSION.md`.

Implementado:

- `/sign-in` com uma CTA primária GitHub;
- `/sign-out` focado;
- errors/re-entry claros;
- loading real via primitive;
- privacidade/segurança em disclosure secundário;
- nenhum `/health` concorrendo com login;
- OAuth, callback safety, identity e ownership preservados.

## R5 — Onboarding completo — CONCLUÍDO — #77 / PR #88

Entrega: `docs/design/ONBOARDING.md`.

Implementado:

- quatro etapas preservadas: Perfil, Reserva, Objetivos, Revisão;
- progressão aberta/compacta subordinada ao AppShell;
- fields, choices, segmented control, feedback e actions sobre R2;
- validações/reducer/snapshot do domínio preservados;
- foco no primeiro erro mantido;
- persistência continua opt-in e em segunda ordem;
- objetivos como seções abertas, evitando card dentro de card;
- CSS local limitado a anatomy/ritmo/responsividade.

## R6 — Dashboard completo — CONCLUÍDO — #78 / PR #91

Entrega: `docs/design/DASHBOARD.md`.

Implementado:

- greeting derivado somente de identidade autenticada real;
- primeira hierarquia orientada a contexto, panorama e próxima ação;
- métricas compactas somente a partir do perfil financeiro validado;
- meta de reserva explicitamente tratada como target declarado, nunca saldo atual;
- panorama de Carteira como bloco dominante;
- empty state de Carteira enquanto Portfolio/Assets/Ledger permanecerem locais à própria tela;
- nenhuma inferência de patrimônio, composição, retorno, Market Data, score ou recomendação;
- context rail neutro com fatos do perfil, sem simular a capability da #45;
- indisponibilidades técnicas em progressive disclosure;
- account migration opt-in migrada para primitives/tokens canônicos sem alterar seu fluxo de segurança;
- desktop/tablet/mobile definidos por composição responsiva.

Gate: todo número visível possui fonte real, ausências permanecem honestas e o Dashboard usa AppShell/R2 sem sistema visual paralelo.

## R7 — Carteira completa — CONCLUÍDO — #79 / PR #92

Entrega: `docs/design/PORTFOLIO.md`.

Implementado:

- estado inicial focado em criar/configurar o Portfolio;
- navegação local por Visão geral, Ativos e posições, Transações, Aporte e Configuração;
- overview com fatos reais, posições projetadas e próxima ação contextual;
- catálogo de Assets separado conceitualmente de posições;
- Transaction Ledger separado dos formulários de criação;
- `CASH_IN`/`CASH_OUT` preservados sem alterar posições;
- `BUY`/`SELL` preservados como única fonte da projection de posição;
- UUIDs, reason codes, reconciliação e explicação detalhada em progressive disclosure;
- pipeline completo de aporte preservado sem reimplementar regra financeira em React;
- forms/actions/status/feedback migrados para primitives R2;
- perfil financeiro da sessão reduzido a contexto secundário canônico;
- nenhuma métrica de preço, patrimônio, market value ou P&L inventada;
- nenhuma etapa de aporte representa execução de ordem;
- persistência/ownership permanecem inalterados;
- desktop/tablet/mobile definidos por composição responsiva.

Gate: tarefas financeiras estão separadas e escaneáveis, fontes de verdade permanecem determinísticas e detalhes técnicos não dominam a primeira hierarquia.

## R8 — Componentes e estados transversais — PRÓXIMO — #80

Consolidar o que ainda restar fora das surfaces principais:

- recommendation/reason codes reutilizáveis;
- financial profile/session summary remanescente em outras surfaces;
- account migration remanescente;
- provenance/stale/missing/conflict;
- forms remanescentes;
- transaction patterns reutilizáveis;
- alerts/feedback;
- empty/error/recovery/loading/skeleton;
- confirmations e permission/auth transitions;
- health operacional quando exposto a humano.

Nenhuma ilha visual relevante do sistema anterior deve permanecer. Dashboard/Carteira só devem ser reabertos por finding transversal concreto.

## R9 — Accessibility, responsive e visual fidelity QA — #81

Validar por browser e teclado:

- WCAG 2.2 AA;
- landmarks/semantics/accessible names;
- focus order/visibility;
- contraste;
- estados que não dependem só de cor;
- touch targets;
- reduced motion;
- screen-reader smoke test;
- 320px, mobile largo, tablet, laptop e desktop largo;
- screenshots dos fluxos críticos;
- comparação com Protótipo 3 + R1;
- fidelity ledger para desvios materiais.

Gate: nenhum blocker P0/P1 conhecido de accessibility, responsive ou fidelity.

## R10 — Gate final

Após R9:

- todas as superfícies atuais usam shell/tokens/primitives canônicos;
- nenhuma implementação visual paralela relevante permanece;
- documentação e ownership estão atualizados;
- novas PRs visuais seguem desktop/mobile/a11y/fidelity;
- #45 pode construir sua UI sobre a fundação final;
- #69 fecha somente depois do gate final.

## Critérios de conclusão da #69

- auth, onboarding, dashboard e carteira parecem partes do mesmo produto;
- shell/navegação são únicos;
- estados comuns são canônicos;
- desktop/mobile têm qualidade equivalente;
- WCAG 2.2 AA foi auditado;
- fluxos críticos tiveram browser QA;
- fidelidade ao Protótipo 3/R1 foi verificada;
- domínio/auth/segurança/persistência seguem corretos;
- quality gate final verde;
- nenhum sistema visual antigo relevante permanece.

## Fora de escopo da iniciativa

- mudar metodologia financeira por motivo visual;
- modificar Portfolio/Investment Engine para “bater” com mockup;
- trocar provider de auth;
- alterar ownership/persistência sem vertical próprio;
- execução financeira;
- adicionar biblioteca visual sem necessidade concreta;
- preservar compatibilidade visual com o frontend antigo;
- inventar dados, rotas ou capacidades.

## Sequência canônica

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
  -> UI da #45 sobre a fundação final
```
