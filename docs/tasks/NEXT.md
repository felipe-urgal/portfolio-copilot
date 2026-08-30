# Próxima Atividade — UX/UI R7: redesenhar carteira e workspace financeiro

**Status:** READY após merge da #78 / PR #91

## Issue canônica

- #79 — `UX/UI R7: redesenhar carteira e workspace financeiro`
- iniciativa guarda-chuva: #69

## Fundação concluída

O R7 parte das superfícies e contratos já padronizados:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + direção do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- #75 — R3 AppShell/sidebar/navegação responsiva;
- #76 — R4 focused auth/session;
- #77 — R5 onboarding guiado;
- #78 / PR #91 — R6 Dashboard orientado a contexto, panorama e próxima ação;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/design/DASHBOARD.md`.

A Carteira continua sendo a superfície mais densa do produto e hoje concentra criação/configuração, ativos, posições, ledger, transações e aporte na mesma workspace. O R7 deve reorganizar essa experiência sem alterar as fontes de verdade ou reimplementar o domínio na UI.

## Objetivo do R7

Transformar `/portfolio` em um workspace financeiro por tarefas, escaneável e progressivo, preservando o Transaction Ledger, as projeções determinísticas e o pipeline de aporte como fontes de verdade.

## Escopo

### Overview e configuração

- identidade/nome/moeda da carteira;
- estado atual da configuração;
- próxima tarefa contextual;
- detalhes técnicos/UUIDs fora da primeira hierarquia quando não necessários.

### Ativos e posições

- separar claramente catálogo local de ativo e posição projetada;
- quantidade/classe/instrumento com hierarchy legível;
- sem preço, market value ou P&L inventado;
- estado `sem posição` distinto de `sem ativo` e `sem transação`.

### Transaction Ledger

- manter o ledger como fonte de fatos;
- separar criação de transação da consulta do histórico;
- tornar tipo, data, ativo, quantidade e settlement escaneáveis;
- erro de validação nunca vira fato parcial.

### Aporte

Organizar o pipeline real em uma jornada inteligível:

```text
baseline
  -> política
  -> concentração
  -> custos/restrições
  -> recomendação determinística
  -> explicação
  -> conclusão registrada
```

Nenhuma etapa deve sugerir execução de ordem em corretora.

### Estados e responsive

- desktop/tablet/mobile;
- empty/missing/error e recuperação;
- progressive disclosure para reason codes/provenance/snapshots;
- primitives R2 e AppShell R3 como únicas foundations visuais.

## Regras

- Transaction Ledger permanece fonte de verdade das posições;
- domínio e pipeline financeiro não são reproduzidos em CSS/React;
- não inventar preço, patrimônio, market value, P&L ou Market Data;
- não copiar o workspace/CSS atual para outro módulo e chamar isso de redesign;
- não alterar persistência/ownership como efeito colateral visual;
- mudanças funcionais descobertas devem virar vertical próprio;
- cumprir integralmente `AGENTS.md`, inclusive auto code review fullstack sênior.

## Gate

R8 (#80) só começa quando:

- tarefas principais da Carteira estiverem separadas e reconhecíveis;
- ledger/posição/aporte preservarem comportamento determinístico;
- detalhes técnicos não dominarem a primeira hierarquia;
- formulários/feedback/ações usarem contratos canônicos;
- desktop/mobile estiverem definidos no código;
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
  -> #79 R7 portfolio
  -> #80 R8 estados/componentes
  -> #81 R9 a11y/responsive/fidelity
  -> R10 / fechamento #69
```

## Referências canônicas

- `AGENTS.md`;
- `docs/DOCUMENTATION-MAP.md`;
- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/design/DASHBOARD.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI funcional temporária durante a #69. A futura superfície do Copiloto deve nascer sobre os contratos finais e consumir dados estruturados reais.
