# Mapa canônico de documentação

## Status

**Documento vivo.** Última reconciliação da iniciativa UX/UI: **2026-08-30**, no PR #92.

Este mapa define qual documento responde por cada tipo de informação e como tratar divergências. O objetivo é impedir que roadmap, backlog, README, ADRs e documentos de descoberta virem fontes concorrentes de verdade.

## Ordem de precedência

Quando dois documentos parecerem divergir, use esta ordem:

1. decisões aceitas em `docs/DECISIONS.md` e ADRs aplicáveis;
2. contratos normativos de segurança, dados, regulatório e metodologia;
3. contratos atuais de arquitetura e design;
4. `AGENTS.md` e `docs/DEVELOPMENT.md` para processo de engenharia/PR;
5. `docs/ROADMAP.md` e `docs/tasks/NEXT.md` para prioridade/status corrente;
6. issues/PRs do GitHub para execução e evidência da entrega;
7. `docs/tasks/DONE.md` para histórico resumido;
8. documentos de descoberta para contexto e intenção original.

Uma decisão posterior e explicitamente aceita substitui uma ideia anterior sem apagar o histórico.

## Tipos de documento

### Entrada, engenharia e estado geral

| Documento | Tipo | Responsabilidade |
| --- | --- | --- |
| `README.md` | vivo | entrada do projeto, capabilities atuais, setup e links canônicos |
| `AGENTS.md` | normativo operacional | contrato para agentes de IA: padrão fullstack sênior, fluxo de PR, CI e auto code review obrigatório |
| `docs/DEVELOPMENT.md` | normativo operacional | processo geral de desenvolvimento, quality gate e Definition of Done |
| `docs/ARCHITECTURE.md` | vivo | arquitetura implementada e fronteiras atuais |
| `docs/ROADMAP.md` | vivo | estado estratégico e sequência macro |
| `docs/DECISIONS.md` | vivo/histórico | índice de decisões; não apagar decisões anteriores |

### Produto e descoberta

| Documento | Tipo | Responsabilidade |
| --- | --- | --- |
| `docs/VISION.md` | descoberta | visão e princípios de produto |
| `docs/PRODUCT.md` | descoberta/produto | escopo e proposta de produto |
| `docs/PROJECT-BRIEF.md` | descoberta histórica | decisões e hipóteses da descoberta; não é backlog operacional |
| `docs/product/FEATURE-CATALOG.md` | vivo | catálogo de capabilities com estado explícito |

Números, ativos e exemplos em documentos de descoberta são contexto de pesquisa, não recomendação automática nem capability implementada.

### Segurança, dados e metodologia

Estes documentos são **normativos** enquanto não forem explicitamente substituídos:

- `docs/SECURITY.md`;
- `docs/REGULATORY.md`;
- `docs/DATA-SOURCES.md`;
- `docs/FINANCIAL-METHODOLOGY.md`;
- `docs/INVESTMENT-ENGINE-METHODOLOGY.md`;
- `docs/INVESTMENT-THESIS-LIFECYCLE.md`;
- `docs/AI-CONTENT-INGESTION.md`;
- `docs/portfolio/INVESTMENT-POLICY.md`.

Mudanças materiais nesses contratos exigem decisão registrada e, quando arquitetural, ADR.

### Design e UX/UI

| Documento | Tipo | Responsabilidade |
| --- | --- | --- |
| `docs/design/PROTOTYPE-3-DIRECTION.md` | canônico | direção visual aprovada |
| `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md` | canônico | arquitetura de informação/composição |
| `docs/design/DESIGN-SYSTEM.md` | canônico | tokens e primitives R2 |
| `docs/design/APP-SHELL.md` | canônico | AppShell/navegação R3 |
| `docs/design/AUTH-SESSION.md` | canônico | focused auth R4 |
| `docs/design/ONBOARDING.md` | canônico | guided onboarding R5 |
| `docs/design/DASHBOARD.md` | canônico | Dashboard orientado a contexto/panorama/próxima ação R6 |
| `docs/design/PORTFOLIO.md` | canônico | Carteira R7 organizada por tarefas, ledger/positions/aporte e progressive disclosure |
| `docs/UX-UI-REDESIGN-ROADMAP.md` | vivo | sequência R0–R10 e gates |
| `docs/design/FRONTEND-AUDIT.md` | baseline histórico | fotografia do frontend anterior no R0 |

`FRONTEND-AUDIT.md` não descreve o estado visual atual; ele preserva o baseline que justificou o redesign.

### ADRs

Todos os arquivos em `docs/adr/` são **registros históricos de decisão**.

Regras:

- não reescrever um ADR antigo para fazê-lo parecer atual;
- corrigir somente erro factual/editorial que não mude a decisão;
- se a decisão mudar, criar nova decisão/ADR e marcar a relação de supersessão;
- `docs/DECISIONS.md` deve apontar para a decisão vigente.

### Fila operacional

| Documento | Tipo | Responsabilidade |
| --- | --- | --- |
| `docs/tasks/NEXT.md` | vivo | exatamente uma atividade pronta/prioritária |
| `docs/tasks/BACKLOG.md` | vivo | backlog macro ainda aberto, sem repetir entregas concluídas |
| `docs/tasks/DONE.md` | histórico | histórico resumido das entregas concluídas |
| `docs/tasks/README.md` | vivo | regras de uso da fila operacional |

Issues do GitHub são o backlog executável detalhado. `BACKLOG.md` é uma visão macro e não deve duplicar centenas de checklists de issues.

## Estado da iniciativa UX/UI em 2026-08-30

- R0 #72 — concluído;
- R1 #73 — concluído;
- R2 #74 — concluído;
- R3 #75 — concluído;
- R4 #76 — concluído;
- R5 #77 — concluído via PR #88;
- R6 #78 — concluído via PR #91;
- R7 #79 — entregue no PR #92 e considerado concluído após o merge desse PR;
- R8 #80 — próxima atividade após o merge do #92;
- R9 #81 — pendente;
- R10 — gate final e fechamento da #69.

## Política de atualização

Ao finalizar um PR relevante:

1. atualizar somente documentos vivos/normativos afetados;
2. registrar nova decisão quando houver mudança de contrato;
3. promover `NEXT.md` para uma única próxima atividade;
4. remover do `BACKLOG.md` itens que deixaram de ser backlog;
5. acrescentar o resumo aplicável em `DONE.md`;
6. atualizar issues abertas afetadas por novas dependências/status;
7. não reescrever histórico antigo apenas para marcar checkbox;
8. para trabalho conduzido por IA, cumprir integralmente `AGENTS.md`, inclusive auto code review sênior independente do CI.

## Reconciliações recentes

### PR #88

A reconciliação ampla de 2026-08-30 revisou o inventário completo de Markdown do repositório, classificou documentos vivos/normativos/históricos, atualizou status das issues abertas e adicionou `AGENTS.md` como contrato operacional para agentes de IA.

### PR #91

A reconciliação do R6 adicionou `docs/design/DASHBOARD.md`, promoveu #79/R7 como próxima atividade e atualizou roadmap/backlog para refletir que o Dashboard já segue AppShell/tokens/primitives e preserva ausências de dados de forma explícita.

### PR #92

A reconciliação do R7 adiciona `docs/design/PORTFOLIO.md`, registra a Carteira por tarefas como contrato canônico, promove #80/R8 como próxima atividade após o merge e atualiza roadmap, catálogo, backlog, histórico e issues relacionadas sem alterar decisões normativas de domínio/persistência.
