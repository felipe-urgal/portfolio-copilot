# Frontend UX/UI Audit — R0

## Status

**R0 audit de código e desktop concluído.**

Issue: #72  
Iniciativa: #69  
Direção visual canônica: `docs/design/PROTOTYPE-3-DIRECTION.md`

Este documento registra o estado real do frontend antes do redesign. Ele não propõe implementação visual e não altera regras de negócio.

## Evidência e limites do audit

Foram usados como evidência:

- código atual de `apps/web` em `main`;
- screenshots desktop fornecidos durante a revisão de produto para sign-in, onboarding, dashboard e carteira;
- comportamento responsivo inferido pelos breakpoints existentes no CSS;
- testes de componentes/fluxos existentes;
- Protótipo 3 já aprovado apenas como direção futura, nunca como descrição do estado atual.

### Limite conhecido

Não houve captura visual do frontend atual em viewport mobile neste R0. Portanto:

- a estrutura responsive foi auditada por código;
- problemas previsíveis de layout mobile são registrados como risco;
- **não** chamamos essa análise de visual QA mobile;
- a validação visual mobile real permanece obrigatória durante R3-R9.

Esse limite não impede R1 porque a direção visual já foi escolhida e o redesign não precisa preservar o layout atual. Ele impede apenas qualquer afirmação de que a experiência mobile atual foi visualmente aprovada.

---

## 1. Inventário de rotas e superfícies

### `/`

Comportamento atual: redirect direto para `/dashboard`.

**Tarefa do usuário:** entrar no produto.

**Finding:** não existe landing/home pública; o entry point depende da proteção da rota seguinte para conduzir à autenticação.

**R1:** manter entrada simples. Não criar landing de marketing sem necessidade de produto.

### `/sign-in`

Superfície própria fora do `ProductShell`.

Conteúdo atual:

- marca;
- status “Sessão protegida”;
- título de autenticação;
- explicação sobre GitHub;
- aviso sobre separação do perfil financeiro local;
- ação principal GitHub;
- ação secundária para `/health`;
- microcopy sobre sessão/tokens/cookies;
- estado de erro da autenticação.

**Problema principal:** a única decisão real é “entrar com GitHub”, mas status de segurança, perfil local, health e detalhes de sessão disputam a primeira hierarquia.

### `/sign-out`

Superfície de saída/reentrada separada.

**R4:** precisa fazer parte da mesma linguagem de identidade/sessão do novo shell e da tela de entrada.

### `/onboarding`

Fluxo protegido com implementação visual própria.

Estrutura atual:

- topbar própria;
- título central “Onboarding financeiro”;
- indicador de sessão local;
- progress rail lateral sticky;
- nota de persistência;
- card/form principal;
- 4 etapas;
- inputs, selects, radio-card choices, segmented controls, switch, goal editors, review e ações.

**Finding estrutural:** onboarding recria shell/topbar e primitives de formulário em vez de consumir uma fundação compartilhada.

### `/dashboard`

Protegido, usa `ProductShell`, `FinancialProfileSessionSummary` e `FinancialProfileAccountMigration`.

Conteúdo atual:

- resumo de perfil/sessão;
- possível migração de perfil local -> conta;
- header da página;
- status local;
- visão geral;
- estados “dado indisponível” e “ainda não calculado”;
- bloco carteira vazio;
- contexto declarado;
- próximos passos.

**Finding:** o dashboard é correto ao não inventar métricas, mas visualmente se comporta mais como documentação do estado do MVP do que como home operacional do produto.

### `/portfolio`

Protegido, usa `ProductShell`, `FinancialProfileSessionSummary` e `PortfolioWorkspace`.

É a superfície funcional mais densa hoje.

Abriga, direta ou indiretamente:

- criação de carteira;
- snapshot;
- posições;
- catálogo/ativos locais;
- transaction ledger;
- cash transactions;
- asset trades;
- baseline de aporte;
- política de aporte;
- concentração;
- custos;
- recomendação;
- explicação da recomendação;
- execução/conclusão do aporte.

**Finding crítico:** funções diferentes demais vivem no mesmo workspace e dependem de muitas decisões visuais locais. É a maior fonte de risco para um redesign sem primitives.

### `/health`

Superfície operacional acessível da interface.

**Finding:** saúde técnica não deve competir com jornadas principais do produto. No redesign deve ser tratada como utility/diagnóstico, não navegação primária de finanças.

### Shell / sessão

`ProductShell` hoje oferece somente:

- brand;
- `Dashboard`, `Carteira`, `Onboarding`;
- link `Saúde`;
- conta/sessão com nome e status.

O shell já possui elementos positivos de acessibilidade:

- skip link;
- `nav` com accessible label;
- `aria-current`;
- account link com accessible name;
- focus-visible explícito.

O modelo atual é topbar horizontal. A direção aprovada no Protótipo 3 muda a arquitetura para sidebar desktop com sessão/conta no rodapé e conteúdo principal mais amplo.

---

## 2. Inventário técnico visual

### CSS

Estado atual identificado:

- `apps/web/src/app/globals.css`;
- 4 CSS Modules em `components`;
- 9 CSS Modules em `features`;
- total atual: **13 CSS Modules + global CSS** para uma quantidade pequena de superfícies de produto.

Os módulos cobrem auth, shell, resumo/migração de perfil, dashboard, onboarding e várias seções da carteira.

### Tokens implícitos repetidos

Valores equivalentes aparecem diretamente em diversos arquivos:

- background base `#f7f8fb`;
- text principal próximo de `#161922`/`#1b1e29`;
- accent `#4f46e5` e variações `#4338ca`;
- borders em torno de `#d8dce5`, `#dfe3eb`, `#e1e4eb`, `#eceef3`;
- radius entre ~`0.65rem` e `1.25rem`;
- focus ring `rgba(79, 70, 229, ...)`;
- elevations `0 22px 60/65px ...`;
- widths centrais 1120/1180px;
- tamanhos de controles 2.7–2.9rem.

**Classificação:** `FRONTEND_DEBT / P0 para R2`.

Eles formam um design system implícito, mas não governado. O problema não é o valor em si; é cada feature possuir autoridade para redefini-lo.

### Primitives duplicadas

Há implementações locais repetidas para:

- primary action/button;
- secondary action/link;
- page header;
- surface/card/panel;
- status pill;
- input/select;
- help/error text;
- empty state;
- focus ring;
- section heading;
- field group;
- responsive content container.

**Decisão para R2:** essas famílias precisam virar primitives/variants canônicas antes da migração de portfolio.

### Tipografia

A aplicação usa Inter/system sans globalmente, mas pesos, escalas e letter-spacing são decididos por módulo.

Padrões repetidos:

- headings grandes com `letter-spacing: -0.055em`;
- headings secundários próximos de 1rem;
- body muted 0.76–0.84rem em muitas áreas;
- pesos não convencionais como 720/730/750/760.

**Finding `VISUAL / P1`:** há coerência parcial, mas não uma escala tipográfica nomeada. Texto operacional pequeno aparece com frequência excessiva.

### Iconografia

O frontend atual praticamente não possui um sistema de ícones. Muitos significados são comunicados por:

- dots;
- borders;
- circles;
- texto;
- formas desenhadas em CSS.

O Protótipo 3 depende de iconografia consistente na sidebar, KPIs, teses, eventos e Copiloto.

**R2:** escolher uma única biblioteca/fonte de ícones ou um conjunto interno restrito; não misturar estilos.

---

## 3. Responsive inventory

### Shell atual

Breakpoints observados: 900, 760, 500 e 420px.

Comportamento:

- topbar desktop em três colunas;
- em 760px navegação vai para segunda linha;
- links passam a compartilhar espaço horizontal;
- em 420px utility area quebra para layout de uma coluna.

**Risco:** escalar a navegação atual adicionando Ativos, Teses, Transações, Relatórios e configurações — como pede a direção futura — tornaria a topbar inviável. A sidebar aprovada resolve essa limitação arquitetural.

### Dashboard

Breakpoints observados: 900, 700 e 440px.

Há empilhamento de summary/detail regions e adaptações de header/empty state.

**Finding:** responsividade existe, mas é feature-local e orientada ao layout atual, não a uma grade canônica.

### Onboarding

Possui layout próprio com rail + form e vários componentes responsivos.

**Risco:** componentes de escolha de três colunas, goals e ações exigem revisão real de touch target e ordem visual em mobile.

### Portfolio

O workspace possui grids e subgrids próprios; layouts de criação, snapshot, assets e ledger colapsam independentemente.

**Finding `FRONTEND_DEBT / P0`:** portfolio tem muitas regras responsive locais e deve migrar somente depois de container/grid/form primitives canônicas.

---

## 4. UX findings priorizados

### UX-01 — Informação operacional ocupa a hierarquia principal

**Severidade:** P0  
**Superfícies:** sign-in, dashboard, portfolio.

Exemplos:

- saúde da aplicação como CTA da tela de login;
- explicações repetidas sobre “sessão local” e persistência;
- textos sobre o que o sistema ainda não calcula ocupando espaço dominante;
- “fonte de verdade” e detalhes de implementação apresentados junto à tarefa de criar carteira.

**Ação:** progressive disclosure. Transparência deve continuar, mas em contexto secundário e acessível.

### UX-02 — Shell não representa o produto que está sendo construído

**Severidade:** P0.

A navegação atual expõe apenas Dashboard/Carteira/Onboarding, enquanto o roadmap já possui ativos, teses, eventos, relatórios e futura assistência.

**Ação R1/R3:** arquitetura de informação derivada do Protótipo 3, sem criar rotas vazias apenas para preencher sidebar.

### UX-03 — Dashboard é estado do MVP, não panorama do usuário

**Severidade:** P0.

O dashboard atual explica limitações corretamente, mas quase todo o conteúdo principal é “indisponível/ainda não calculado”. Isso gera baixa utilidade percebida.

**Ação R6:** manter honestidade dos dados, porém priorizar contexto real disponível, progresso, ações e conteúdo útil; cards de métricas só aparecem quando a fonte existe.

### UX-04 — Carteira mistura setup, manutenção, ledger e recomendação

**Severidade:** P0.

Muitas tarefas de natureza diferente coexistem em uma única página/workspace.

**Ação R1/R7:** definir arquitetura progressiva — overview primeiro; criação/configuração, ativos/transações e aporte/recomendação como regiões/flows claros.

### UX-05 — Onboarding tem boa sequência, mas linguagem visual isolada

**Severidade:** P1.

A progressão de quatro etapas é compreensível, porém shell, status local, choice cards e actions não reutilizam a linguagem das demais telas.

**Ação R5:** preservar lógica/ordem salvo finding funcional contrário; redesenhar sobre primitives compartilhadas.

### UX-06 — Estado local/autenticado é explicado vezes demais

**Severidade:** P1.

O conceito é importante, mas está duplicado em auth, shell, dashboard, portfolio e onboarding.

**Ação:** um padrão canônico de account/session + disclosure contextual.

---

## 5. Visual findings priorizados

### VIS-01 — Card/surface é o principal mecanismo de hierarquia

**P0.**

Quase toda região relevante recebe border + radius + fundo + às vezes shadow. O resultado é uma coleção de caixas de peso semelhante.

**Protótipo 3:** manter cards onde representam unidade real; usar whitespace, grid, typography e dividers no restante.

### VIS-02 — Não há semantic tokens

**P0.**

Cores, radius, shadows e spacing são valores locais.

**R2 obrigatório antes de R6/R7.**

### VIS-03 — Densidade e escala variam por módulo

**P1.**

Onboarding é espaçoso; portfolio é denso; dashboard combina headings muito grandes com body muito pequeno.

**R1:** definir density model por tipo de superfície.

### VIS-04 — Status pills em excesso potencial

**P1.**

Vários estados aparecem como pills por padrão, mesmo quando texto simples ou icon+label seria suficiente.

### VIS-05 — Ausência de hierarchy system para dados financeiros

**P0 futuro.**

Ainda não existe contrato de apresentação para:

- currency/amount;
- percentage/change;
- positive/negative/neutral;
- stale/missing/not-calculable;
- allocation;
- recommendation status;
- provenance/reason code.

Isso deve ser resolvido antes de expandir dashboard e portfolio.

---

## 6. Accessibility findings

### O que já existe e deve ser preservado

- skip link no `ProductShell`;
- `aria-current` na navegação;
- labels de navegação;
- `aria-labelledby` em seções;
- uso de `dl/dt/dd` para pares label/value;
- `role="alert"` no erro de autenticação;
- `aria-invalid` em formulários;
- focus-visible explícito em várias ações;
- controles nativos preservados em onboarding.

### A11Y-01 — Focus style duplicado

**P1.**

A mesma intenção é reimplementada em globals e vários modules.

**R2:** `focus-ring` semântico único e contrastado.

### A11Y-02 — Touch targets abaixo do alvo desejado

**P1.**

Muitos controles atuais têm min-height de ~2.35–2.9rem; alguns links utilitários/pills podem ficar pequenos em touch.

**R2/R9:** mínimo canônico para controles interativos e auditoria real em mobile.

### A11Y-03 — Motion sem contrato global

**P1.**

Há transitions e pequenos transforms locais, mas nenhum padrão central de `prefers-reduced-motion`.

### A11Y-04 — Sem validação visual mobile atual

**P0 para fechar R9, não bloqueia R1.**

O código tem breakpoints, mas isso não prova ordem de leitura, overflow, touch ergonomics ou fidelidade.

---

## 7. Front-end debt priorizado

### FE-01 — Componentes visuais grandes demais

**P0 para migração.**

Arquivos atuais de destaque:

- `financial-onboarding-flow.tsx`: ~25 KB;
- `portfolio-workspace.tsx`: ~32 KB;
- `contribution-baseline-panel.tsx`: ~21 KB;
- várias seções de portfolio entre ~10–14 KB.

Não é um problema de bytes isoladamente; indica que composição, estado de domínio e apresentação estão concentrados.

**R2/R5/R7:** extrair apenas primitives/compositions úteis durante a migração, sem refactor abstrato antecipado.

### FE-02 — Shell duplicado no onboarding

**P0 para R3/R5.**

`FinancialOnboardingFlow` possui `.pageShell`, `.topbar`, `.brand` etc. próprios, enquanto as demais telas protegidas usam `ProductShell`.

### FE-03 — Form primitives duplicadas

**P0 para R2.**

Input/select/error/help/actions/choice controls se repetem entre onboarding e portfolio.

### FE-04 — Responsive rules pertencem às features

**P1.**

Não existe container/grid/breakpoint strategy compartilhada.

### FE-05 — Design system implícito sem contrato

**P0.**

A repetição de valores indica que já existe uma linguagem parcial; R2 deve consolidar sem preservar decisões ruins por acidente.

---

## 8. Matriz de estados

| Superfície | Default | Empty | Error | Success/valid | Loading | Selected/active | Disabled | Responsive code |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign-in | sim | n/a | sim | redirect | não explícito | n/a | não relevante | sim via auth CSS |
| Sign-out | sim | n/a | depende do fluxo | sim | não auditado visualmente | n/a | n/a | sim via auth CSS |
| Shell | sim | n/a | n/a | sessão ativa | n/a | nav ativa | n/a | sim |
| Onboarding | sim | objetivos vazios | validações | review/snapshot | não canônico | choices/steps | alguns controles | sim |
| Dashboard | sim | sim, dominante | indireto | perfil/migração | não canônico | nav | n/a | sim |
| Portfolio | sim | vários | vários forms | snapshots/ledger | não canônico | radios/sections | sim | sim |
| Health | sim | n/a | estado health | healthy | n/a | n/a | n/a | básico |

**Finding transversal:** não existe uma família canônica de loading/skeleton; muitos fluxos client-side dependem mais de estado imediato/local do que de uma experiência de espera padronizada.

---

## 9. O que preservar

### Comportamento / domínio

- não inventar market data, patrimônio ou progresso;
- ownership/autorização server-side;
- autenticação GitHub;
- perfil e snapshots validados;
- transaction ledger como fonte de fatos;
- reason codes/provenance;
- separação entre contexto declarado e cálculo.

### UX/A11Y

- skip-to-content;
- labels semânticos;
- controles nativos quando adequados;
- erros explícitos;
- honestidade sobre dados ausentes;
- progressão clara do onboarding;
- confirmação explícita antes de ações destrutivas/materialmente relevantes quando existirem.

---

## 10. O que remover ou reduzir

- health como CTA de mesma importância que login;
- repetição de “sessão local” em múltiplas regiões da mesma tela;
- documentação técnica na primeira hierarquia;
- cards apenas decorativos;
- pills para todo estado;
- sombras grandes repetidas;
- shell próprio por feature;
- primitives de formulário locais;
- identificadores técnicos/UUIDs em primeira ordem visual;
- texto explicando arquitetura interna quando uma label de produto resolve.

---

## 11. O que consolidar no R2

Primitives mínimas recomendadas:

- `AppShell` / navigation composition;
- `PageHeader`;
- `Container`, `Stack`, `Cluster`, `Grid`;
- `Button` + variants;
- `LinkButton` quando semanticamente link;
- `Field`, `Label`, `HelpText`, `FieldError`;
- `TextInput`, `Select`;
- `ChoiceCard` / `SegmentedControl` somente se ambos continuarem necessários;
- `Status`/`Badge` com variantes restritas;
- `Alert`;
- `EmptyState`;
- `Skeleton`/loading state;
- `Surface` somente para unidades reais;
- `Metric`/financial value presentation;
- `Icon` wrapper;
- semantic focus ring;
- semantic color/spacing/type/radius/elevation tokens.

Não criar um framework interno genérico. Só promover padrões já comprovadamente repetidos ou necessários pela direção aprovada.

---

## 12. Critérios mensuráveis para R1/R2

Antes de migrar telas:

1. uma arquitetura de navegação única deve cobrir superfícies atuais + extensões previstas sem criar rotas falsas;
2. a sidebar desktop do Protótipo 3 precisa ter comportamento definido para tablet/mobile;
3. account/session precisa de um único pattern;
4. semantic tokens devem substituir valores fundamentais hardcoded nos componentes migrados;
5. um botão primário não pode ter implementação visual diferente por feature;
6. input/select/error/help/focus devem compartilhar a mesma família;
7. loading/empty/error/success precisam de patterns canônicos;
8. valores financeiros precisam de hierarchy/format/status consistentes;
9. nenhum conteúdo fictício do Protótipo 3 pode virar dado real sem fonte existente;
10. WCAG 2.2 AA e reduced motion entram como requisito de componente, não correção final.

---

## 13. Decomposição recomendada da #69

A execução deve seguir child issues independentes e revisáveis:

- **R1** — IA, navigation model e expansão do Protótipo 3 para auth/onboarding/dashboard/portfolio + mobile;
- **R2** — design tokens e primitives;
- **R3** — app shell/sidebar/account/responsive navigation;
- **R4** — auth/sign-in/sign-out;
- **R5** — onboarding;
- **R6** — dashboard;
- **R7** — portfolio/workspace;
- **R8** — estados/componentes transversais;
- **R9** — accessibility, responsive e visual fidelity QA.

R10 é gate de governança e pode ser fechado pela própria #69 após R9.

---

## 14. Conclusão do R0

O problema central não é falta de capricho em uma tela. O frontend atual possui **um design system implícito, distribuído e não governado**, enquanto a arquitetura de informação ainda representa o MVP inicial.

O Protótipo 3 resolve a direção de produto, mas a implementação correta exige esta ordem:

```text
R1 arquitetura/expansão da direção aprovada
  -> R2 tokens + primitives
  -> R3 shell
  -> R4 auth
  -> R5 onboarding
  -> R6 dashboard
  -> R7 portfolio
  -> R8 states/domain surfaces
  -> R9 accessibility/responsive/fidelity QA
```

A maior regra de execução é: **não redesenhar feature por feature com CSS local novo**. Primeiro consolidar a fundação; depois migrar progressivamente mantendo comportamento e domínio.
