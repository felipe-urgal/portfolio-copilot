# UX/UI Redesign — Roadmap do app completo

## Status

**INICIATIVA ATIVA — issue #69**

- R0 concluído — #72;
- R1 concluído — #73;
- R2 concluído — #74;
- próxima fase: **R3 — #75 AppShell, sidebar e navegação**.

O Portfolio Copilot está refazendo a experiência completa do app antes de adicionar novas superfícies visuais relevantes. O objetivo não é aplicar um tema novo sobre o frontend existente: é migrar o produto inteiro para uma arquitetura visual única, preservando domínio, autenticação, segurança, persistência e honestidade dos dados.

## Referências canônicas

1. `docs/design/PROTOTYPE-3-DIRECTION.md` — direção visual aprovada;
2. `docs/design/FRONTEND-AUDIT.md` — audit R0 do frontend anterior;
3. `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md` — arquitetura da informação e comportamento canônico do app;
4. `docs/design/DESIGN-SYSTEM.md` — semantic tokens, primitives, estados e regras de uso do R2;
5. esta página — sequência de execução e gates.

## Direção visual canônica — APROVADA

O **Protótipo 3 — Assistant-First Workspace** é a referência visual oficial da iniciativa.

![Protótipo 3 — Assistant-First Workspace](./design/prototypes/prototype-3-assistant-first-dashboard.jpg)

A referência não é apenas inspiração. O redesign deve preservar claramente sua arquitetura, hierarquia, densidade e linguagem visual. O R1 definiu como essa direção se adapta a dados reais, auth, onboarding, carteira, estados e viewports menores sem copiar literalmente elementos fictícios do conceito. O R2 converteu essa decisão em contratos reutilizáveis de UI.

### Decisões fechadas no R1

- sidebar persistente no desktop quando houver espaço funcional;
- drawer em tablet/mobile em vez de sidebar comprimida;
- Copiloto como context rail opcional, drawer ou bottom sheet — nunca como chat que substitui o produto;
- auth usa uma superfície focada sem sidebar;
- onboarding entra no AppShell canônico;
- dashboard prioriza panorama e ação, com KPI apenas quando calculável;
- carteira usa progressive disclosure por tarefa;
- informação técnica/provenance/reason codes permanece auditável em segunda ordem;
- nenhuma rota futura vazia é criada para completar a sidebar;
- nenhuma métrica ilustrativa vira dado real;
- nenhuma UI de Copiloto fictícia aparece antes da capacidade funcional correspondente.

### Fundação fechada no R2

- semantic tokens de cor, tipografia, spacing, layout, geometry, focus, elevation, motion e layering;
- `Container`, `Stack`, `Cluster` e `Grid`;
- `PageHeader`;
- `Button` e `LinkButton`;
- fields, inputs, select e feedback de validação;
- `ChoiceCard` e `SegmentedControl` sobre inputs nativos;
- `Surface`, `Status`, `Badge`, `Alert` e `EmptyState`;
- loading/skeleton;
- apresentação canônica de valor/métrica financeira sem cálculo em UI;
- icon wrapper com accessibility explícita;
- reduced motion e touch target base;
- CSS específico de feature continua permitido somente para anatomy/composição que não replique primitive fundamental.

## Escopo da iniciativa

O redesign cobre todas as superfícies atuais e futuras de `apps/web`:

- `/` e entry points;
- `/sign-in`;
- `/sign-out`;
- `/onboarding`;
- `/dashboard`;
- `/portfolio`;
- `/health` quando houver apresentação para usuário;
- shell e navegação;
- conta/sessão;
- componentes financeiros compartilhados;
- formulários e ações;
- empty/loading/missing/stale/error/success states;
- hover/focus/active/selected/disabled;
- desktop/tablet/mobile;
- novas superfícies, incluindo a futura UI da #45.

Compatibilidade funcional é obrigatória. Compatibilidade visual com o layout antigo não é objetivo.

## Princípios

1. **Design antes de código.** R1 fecha a arquitetura; implementação não reabre decisões por feature.
2. **Um app, um sistema.** Toda tela usa os mesmos tokens, primitives e regras de composição.
3. **Protótipo 3 + R1 são canônicos.** Novas superfícies derivam da direção aprovada.
4. **Uma prioridade visual por contexto.** A ação principal não compete com mensagens operacionais secundárias.
5. **Menos chrome, mais estrutura.** Tipografia, grid, whitespace e alinhamento vêm antes de card/border/badge.
6. **Produto financeiro, não dashboard genérico.** Valores precisam ser legíveis, comparáveis, explicáveis e confiáveis.
7. **Segurança por comportamento e clareza.** Informação técnica aparece quando ajuda, não como decoração de confiança.
8. **Responsive desde a concepção.** Mobile e desktop são estados da mesma solução.
9. **WCAG 2.2 AA.** Foco, teclado, contraste, semantics, touch targets e reduced motion são critérios de produto.
10. **Sem regressão de domínio.** Visual nunca altera cálculo, ownership, auth ou fronteira de segurança.
11. **Fidelidade verificável.** Browser QA e comparação visual entram antes de concluir superfícies.
12. **Sem ficção visual.** Mockup não autoriza dado, rota ou capacidade inexistente.

## Estratégia de execução

A iniciativa é dividida em PRs pequenos e revisáveis. Cada fase possui issue e gate próprios:

- #72 — R0 audit;
- #73 — R1 arquitetura e expansão da direção;
- #74 — R2 design tokens e primitives;
- #75 — R3 AppShell/sidebar/navegação;
- #76 — R4 auth e sessão;
- #77 — R5 onboarding;
- #78 — R6 dashboard;
- #79 — R7 carteira;
- #80 — R8 estados/componentes transversais;
- #81 — R9 accessibility/responsive/visual fidelity QA;
- R10 — fechamento da #69 e gate para novas superfícies.

---

## R0 — Audit completo e inventário — CONCLUÍDO

### Entrega

`docs/design/FRONTEND-AUDIT.md`

O audit inventariou rotas, estados, CSS, componentes, responsividade, UX, visual e a11y do frontend anterior. Ele confirmou, entre outros pontos:

- design system implícito distribuído em CSS Modules;
- form primitives duplicadas;
- onboarding com shell próprio;
- portfolio excessivamente concentrado;
- informação operacional ocupando hierarquia excessiva;
- boas bases de accessibility que precisam ser preservadas.

O frontend antigo não recebeu visual QA mobile em viewport real; breakpoints foram auditados por código. Isso não bloqueou R1 porque o layout antigo não será preservado, mas validação visual mobile real é obrigatória no produto redesenhado.

---

## R1 — Arquitetura da informação + expansão do Protótipo 3 — CONCLUÍDO

### Entrega

`docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`

### Contratos fechados

- navigation model baseado em capacidades reais;
- AppShell desktop/laptop/tablet/mobile;
- modelos de densidade `calm`, `guided`, `analytical` e `operational`;
- focused auth;
- onboarding no shell canônico;
- dashboard orientado a panorama/ação;
- carteira organizada em `Overview / Ativos e posições / Transações / Aporte / Configuração`;
- papel e limites do Copiloto;
- loading/empty/missing/stale/error/success/disabled;
- progressive disclosure de auditoria;
- accessibility como contrato desde a fundação;
- matriz responsive;
- desvios permitidos do protótipo e gate de fidelidade.

### Gate atendido

R2 pode começar sem reabrir arquitetura da informação ou direção visual.

---

## R2 — Design system foundation — CONCLUÍDO — #74

### Entrega

- `apps/web/src/styles/tokens.css`;
- `apps/web/src/components/ui/`;
- `docs/design/DESIGN-SYSTEM.md`;
- D-038 em `docs/DECISIONS.md`.

### Contratos fechados

- cores semânticas de canvas/surface/text/border/accent/feedback;
- typography e hierarchy financeira;
- spacing e content widths;
- radius, elevation, focus e motion;
- reduced motion no boundary dos tokens e animations;
- z-index base para shell/overlay futuros;
- layout primitives;
- controles e fields compartilhados;
- choice/segmented com semantics nativas;
- feedback, empty, loading e skeleton;
- apresentação tipográfica de valores financeiros sem cálculo de domínio;
- wrapper de ícones e família Lucide outline como referência para glyphs reais;
- documentação de ownership, anti-patterns e migração progressiva.

### Gate atendido

R3 pode construir o shell sobre semantic tokens + `@/components/ui` sem recriar styling fundamental em CSS específico de feature.

---

## R3 — App shell e navegação — #75

### Entregas

- AppShell canônico;
- sidebar desktop;
- drawer tablet/mobile;
- brand;
- primary/secondary navigation baseada em capacidades reais;
- account/session affordance;
- skip link e landmarks;
- page container model;
- context rail/drawer contract;
- active/hover/focus states;
- keyboard navigation e focus management.

O shell passa a ser obrigatório para superfícies protegidas, respeitando a exceção de focused auth definida no R1.

---

## R4 — Auth e sessão — #76

### Cobertura

- `/sign-in`;
- `/sign-out`;
- auth errors;
- expired/re-entry;
- callback/recovery;
- account/session affordances.

### Objetivos

- uma ação primária clara;
- sem CTA de health concorrendo com login;
- privacidade e segurança em segunda ordem sem perder transparência;
- preservação integral do GitHub OAuth, callback seguro e ownership existente.

---

## R5 — Onboarding completo — #77

### Objetivos

- migrar para o AppShell/primitives canônicos;
- preservar regras de domínio e snapshot;
- reduzir carga cognitiva;
- progressão consistente;
- validation acessível;
- save/resume/re-entry claros;
- desktop/tablet/mobile;
- nenhuma primitive local equivalente à canônica.

---

## R6 — Dashboard completo — #78

### Objetivos

- aplicar a superfície mais diretamente representada pelo Protótipo 3;
- mostrar situação, decisão e contexto antes de detalhe secundário;
- usar KPIs somente quando calculáveis;
- consolidar panorama da carteira como bloco central dominante;
- reservar arquitetura do context rail sem inventar a #45;
- integrar teses, eventos e próximos passos somente quando houver capacidades/dados reais;
- estados missing/stale/empty claros.

---

## R7 — Carteira completa — #79

### Objetivos

- implementar a arquitetura progressiva definida no R1;
- melhorar leitura de posições e alocação;
- separar manutenção de ativos de posição;
- tornar ledger escaneável;
- organizar o pipeline de aporte por etapas reais;
- reduzir UUIDs/detalhes técnicos da primeira ordem;
- preservar Transaction Ledger e demais contratos como fontes de verdade;
- garantir leitura financeira em desktop e mobile.

---

## R8 — Componentes de domínio e estados transversais — #80

Migrar/consolidar:

- recommendation/reason-code surfaces;
- financial profile/session summary;
- account migration;
- provenance/stale/missing-data;
- formulários restantes;
- transaction patterns;
- alerts/feedback;
- empty states;
- errors/recovery;
- loading/skeleton;
- confirmations;
- permission/auth transitions;
- health/operational UI quando exposta a humano.

Nenhuma ilha visual relevante do sistema antigo deve permanecer.

---

## R9 — Acessibilidade, responsividade e visual QA — #81

### Accessibility

- WCAG 2.2 AA;
- keyboard-only flows;
- focus order e visibility;
- landmarks/semantics;
- accessible names;
- contraste;
- status que não depende apenas de cor;
- touch targets;
- screen-reader smoke test;
- reduced motion.

### Responsive

Validar pelo menos:

- 320px;
- mobile largo;
- tablet;
- laptop;
- desktop largo.

### Visual fidelity

- browser QA dos fluxos críticos;
- screenshots da implementação;
- comparação com Protótipo 3 + R1;
- fidelity ledger para desvios materiais;
- correção de regressões antes do fechamento.

### Gate

Nenhum blocker P0/P1 conhecido de a11y, responsive ou fidelity.

---

## R10 — Gate de continuidade do produto

Após R9:

- novas telas usam somente design system canônico;
- styling paralelo não é aceito;
- #45 pode construir sua interface sobre shell/primitives aprovados;
- documentação registra padrões e ownership;
- novos PRs visuais incluem desktop/mobile, accessibility e visual QA;
- #69 só fecha quando não houver superfície relevante restante no sistema antigo.

Trabalho puramente de backend/contratos da #45 pode continuar em paralelo desde que não crie UI temporária concorrente.

## Critérios de conclusão da iniciativa

A #69 só pode ser fechada quando:

- todas as telas atuais estiverem migradas;
- auth, onboarding, dashboard e carteira parecerem partes do mesmo produto;
- shell e navegação forem únicos;
- tokens fundamentais forem centralizados;
- estados comuns forem canônicos;
- desktop/mobile tiverem qualidade equivalente;
- WCAG 2.2 AA tiver sido auditado;
- fluxos críticos tiverem browser QA;
- fidelidade ao Protótipo 3/R1 tiver sido verificada;
- regras financeiras, auth, segurança e persistência continuarem corretas;
- `pnpm check` estiver verde nos PRs finais;
- nenhuma superfície relevante permanecer visualmente no sistema antigo.

## Fora de escopo

- mudar metodologia financeira por motivo visual;
- modificar Investment Engine/Portfolio Engine para “bater” com mockup;
- trocar provider de autenticação;
- alterar ownership/persistência;
- execução financeira;
- adicionar biblioteca visual sem necessidade concreta;
- preservar compatibilidade visual com o frontend antigo;
- inventar dados, rotas ou capacidades para reproduzir o protótipo.

## Sequência canônica

```text
#72 R0 audit ✓
  -> #73 R1 Assistant-First app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 shell
  -> #76 R4 auth
  -> #77 R5 onboarding
  -> #78 R6 dashboard
  -> #79 R7 portfolio
  -> #80 R8 estados/componentes transversais
  -> #81 R9 accessibility/responsive/fidelity QA
  -> R10 / fechamento da #69
  -> UI da #45 sobre a nova fundação
```
