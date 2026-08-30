# Dashboard R6 — contrato de experiência

## Status

Implementado na issue #78 / PR #91 como R6 da iniciativa #69.

Este documento registra o contrato atual de `/dashboard` após a migração para a direção do Protótipo 3. Ele complementa `R1-ASSISTANT-FIRST-APP-SPEC.md`, `DESIGN-SYSTEM.md` e `APP-SHELL.md` sem alterar domínio, metodologia financeira ou fontes de verdade.

## Objetivo

O Dashboard responde, nesta ordem:

1. qual contexto financeiro já é conhecido;
2. o que pode ser afirmado com segurança;
3. qual é a próxima ação concreta;
4. quais análises ainda dependem de fatos que a superfície não recebe.

A hierarquia não usa limitações técnicas como título dominante e não preenche o layout com números ilustrativos.

## Fontes reais disponíveis no R6

### Identidade autenticada

O greeting usa somente `displayName` vindo da identidade autenticada já resolvida no server. Subject, email e demais detalhes de identidade não atravessam para o componente do Dashboard.

### Perfil financeiro da sessão

O Dashboard pode consumir o snapshot validado compartilhado por `FinancialSessionProvider`:

- moeda de referência;
- tolerância a risco;
- horizonte;
- meta declarada de reserva;
- quantidade de objetivos;
- estado de persistência local.

Esses campos são contexto declarado. Meta de reserva não é saldo atual, objetivos não possuem progresso implícito e o perfil não autoriza inferir patrimônio ou retorno.

### Carteira

No R6, `PortfolioWorkspace` ainda mantém Portfolio, Assets e Transaction Ledger como estado local da própria tela de Carteira. Esse estado não é uma fonte compartilhada com `/dashboard`.

Consequência: o Dashboard não mostra patrimônio, composição, posições, target versus atual, gaps, aporte, retorno ou evolução histórica. O panorama central usa um empty state com ação para `/portfolio` até existir uma integração real.

### Market Data, Investment Engine, teses e eventos

As foundations existem no repositório, mas não há uma integração de produto que forneça snapshots confiáveis ao Dashboard atual. Portanto o R6 não simula:

- preço ou valuation;
- Quality/Opportunity/Portfolio Fit;
- recomendação;
- tese/evento;
- alerta stale de fonte que a superfície não consultou.

## Arquitetura da página

### Cabeçalho

- greeting curto derivado de identidade real;
- descrição muda conforme o perfil esteja configurado ou pendente;
- `Status` informa somente o estado do perfil.

### Métricas compactas

A seção só aparece quando existe perfil validado.

- quantidade de objetivos é um fato determinístico;
- meta de reserva só aparece quando foi declarada;
- ausência de meta não vira zero ou placeholder financeiro.

### Panorama de Carteira

É o bloco visual dominante. Enquanto não houver dados compartilhados:

- mostra estado vazio explícito;
- explica em linguagem de produto que nenhuma composição será inferida;
- oferece `Abrir carteira` como ação concreta.

### Atenção agora

A ação é derivada apenas do estado conhecido:

- sem perfil: concluir onboarding;
- com perfil: estruturar fatos da carteira;
- com perfil: revisão do onboarding permanece secundária.

### Context rail neutro

O rail mostra fatos reais do perfil e não representa o Copiloto funcional. Não contém resposta gerada, recomendação, sugestão de IA ou CTA que implique a capability da #45.

Em larguras menores, o rail entra no fluxo abaixo do conteúdo principal antes de comprimir o workspace.

### Progressive disclosure

O detalhe `O que ainda não aparece neste Dashboard` explica patrimônio, retorno, composição, Market Data e outras ausências. IDs, provenance e reason codes não disputam a primeira ordem.

## Migração do perfil para a conta

A capability opt-in já existente permanece disponível quando há snapshot local persistido. No R6 sua apresentação foi migrada para `Surface`, `Badge`, `Status`, `Alert`, `LoadingState` e `Button` canônicos.

O fluxo de segurança não mudou:

- nenhum upload automático;
- conflito exige ação explícita;
- compare-and-swap e resposta `409` continuam responsáveis por concorrência;
- remover cópia local continua sendo ação separada.

## Responsive e acessibilidade

- desktop: workspace principal + context rail;
- laptop/tablet: rail deixa de ser persistente e entra abaixo da coluna principal;
- mobile: uma coluna, ações em largura disponível e fatos do perfil empilhados;
- nenhuma informação essencial depende de hover;
- focus ring e touch targets vêm das primitives/tokens;
- reduced motion permanece no boundary global do design system;
- landmarks continuam pertencendo ao AppShell; o Dashboard não cria outro `main`.

## Fora de escopo do R6

- persistir/compartilhar o estado da Carteira;
- redesign completo de `/portfolio` (#79);
- criar integração nova com Market Data/Investment Engine;
- UI funcional do Copiloto (#45);
- mudar fórmulas, domínio, auth, ownership ou schema;
- criar métricas para preencher o mockup.

## Gate para R7

R7 pode partir deste contrato assumindo que:

- o Dashboard já usa a hierarquia do Protótipo 3;
- qualquer número visível possui fonte real;
- ausência de carteira compartilhada é tratada honestamente;
- perfil/account migration usam linguagem visual canônica no Dashboard;
- a Carteira permanece responsável por sua própria migração visual e pela futura decisão de como compartilhar fatos com outras superfícies.
