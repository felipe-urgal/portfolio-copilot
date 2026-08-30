# Onboarding financeiro — contrato de experiência R5

## Status

**CANÔNICO após conclusão da #77 / R5.**

Este documento registra o contrato visual e de interação de `/onboarding` depois da migração para o AppShell do R3 e para as primitives do R2. Ele complementa `R1-ASSISTANT-FIRST-APP-SPEC.md`, `DESIGN-SYSTEM.md` e `APP-SHELL.md`.

## 1. Boundary

O R5 é uma migração de experiência, não de domínio.

Continuam sendo fonte de verdade, sem mudança de significado:

- `apps/web/src/features/onboarding/onboarding-form.ts`;
- `FinancialProfile`, `FinancialGoal`, `Money`, `RiskTolerance` e `FinancialHorizon` no domínio;
- as quatro etapas `profile -> reserve -> goals -> review`;
- validação antes de avançar ou produzir snapshot;
- persistência local opt-in e separada de autenticação/ownership.

A rota continua dentro do `AppShell`. A feature não cria `main`, header global, sidebar ou navegação paralela.

## 2. Hierarquia

A composição canônica é:

```text
AppShell
  Main
    PageHeader — Perfil financeiro
    Progressão compacta — 4 etapas
    Surface da etapa atual
      Título + ajuda curta
      Controles da decisão atual
      Validação contextual
      Voltar / Continuar
    Disclosure de persistência
```

O stepper é orientação, não uma segunda navegação. Por isso usa composição aberta e marcadores de etapa em vez de quatro cards concorrentes com o formulário.

## 3. Etapas

### Perfil

- moeda de referência com `Field`, `Label`, `TextInput`, `HelpText` e `FieldError`;
- tolerância a risco com `ChoiceCard` e descrição explícita para cada alternativa;
- horizonte com `SegmentedControl` porque é uma escolha compacta entre três categorias;
- `aria-describedby`, `aria-invalid`, fieldset/legend e foco no primeiro erro continuam preservados.

### Reserva

A reserva é opcional. O opt-in usa `ChoiceCard` checkbox em vez de um switch visual próprio. Quando ativada, a meta aparece como campo monetário. A UI mantém o valor como texto e a conversão para `Money` continua acontecendo somente na validação existente.

### Objetivos

- zero objetivos é um estado válido e usa `EmptyState`;
- adicionar objetivo é uma ação explícita;
- cada objetivo é uma unidade real e pode usar `Surface` sutil;
- tipo usa `Select`;
- valor e data usam `TextInput`;
- remover usa `Button` ghost;
- nenhum controle redefine as regras de data/valor do domínio.

### Revisão

A revisão apresenta o snapshot já validado antes de qualquer decisão de persistência:

- moeda, risco, horizonte e reserva;
- objetivos, quando existirem;
- `Status` para distinguir `somente nesta sessão`, `salvo neste dispositivo` e `armazenamento indisponível`;
- editar, salvar/remover persistência e recomeçar continuam ações explícitas.

## 4. Persistência

Persistência não compete com a tarefa principal.

Antes da revisão, o detalhe fica em progressive disclosure (`details/summary`). O contrato permanece:

- padrão: somente memória da sessão;
- salvar no dispositivo exige ação explícita;
- recarregar pode restaurar o snapshot local quando disponível;
- nada é sincronizado automaticamente com conta, servidor ou outro dispositivo;
- sair da sessão autenticada não é equivalente a apagar o perfil local.

## 5. Primitives canônicas

O onboarding não mantém equivalentes locais para:

- Button / LinkButton;
- Field / Label / HelpText / FieldError;
- TextInput / Select;
- ChoiceCard;
- SegmentedControl;
- Alert;
- EmptyState;
- Status;
- Surface / Stack / Grid / Cluster;
- PageHeader.

O CSS da feature existe somente para anatomy, ritmo, progressão, review e responsive composition. Cor, foco, touch target, controles e feedback vêm dos semantic tokens/primitives do R2.

## 6. Validação e foco

Ao tentar avançar com dados inválidos:

1. o reducer recebe `validation-failed`;
2. um `Alert` resume que a etapa precisa de revisão;
3. os erros permanecem próximos dos campos;
4. o primeiro controle marcado como inválido recebe foco;
5. nenhum snapshot parcial é publicado.

O summary não substitui os erros de campo e não altera as mensagens de domínio existentes.

## 7. Responsividade

Desktop/laptop:

- conteúdo usa largura controlada dentro do AppShell;
- quatro etapas podem exibir label + resumo;
- formulário permanece a região dominante.

Tablet/mobile:

- stepper reduz informação secundária antes de comprimir o formulário;
- resumos das etapas podem desaparecer, preservando label e marcador;
- goals/review empilham;
- ações passam a largura total quando necessário;
- touch targets vêm do design system;
- nenhuma interação essencial depende de hover.

## 8. Invariantes

R5 não pode:

- alterar o meaning de `FinancialProfile` ou `FinancialGoal`;
- produzir snapshot sem passar pelas validações existentes;
- tornar persistência automática;
- criar shell/navegação paralelos;
- criar primitive visual local quando existe equivalente R2;
- inventar sincronização com conta ou servidor;
- acoplar onboarding ao futuro Copiloto.

## 9. Próxima evolução

Mudanças futuras no onboarding devem partir deste contrato. Melhorias transversais de accessibility/responsive/fidelity pertencem ao R9 (#81); alterações de regras financeiras exigem issue de domínio própria e não devem ser introduzidas como ajuste visual.
