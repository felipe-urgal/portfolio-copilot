# Carteira R7 — contrato de experiência

## Status

Implementado na issue #79 / PR #92 como R7 da iniciativa #69.

Este documento registra o contrato atual de `/portfolio` após a reorganização do workspace financeiro. Ele complementa `R1-ASSISTANT-FIRST-APP-SPEC.md`, `DESIGN-SYSTEM.md`, `APP-SHELL.md` e `DASHBOARD.md` sem alterar domínio, metodologia financeira, ownership, persistência ou fontes de verdade.

## Objetivo

A Carteira deixa de apresentar configuração, catálogo, posições, transações, ledger e aporte como uma única parede de controles. A superfície passa a responder, por tarefa:

1. qual é o estado conhecido da carteira;
2. qual ação faz sentido agora;
3. quais fatos existem no Transaction Ledger;
4. quais posições podem ser projetadas com segurança;
5. como estruturar um aporte determinístico sem sugerir execução de ordem.

## Fontes de verdade preservadas

### Portfolio

`PortfolioSnapshot` continua responsável por identidade, nome e moeda de referência. O UUID canônico permanece disponível em detalhe técnico, não na primeira hierarquia.

### Ativos

O catálogo local continua separado de posição. Um Asset pode existir sem posição e sua identidade canônica continua sendo usada internamente nos snapshots e transações.

### Posições

Posições continuam sendo projeção exclusiva de `BUY`/`SELL` do Transaction Ledger:

```text
Transaction Ledger
  -> projection
  -> Positions
```

Não existe holding paralelo editável. `CASH_IN` e `CASH_OUT` não criam ou alteram posição.

### Transações

Cada movimentação entra no ledger somente depois de validação completa. Erros de formulário não geram fato parcial. Histórico e criação ficam visualmente separados para evitar competir pela mesma prioridade.

### Aporte

O pipeline existente permanece determinístico e na mesma ordem conceitual:

```text
baseline manual
  -> política
  -> concentração
  -> restrições de execução
  -> custos conhecidos
  -> RecommendationSnapshot
  -> explicação determinística
```

A UI não recalcula regras financeiras, não inventa preço e não transforma orçamento monetário em quantidade recomendada sem Market Data.

## Arquitetura da página

### Estado sem Portfolio

A primeira visita apresenta uma única tarefa: criar a carteira local. Nome e moeda usam primitives canônicas, expõem a obrigatoriedade já existente no domínio por `required` nativo e indicação visual, e o contrato de dados fica em segunda coluna/contexto.

Nenhum ativo, saldo, posição ou transação inicial é presumido.

### Navegação por tarefa

Depois da criação, `/portfolio` mantém uma única rota e expõe navegação local simples:

- Visão geral;
- Ativos e posições;
- Transações;
- Aporte;
- Configuração.

A navegação usa botões com `aria-current`, não um pattern ARIA de tabs incompleto. As seções permanecem montadas enquanto são alternadas, preservando rascunhos e o estado interno do pipeline de aporte durante a sessão.

### Visão geral

Mostra somente fatos reais:

- nome e moeda de referência;
- quantidade de ativos cadastrados;
- quantidade de posições abertas;
- quantidade de movimentações;
- posições projetadas por quantidade;
- próxima ação derivada do estado local.

Preço, patrimônio, custo médio, P&L, retorno e alocação por market value continuam ausentes porque a superfície não recebe Market Data real.

### Ativos e posições

Cadastro e catálogo ficam próximos, mas posição continua uma projeção separada. O usuário escolhe ativos por nome/contexto humano; AssetId aparece apenas em disclosure técnico.

No hardening R9, nome, classe econômica, instrumento e moeda de referência do ativo comunicam com `required` nativo a mesma obrigatoriedade já aplicada por `createLocalAssetSnapshot(...)`; a validação de domínio continua sendo a autoridade do submit.

No hardening R9, o contador visual do catálogo (`Nenhum ativo` / `N ativos`) também funciona como `role="status"`. Assim, concluir um cadastro local atualiza uma região já existente e anuncia o novo total sem criar toast, estado de feedback paralelo ou mover foco do formulário.

Estados distintos permanecem explícitos:

- nenhum ativo cadastrado;
- ativo cadastrado sem posição;
- somente fluxos de caixa;
- compras/vendas que resultam em posição zero;
- posição aberta.

### Transações

A área separa:

- registro de fluxo de caixa;
- registro de compra/venda;
- histórico do Transaction Ledger.

Tipo, data, ativo quando aplicável, quantidade e settlement ficam escaneáveis. TransactionId permanece em detalhe técnico.

No hardening R9, as legendas de tipo/operação deixam explícito que a decisão é obrigatória, os radios correspondentes usam `required`, e valor de caixa, ativo, quantidade e settlement comunicam a obrigatoriedade nativamente sem substituir `createCashTransactionSnapshot(...)` ou `createAssetTradeSnapshot(...)`.

### Aporte

A tarefa de aporte preserva o pipeline completo, mas migra forms, actions, status e feedback para primitives R2.

Progressive disclosure move reconciliação por etapa, reason codes e explicação detalhada para segunda ordem. A primeira hierarquia mantém orçamento, status e resultado determinístico.

A copy deixa explícito que o fluxo é planejamento: nenhuma etapa envia ordem para corretora ou representa execução financeira.

No hardening R9 / PR #139, as obrigações já exigidas pelo domínio também ficam semanticamente explícitas ao longo do pipeline: base manual e aporte, parâmetros de política, limites soft/hard somente quando a classe de concentração é habilitada, ativo/elegibilidade/quantidade mínima de execução e versão da metodologia usam `required` nativo e indicação visual aplicável. Custos conhecidos permanecem opcionais porque o contrato existente define campo vazio como zero. Todos os forms preservam `noValidate`; as funções de domínio continuam sendo a autoridade de validação e nenhuma regra financeira é movida para o browser.

No hardening R9 / PR #140, os seis containers tabulares que podem exigir scroll horizontal — matriz do baseline e resultados de baseline/política, concentração, execução, custos e recomendação — tornam-se regiões nomeadas e focáveis com `role="region"`, `tabIndex={0}` e nome acessível específico. O foco do container reutiliza os tokens canônicos de focus ring; conteúdo, cálculos e layout das tabelas permanecem inalterados.

### Configuração

Agrupa informações infrequentes:

- nome/moeda do Portfolio;
- identidade técnica;
- natureza local/não persistida da workspace;
- reset explícito do estado local.

Reset da Carteira não remove perfil financeiro nem dados da conta.

### Contexto financeiro da sessão

O resumo compartilhado do perfil permanece disponível na página, mas passa a ser disclosure secundário sobre `Surface`, `Status`, `Button`, `LinkButton` e `EmptyState` canônicos. Ele não domina mais a entrada do workspace.

## Design system

R7 remove implementações locais de controles fundamentais da Carteira e do pipeline de aporte:

- inputs/selects usam `TextInput`/`Select`;
- escolhas compactas usam `SegmentedControl`;
- toggle de concentração usa `ChoiceCard`;
- actions usam `Button`/`LinkButton`;
- estados usam `Status`;
- feedback usa `Alert`, `EmptyState` e `FieldError`;
- surfaces usam `Surface`;
- CSS local fica restrito a anatomy, tabelas, grids, ritmo e responsive.

Nenhuma dependência visual nova foi adicionada.

## Responsive e acessibilidade

- desktop: grids por tarefa sem empilhar toda a aplicação simultaneamente;
- laptop/tablet: colunas viram fluxo único antes de comprimir formulários;
- mobile: campos, resumos e listas empilham; navegação local pode rolar horizontalmente;
- controles herdam touch target/focus do design system;
- campos e escolhas obrigatórios nas etapas de criação, ativos, transações e aporte expõem `required` nativo sem delegar a validação ao browser, porque os forms preservam `noValidate` e as funções de domínio continuam sendo a autoridade;
- tabelas do Aporte que podem exceder a largura disponível preservam scroll horizontal e oferecem região nomeada, entrada no foco de teclado e focus ring visível para operação independente de gesto de ponteiro;
- detalhes técnicos usam `details/summary` com target acessível;
- navegação local não declara semântica de tabs sem implementar o respectivo modelo de teclado;
- informação essencial não depende de hover ou apenas de cor;
- no hardening R9, uma ação que desaparece após mutação deve entregar foco a um destino persistente; a remoção da cópia local do perfil transfere foco para a nota de sessão depois que o estado de persistência muda;
- resultados de cadastro local que já possuem um contador persistente reutilizam esse `Status` como região live, evitando feedback visual-only e componentes redundantes.

R9 continua responsável pelo audit integrado WCAG 2.2 AA e visual fidelity final.

## Persistência

R7 não altera persistência. Portfolio, Assets, Transaction Ledger e estados de aporte continuam locais à própria workspace nesta versão. Recarregar/sair remove esse estado.

A persistência server-side já existente no repositório não é conectada implicitamente a esta UI como efeito colateral do redesign. Essa integração exige vertical próprio caso seja priorizada.

## Fora de escopo do R7

- mudar fórmulas, reason codes ou metodologia;
- alterar Transaction Ledger ou projection;
- persistir a workspace automaticamente;
- adicionar Market Data ou valuation;
- inventar patrimônio, retorno, P&L ou alocação atual por valor;
- executar ordem financeira;
- redesenhar todos os estados transversais do app (#80);
- fechar o audit final de accessibility/responsive/fidelity (#81).

## Gate para R8

R8 pode partir deste contrato assumindo que:

- `/portfolio` já é organizado por tarefas;
- ledger e posições continuam determinísticos;
- formulário e feedback fundamentais já usam R2;
- detalhe técnico não domina a primeira hierarquia;
- aporte completo permanece disponível sem sugerir execução;
- nenhuma métrica dependente de fonte ausente foi criada;
- estados transversais restantes podem ser tratados sem reabrir a arquitetura da Carteira.
