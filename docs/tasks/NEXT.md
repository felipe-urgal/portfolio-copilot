# Próxima Atividade — UX/UI R9: acessibilidade, responsividade e visual fidelity QA

**Status:** READY — próxima prioridade canônica em 2026-09-02

## Issue canônica

- #81 — `UX/UI R9: acessibilidade, responsividade e visual fidelity QA`
- iniciativa guarda-chuva: #69

## Dependência concluída — R8 / #80

O R8 consolidou os componentes/estados transversais reais do frontend atual sem inventar consumidores para capabilities ainda ausentes das surfaces:

- PR #95 — primitive canônica `Disclosure` e início da consolidação transversal;
- PR #105 — account migration states sobre `Alert`/`Disclosure` canônicos;
- PR #106 — `/health` sobre primitives/tokens R2;
- PR #107 — `ReasonCodeList` reutilizável e disclosures da recomendação consolidados;
- PR #108 — auth sem `AuthDisclosure` paralelo;
- PR #109 — persistência do onboarding sobre `Disclosure` canônico;
- PR #110 — AssetId, TransactionId e identidade do Portfolio sobre `Disclosure` canônico; merge `81c20a309849aba2964deb2aa9e6ef8ae3bc640e`;
- CI pós-merge #574 — verde no `main` após o PR #110.

Audit final do R8:

- `FinancialProfileSessionSummary` possui consumidor real em `/portfolio` e já usa `Disclosure`, `Status`, `EmptyState`, `Surface` e actions canônicas;
- loading/empty/error/success/conflict presentes nas surfaces atuais consomem os contratos R2/R8 aplicáveis;
- provenance/stale/missing/conflict avançados existem em Domain/Market Data/Investment Engine, mas não possuem surface consumidora atual no `apps/web`; nenhuma UI fictícia foi criada apenas para satisfazer o checklist;
- detalhes técnicos/reason codes permanecem auditáveis em segunda ordem;
- não restou finding transversal concreto que justifique reabrir as surfaces antes do R9.

## Objetivo do R9

Validar o produto redesenhado como um único sistema em acessibilidade, responsividade, browsers e fidelidade ao Protótipo 3/R1 antes do gate final R10.

## Escopo

### Accessibility

- WCAG 2.2 AA nos fluxos e componentes atuais;
- keyboard-only flows;
- focus order e focus visibility;
- landmarks, headings e semantics;
- accessible names/descriptions;
- contraste;
- estados que não dependem somente de cor;
- reduced motion;
- screen-reader smoke test dos fluxos críticos.

### Responsive

- 320px;
- mobile largo;
- tablet;
- laptop;
- desktop largo;
- overflow em forms/listas/conteúdo técnico;
- sidebar/drawer/context rail;
- touch targets e ergonomia.

### Visual fidelity

- screenshots dos fluxos críticos;
- comparação com Protótipo 3 e contratos derivados do R1;
- fidelity ledger para desvios materiais;
- browser QA de auth, onboarding, dashboard e portfolio;
- correção de regressões encontradas antes do fechamento.

## Fluxos mínimos

- sign-in / re-entry / sign-out;
- onboarding completo;
- dashboard com perfil configurado e estados ausentes honestos;
- migração local → conta e conflict quando reproduzível com fixture/teste seguro;
- carteira: criação, ativos, transações, posições, aporte e configuração;
- loading/empty/error/success relevantes nas surfaces existentes.

## Regras

- não usar o R0 como substituto deste QA real do produto redesenhado;
- nenhuma diferença material deve ser aceita silenciosamente: corrigir ou registrar justificativa no fidelity ledger;
- não afrouxar acessibilidade para igualar pixels do protótipo;
- não inventar dados/capabilities para preencher screenshots;
- preservar domínio, auth, ownership, persistência e metodologia financeira;
- cumprir integralmente `AGENTS.md` e `docs/DEVELOPMENT.md`.

## Gate

R10 só começa quando:

- nenhum blocker P0/P1 conhecido de accessibility/responsive/fidelity permanecer aberto;
- desktop e mobile tiverem qualidade equivalente;
- Protótipo 3 continuar reconhecível como direção do produto;
- fluxos críticos tiverem browser QA e evidência suficiente;
- fidelity ledger estiver reconciliado;
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
  -> #80 R8 estados/componentes ✓
  -> #81 R9 a11y/responsive/fidelity (próxima)
  -> R10 / fechamento #69
```

## Referências canônicas

- `AGENTS.md`;
- `docs/DEVELOPMENT.md`;
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

A #45 continua sem UI funcional durante a #69. O R9 valida somente capabilities reais já presentes no produto.
