# Próxima Atividade — UX/UI R9: acessibilidade, responsividade e visual fidelity QA

**Status:** IN PROGRESS — prioridade canônica atual em 2026-09-05

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

## Progresso incremental até 2026-09-05

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
- PR #137 — o audit de accessible descriptions encontrou o mesmo padrão em Carteira, Transações e todo o pipeline de Aporte: quando um campo ficava inválido, vários consumidores substituíam o `HelpText` pelo `FieldError` em `aria-describedby`;
- em vez de criar remendos em cada feature, `Field` preserva automaticamente os IDs explícitos de `HelpText` quando existe exatamente um `TextInput`/`Select` direto, compondo esses IDs com qualquer descrição adicional fornecida pela feature;
- o auto-review inicial encontrou o risco de associação ambígua em `Field` com múltiplos controles; a correção final não tenta inferir relações nesses casos e mantém `aria-describedby` sob responsabilidade explícita da feature;
- a primitive não inventa IDs, não usa Context/hook e não altera regras de validação; erro, `required`, domínio financeiro, persistência, auth e ownership permanecem nas autoridades existentes;
- regressões SSR da suíte de primitives cobrem `TextInput`, `Select` e o guard de múltiplos controles; `docs/design/DESIGN-SYSTEM.md` registra o contrato;
- PR #139 — o hardening de semântica obrigatória do pipeline de Aporte foi agrupado em quatro atividades coesas: baseline/política, concentração, execução e snapshot auditável;
- base manual/aporte e parâmetros de política passam a expor `required`; limites soft/hard fazem isso somente enquanto a classe de concentração está habilitada; execução comunica a obrigação de ativo/elegibilidade/quantidade mínima; e a versão da metodologia do snapshot também é marcada como obrigatória;
- custos conhecidos permanecem intencionalmente opcionais, pois o contrato atual define campo vazio como zero; `noValidate` e as funções de domínio permanecem como autoridades e nenhuma regra financeira foi deslocada para o browser;
- regressão source-level dedicada protege separadamente as quatro atividades e `docs/design/PORTFOLIO.md` registra o contrato endurecido;
- PR #139 foi mergeado em `62b7a3340e233773d2314b2602af6963b3e79662`; CI pós-merge #682 no mesmo SHA concluiu em success;
- PR #140 — o hardening de overflow horizontal do Aporte agrupa quatro atividades coesas: baseline, concentração, execução/custos e snapshot auditável;
- os seis containers tabulares horizontais passam a ser regiões nomeadas e focáveis (`role="region"`, `tabIndex={0}`), permitindo entrada explícita pelo teclado sem depender de gesto de ponteiro; o focus ring reutiliza os tokens canônicos existentes;
- nenhuma tabela, cálculo, ordem do pipeline ou layout foi alterado; a regressão dedicada protege as seis regiões e o estilo de foco, e `docs/design/PORTFOLIO.md` registra o contrato;
- PR #147 — o status principal do perfil no Dashboard passa a usar `role="status"`, permitindo anunciar a restauração local assíncrona de `Perfil pendente` para `Perfil configurado` sem alterar layout, domínio ou persistência; regressão e `docs/design/DASHBOARD.md` registram o contrato; CI do head #710 concluído em success;
- PR #148 — o marcador da utility `Saúde da aplicação` no AppShell deixa de usar tokens de `success` sem uma fonte real de liveness/readiness e passa a ser visualmente neutro; `/health` continua sendo a surface que expõe o estado operacional real; regressão e `docs/design/APP-SHELL.md` registram o contrato; CI do head #711 concluído em success;
- PR #149 — o contador persistente do catálogo de ativos (`Nenhum ativo` / `N ativos`) passa a usar `role="status"`, reutilizando o feedback já visível após cadastro local sem toast, foco artificial ou estado paralelo; regressão e `docs/design/PORTFOLIO.md` registram o contrato; CI do head #712 concluído em success;
- PR #150 — o contador persistente do Transaction Ledger (`Ledger vazio` / `N movimentações`) passa a usar `role="status"` para anunciar `CASH_IN`, `CASH_OUT`, `BUY` e `SELL` válidos sem alterar cálculo, posições, persistência ou foco; após o merge do #149, a branch foi reconciliada sobre a `main` porque ambas tocavam os mesmos três arquivos, preservando as duas verticais; head final `0286cca999b8082b156b46ea3d30abbedf1786e0`, CI #719 concluído em success e `docs/design/PORTFOLIO.md` reconciliado;
- PR #151 — o bloco de persistência da revisão do onboarding passa a expor `role="status"`, `aria-live="polite"` e `aria-atomic="true"`, anunciando salvar/remover/falha sem mover foco nem alterar o opt-in; a falha inicial de formatação foi corrigida com a versão canônica do Prettier do repositório; head final `810ac8bfef7775f1a856851fdea27308897fc50d`, CI #722 concluído em success e `docs/design/ONBOARDING.md` reconciliado;
- PRs #147, #148, #149, #150 e #151 foram mergeados por squash; a `main` resultante do lote ficou em `dd0e78b0ce576776db90e84ecfa2d4da6174eaa2`; o R9 permanece aberto e R10 não é promovido enquanto browser QA/fidelity/keyboard-only E2E/screen-reader smoke não tiverem evidência reproduzível.
- PR #153 — o link de conta no AppShell deixa de manter um `aria-label` redundante e passa a derivar o nome acessível da copy visível `displayName` + `Sair da sessão`; `docs/design/APP-SHELL.md` registra a fonte única e a regressão protege label-in-name;
- PR #154 — o status de restauração do perfil da sessão na Carteira passa a ser uma região `role="status"` com atualização `polite`/atômica, reutilizando o feedback persistente já existente e sem criar toast paralelo; `docs/design/PORTFOLIO.md` foi reconciliado;
- PR #155 — o estado de persistência do perfil no Dashboard passa a anunciar transições por meio do `Status` já existente, preservando storage, migração e métricas; `docs/design/DASHBOARD.md` foi reconciliado;
- PR #156 — o stepper do onboarding mantém `aria-current="step"` apenas na etapa ativa e passa a expor conclusão das etapas anteriores por um marcador nomeável `Concluída`, sem transformar o stepper em tabs ou navegação interativa; `docs/design/ONBOARDING.md` foi reconciliado;
- PR #157 — `/health` ganha metadata/título específico `Status da aplicação | <APP_NAME>` sem alterar liveness/readiness; `docs/PRODUCTION.md` registra a separação entre a surface humana e os probes canônicos;
- PRs #153, #154, #155, #156 e #157 foram mergeados por squash; a `main` resultante ficou em `4d340ab46dfbcd19c6d8e19f4a52ef80aced63ca`; CI pós-merge #742 no mesmo SHA concluiu em success;
- o shell desta sessão continua sem `agent-browser`, então screenshots, fidelity ledger, keyboard-only E2E e screen-reader smoke permanecem **não executados**; a conexão atual da Vercel permite verificar deployments e respostas HTTP, mas não substitui um browser interativo autenticado;
- a Vercel conectada confirmou para o SHA então vigente de `main` (`4117e5f14a0f7527433d5193ba452ce876f0b263`) um deployment `READY` com target `production` e outra tentativa `CANCELED`; `/health` respondeu HTTP 200 com o título `Status da aplicação | Portfolio Copilot` e `/api/health/ready` respondeu HTTP 200 com `dependencies.postgres=ok`;
- acessar `/portfolio` sem uma sessão autenticada entrega corretamente a surface `Entrar | Portfolio Copilot`, portanto o fluxo interno autenticado ainda não possui evidência browser/teclado/fidelity nesta sessão;
- PR #159 — o seletor local da Carteira deixa de comunicar falsamente uma página corrente com `aria-current="page"`: o conjunto passa a ser `role="group"`, a tarefa ativa usa `aria-pressed`, `aria-controls` é preservado e nenhum pattern ARIA de tabs incompleto é introduzido; regressão e `docs/design/PORTFOLIO.md` foram reconciliados; head `9221eadc57958713b7e0b0a6eafb695728ee002e`, CI #745 concluído em success; merge por squash `784ecbea1f559cfdf73c51ca999073f608f82554`;
- PR #160 — o contrato operacional passa a refletir `vercel.json` e o fluxo real `check -> migrate -> provider-deploy -> verify`: `prod:status`, regressão e `docs/PRODUCTION.md` deixam explícito `git.deploymentEnabled=false`, mantêm deploy local recusado e não confundem merge em `main` com promoção automática; head `5ba51dbec42ca3b00595d64ca806409e2d36d338`, CI #746 concluído em success; merge por squash `ffb45dd34c63a2d447523b53fd5d129a4ab1c783`;
- o sweep estático adicional de AppShell, auth, onboarding, Dashboard, Carteira e primitives não encontrou um terceiro finding R9 suficientemente reproduzível para justificar nova vertical; o trabalho restante é o gate integrado de browser/fidelity/keyboard-only/screen-reader, não backlog artificial.

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
