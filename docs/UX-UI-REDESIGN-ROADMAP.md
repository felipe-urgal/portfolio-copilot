# UX/UI Redesign — Roadmap do app completo

## Status

**INICIATIVA ATIVA — issue #69**

O Portfolio Copilot entrou em uma pausa estratégica de evolução visual para refazer a experiência completa do app antes de adicionar novas superfícies relevantes.

O objetivo não é aplicar um tema novo por cima do frontend existente. É redesenhar a experiência inteira como um único produto, preservando regras de negócio, autenticação, segurança e persistência.

## Escopo

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
- empty/loading/error/success states;
- hover/focus/active/disabled;
- desktop/tablet/mobile;
- novas superfícies, incluindo a futura UI da #45.

Compatibilidade funcional é obrigatória. Compatibilidade visual com o layout atual não é objetivo.

## Diagnóstico inicial

A inspeção atual mostra uma interface construída incrementalmente por superfície:

- valores fundamentais de cor, radius, spacing e elevation aparecem hardcoded em CSS global e CSS Modules;
- auth, shell e componentes financeiros possuem decisões visuais locais;
- a hierarquia de algumas telas dá peso demais a informação operacional/técnica;
- cards e containers são usados com frequência como mecanismo primário de hierarquia;
- não há um contrato suficientemente explícito de tokens, primitives, iconografia e estados;
- responsividade é resolvida localmente por componente/tela;
- novas features correm risco de ampliar a inconsistência existente.

A tela de sign-in é um bom exemplo do problema sistêmico: autenticação, status de segurança, perfil local e health competem na mesma superfície. O redesign precisa resolver a jornada, não apenas alterar o CSS desse card.

## Princípios

1. **Design antes de código.** Conceitos completos precisam ser aprovados antes da migração visual ampla.
2. **Um app, um sistema.** Toda tela usa os mesmos tokens, primitives e regras de composição.
3. **Uma prioridade visual por contexto.** A ação principal não compete com mensagens operacionais secundárias.
4. **Menos chrome, mais estrutura.** Usar tipografia, grid, whitespace e alinhamento antes de adicionar cards, borders ou badges.
5. **Produto financeiro, não dashboard genérico.** Dados devem ser legíveis, comparáveis, explicáveis e confiáveis.
6. **Segurança por comportamento e clareza.** Informação técnica aparece quando ajuda o usuário, não como decoração de confiança.
7. **Responsive desde a concepção.** Mobile e desktop são estados da mesma solução.
8. **WCAG 2.2 AA.** Foco, teclado, contraste, semantics e reduced motion são critérios de produto.
9. **Sem regressão de domínio.** Nenhuma mudança visual altera cálculo, ownership, auth ou fronteira de segurança.
10. **Fidelidade verificável.** Conceito aprovado, implementação, browser QA e comparação visual antes do merge.

## Estratégia de execução

A iniciativa será dividida em PRs pequenos e revisáveis. Não haverá um único PR com o redesign inteiro.

Cada fase gera seu próprio gate. Child issues podem ser criadas depois do audit R0, quando o inventário real permitir decompor trabalho sem especulação.

## R0 — Audit completo e inventário

### Objetivo

Entender exatamente o frontend atual antes de tomar decisões de redesign.

### Entregas

- inventário de rotas, páginas e estados;
- screenshots desktop e mobile das superfícies atuais;
- inventário de componentes e CSS Modules;
- mapa de tokens implícitos/hardcoded;
- mapa das jornadas críticas;
- findings classificados como UX, visual, accessibility ou front-end debt;
- lista de padrões repetidos e divergentes;
- lista de estados ausentes/inconsistentes;
- critérios mensuráveis de sucesso do redesign.

### Gate

Nenhum redesign estrutural é implementado antes de concluir o audit.

## R1 — Arquitetura da informação e direção visual

### Objetivo

Definir como o Portfolio Copilot deve parecer, se comportar e organizar informação.

### Entregas

- personalidade visual do produto;
- arquitetura da informação e modelo de navegação;
- container/grid/density model;
- direção tipográfica;
- direção de cor e superfície;
- direção de iconografia;
- conceitos completos para sign-in/auth, onboarding, dashboard e carteira;
- variações desktop e mobile;
- estados importantes de erro/empty/loading;
- escolha de uma única direção canônica.

### Processo de conceito

Para superfícies importantes, gerar conceitos visuais completos antes de codar. Um conceito de header/hero isolado não é suficiente para representar uma tela de produto.

### Gate

A implementação ampla só começa após aprovação explícita da direção visual.

## R2 — Design system foundation

### Objetivo

Transformar a direção aprovada em contratos reutilizáveis.

### Tokens

- semantic colors;
- typography scale;
- spacing scale;
- grid/gutters/content widths;
- radius;
- elevation;
- motion;
- z-index quando necessário;
- semantic feedback colors.

### Primitives

- text/heading;
- button/link;
- input/select/textarea;
- label/help/error;
- divider;
- stack/cluster/container/grid;
- focus ring;
- icon wrapper;
- feedback/alert;
- empty state;
- loading/skeleton;
- surface/panel apenas quando houver necessidade semântica.

### Estados

- default;
- hover;
- focus-visible;
- active/pressed;
- selected;
- disabled;
- loading;
- error;
- success.

### Decisão técnica

Avaliar conscientemente se CSS Modules + CSS custom properties continuam sendo a melhor base ou se alguma biblioteca de primitives é necessária. Não introduzir framework visual por conveniência.

## R3 — App shell e navegação

### Entregas

- shell canônico;
- navegação primária/secundária;
- account/session affordances;
- page header pattern;
- content width/density por tipo de página;
- desktop/tablet/mobile;
- keyboard navigation;
- active/hover/focus states;
- comportamento de navegação responsiva.

Esse shell passa a ser obrigatório para todas as superfícies protegidas.

## R4 — Auth e sessão

### Cobertura

- `/sign-in`;
- `/sign-out`;
- auth errors;
- expired/re-entry state;
- callback/recovery states;
- session/account affordances do shell.

### Objetivos

- tornar login uma jornada simples, focada e confiável;
- retirar informação operacional da hierarquia principal;
- preservar transparência sobre privacidade sem transformar a tela em documentação técnica;
- manter todas as garantias de segurança existentes.

## R5 — Onboarding completo

### Objetivos

- revisar ordem e agrupamento das perguntas;
- reduzir carga cognitiva;
- melhorar progress/progression;
- criar padrões consistentes para choice, input e validation;
- definir save/resume/re-entry states;
- garantir boa experiência em telas pequenas.

## R6 — Dashboard completo

### Objetivos

- redefinir a primeira hierarquia após login;
- mostrar situação, decisão e contexto antes de detalhe secundário;
- criar padrões claros para resumo, alocação, objetivos, recomendação e explicações;
- usar cards somente onde representem uma unidade real;
- definir padrões de visualização de dados;
- manter informação financeira comparável e escaneável.

## R7 — Carteira completa

### Objetivos

- refazer holdings/list/table experience;
- alocação e gaps;
- concentração;
- agrupamentos;
- ações/transações relacionadas;
- detalhes progressivos;
- estados de dado incompleto/stale quando aplicáveis;
- comportamento responsivo sem degradar leitura financeira.

## R8 — Componentes de domínio e estados transversais

Migrar para o novo sistema:

- recommendation/reason-code surfaces;
- financial profile/session summary;
- account migration surfaces;
- formulários;
- transaction patterns;
- feedback;
- empty states;
- errors;
- loading/skeleton;
- confirmations;
- permission/auth transitions;
- health/operational UI quando exposta a humano.

Nenhum componente visual antigo relevante deve permanecer como ilha de styling independente.

## R9 — Acessibilidade, responsividade e visual QA

### Accessibility

- WCAG 2.2 AA;
- keyboard-only flow;
- focus order;
- focus visibility;
- contrast;
- semantics/landmarks;
- accessible names;
- screen reader smoke test;
- reduced motion.

### Responsive

Validar do mínimo de 320px até desktop largo, incluindo pelo menos:

- small mobile;
- large mobile;
- tablet;
- laptop;
- desktop.

### Visual QA

- browser QA dos fluxos críticos;
- screenshots da implementação;
- comparação com conceitos aprovados;
- revisão de tipografia, spacing, palette, icons e estados;
- correção de regressões visuais antes do merge.

## R10 — Gate de continuidade do produto

Após a migração das superfícies atuais:

- novas telas só usam o design system canônico;
- styling paralelo não é aceito;
- #45 pode construir sua interface sobre o novo shell e primitives;
- documentação de frontend registra padrões e ownership;
- novos PRs visuais incluem desktop/mobile, accessibility e visual QA.

Trabalho puramente de backend/contratos da #45 pode continuar em paralelo apenas se não criar uma interface temporária ou sistema visual concorrente.

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
- os conceitos aprovados tiverem fidelidade verificada;
- regras financeiras, auth, segurança e persistência continuarem corretas;
- `pnpm check` estiver verde nos PRs finais;
- nenhuma superfície relevante permanecer visualmente no sistema antigo.

## Fora de escopo

- mudar metodologia financeira;
- modificar Investment Engine/Portfolio Engine por motivo visual;
- trocar provider de autenticação;
- alterar ownership/persistência;
- execução financeira;
- adicionar biblioteca visual sem necessidade concreta;
- preservar compatibilidade visual com o frontend atual.

## Sequência canônica

```text
#69 R0 audit
  -> R1 direção visual + IA
  -> aprovação de conceito
  -> R2 design system
  -> R3 shell
  -> R4 auth
  -> R5 onboarding
  -> R6 dashboard
  -> R7 portfolio
  -> R8 estados/componentes transversais
  -> R9 accessibility/responsive/visual QA
  -> R10 gate para novas superfícies
  -> UI da #45 sobre a nova fundação
```
