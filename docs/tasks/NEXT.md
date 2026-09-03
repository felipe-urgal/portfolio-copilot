# Próxima Atividade — UX/UI R9: acessibilidade, responsividade e visual fidelity QA

**Status:** IN PROGRESS — prioridade canônica atual em 2026-09-03

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
- PR #111 — gate documental final do R8, reconciliação da iniciativa e promoção do R9;
- CI pós-merge #577 — verde no `main` após o PR #111.

Audit final do R8:

- `FinancialProfileSessionSummary` possui consumidor real em `/portfolio` e já usa `Disclosure`, `Status`, `EmptyState`, `Surface` e actions canônicas;
- loading/empty/error/success/conflict presentes nas surfaces atuais consomem os contratos R2/R8 aplicáveis;
- provenance/stale/missing/conflict avançados existem em Domain/Market Data/Investment Engine, mas não possuem surface consumidora atual no `apps/web`; nenhuma UI fictícia foi criada apenas para satisfazer o checklist;
- detalhes técnicos/reason codes permanecem auditáveis em segunda ordem;
- não restou finding transversal concreto que justifique reabrir as surfaces antes do R9.

## Objetivo do R9

Validar o produto redesenhado como um único sistema em acessibilidade, responsividade, browsers e fidelidade ao Protótipo 3/R1 antes do gate final R10.

## Progresso incremental em 2026-09-03

O R9 segue sendo executado em verticais pequenas e verificáveis enquanto o browser QA remoto permanece indisponível:

- PR #130 — audit estático do AppShell identificou que a brand navegável podia herdar somente a altura visual do glyph (38,4px no desktop e 33,6px no header mobile estreito), abaixo do contrato ergonômico canônico de 44px;
- a brand passou a preservar `--touch-target-min` sem aumentar o glyph nem alterar a hierarquia visual do header/sidebar;
- o teste do AppShell cobre explicitamente a área mínima da brand junto dos botões Menu/Fechar já endurecidos pelo R9;
- o contrato foi reconciliado em `docs/design/APP-SHELL.md`;
- PR #131 — o onboarding passou a expor `required` nativo para decisões que o domínio já exige antes de avançar: moeda, risco, horizonte, meta de reserva quando ativada, tipo/valor de objetivos existentes e data somente quando `DATED_PURPOSE` exige;
- a obrigatoriedade dos grupos de risco/horizonte também ficou explícita nas respectivas legendas, sem criar primitive visual paralela;
- `noValidate` e `validateOnboardingStep(...)` continuam preservados, então os atributos nativos comunicam semântica a agentes de usuário/tecnologias assistivas sem substituir a validação de domínio;
- regressões do onboarding verificam a semântica obrigatória e `docs/design/ONBOARDING.md` registra o contrato endurecido;
- PR #132 — `Button`/`LinkButton` com `size="sm"` mantêm padding e tipografia compactos, mas passam a compor também o min-height canônico de 44px já definido pelo R2;
- a correção é central na primitive, cobrindo consumidores reais sem remendos por feature, e a suíte de primitives protege a composição compacta + touch target;
- `docs/design/DESIGN-SYSTEM.md` já estabelecia 44px como baseline ergonômico; esta vertical corrige a implementação para cumprir o contrato existente, sem criar mudança normativa paralela;
- PR #133 — a brand navegável do focused auth passou a preservar `--touch-target-min` (44px) sem aumentar o glyph visual de `--control-height-sm` (36px);
- a regressão de auth protege separadamente a área interativa mínima e o tamanho visual do glyph, e `docs/design/AUTH-SESSION.md` registra o hardening sem alterar OAuth/sessão;
- PR #134 — `FinancialProfileSessionSummary`: remover a cópia local de um perfil persistido desmontava o botão focado; a correção entrega o foco, após a transição, à nota persistente de sessão com o estado resultante;
- a regressão segue o padrão de source-level focus tests já usado pelo R9 e não altera storage, snapshot financeiro, auth, ownership ou metodologia;
- PR #135 — o hardening de semântica obrigatória de `/portfolio` foi agrupado em três atividades coesas: criação da Carteira, cadastro de ativo local e registro de movimentações no Transaction Ledger;
- nome/moeda da Carteira; nome/classe/instrumento/moeda do ativo; e tipos/valores/ativo/quantidade/settlement das movimentações passam a expor `required` nativo e indicação de obrigatoriedade compatível com os primitives existentes;
- `noValidate` e `createPortfolioSnapshot(...)` / `createLocalAssetSnapshot(...)` / `createCashTransactionSnapshot(...)` / `createAssetTradeSnapshot(...)` continuam como autoridades de validação, sem mudança de domínio financeiro ou persistência;
- regressões de `PortfolioWorkspace` protegem separadamente as três atividades e `docs/design/PORTFOLIO.md` registra o contrato endurecido;
- PR #136 — o audit de hierarchy encontrou `EmptyState` criando `h2` implícito dentro de regiões já tituladas em onboarding, Dashboard e Carteira;
- o review ampliado encontrou também um consumidor no pipeline de Aporte subordinado a `h3`, então a solução final evita assumir qualquer nível: o título de `EmptyState` é texto semanticamente neutro por padrão e `headingLevel={2 | 3 | 4}` só é usado quando o estado realmente inicia uma subseção;
- `FinancialProfileSessionSummary` preserva explicitamente `headingLevel={2}` porque seu estado ausente é o caso auditado que precisa de heading próprio; styling, spacing e copy permanecem inalterados;
- regressões cobrem a primitive, os estados aninhados do Dashboard e da Carteira e o uso subordinado no passo de Objetivos do onboarding;
- nesta execução, mesmo com a URL pública fornecida (`portfolio-copilot-plum.vercel.app`) e a URL do projeto na Vercel, o ambiente continuou sem acesso navegável: fetch não abriu a página, o conector Vercel não possui permissão para listar o projeto e o shell não resolve `*.vercel.app`;
- portanto screenshots, fidelity ledger, keyboard-only end-to-end e screen-reader smoke continuam **não executados** e não devem ser tratados como evidência existente.

A #81 permanece aberta até o gate completo de browser/fidelity/accessibility ser reproduzível e concluído.

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
  -> #81 R9 a11y/responsive/fidelity (atual)
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
