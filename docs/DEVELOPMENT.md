# Desenvolvimento

## Estratégia de branches

```text
main
  ↑
PR
  ↑
feature/* | bugfix/* | docs/* | refactor/* | test/* | chore/*
```

`main` deve permanecer integrável.

## Fluxo por atividade

1. ler `docs/tasks/NEXT.md`;
2. confirmar escopo e fora de escopo;
3. criar branch;
4. implementar a menor entrega vertical coerente;
5. atualizar/criar testes;
6. rodar lint, typecheck e testes;
7. revisar segurança e dados;
8. atualizar documentação afetada;
9. fazer self-review do diff;
10. corrigir achados;
11. abrir PR com critérios de aceite;
12. revisar o PR;
13. mergear somente com CI verde e sem findings pendentes;
14. registrar em `DONE.md`;
15. promover próxima tarefa para `NEXT.md`.

## Definition of Done

Uma atividade só está concluída quando:

- critérios de aceite atendidos;
- testes adequados existem e passam;
- sem erro de lint/typecheck;
- erros e edge cases tratados;
- sem segredo/PII em código/log;
- mudanças de domínio documentadas;
- mudanças financeiras têm testes de invariantes;
- mudanças de fonte externa têm contract/validation tests;
- PR revisado;
- `NEXT`/`DONE` atualizados.

## Convenções de commit

Preferir Conventional Commits:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

## Pull request

Descrição mínima:

- problema;
- solução;
- fora de escopo;
- como testar;
- riscos;
- documentação atualizada;
- checklist.

## Review financeiro

Mudança de cálculo deve responder:

- qual fórmula mudou?
- qual unidade/moeda?
- qual arredondamento?
- quais invariantes?
- há impacto em snapshots históricos?
- há migration/version bump da metodologia?

## Review de segurança

Perguntas mínimas:

- amplia acesso a dados?
- adiciona input externo?
- adiciona segredo?
- altera auth/authz?
- pode vazar dado em log/telemetria?
- adiciona integração ou dependência?

## CI alvo

Na Fase 1:

```text
install
lint
typecheck
test
build
```

Security checks entram gradualmente, sem transformar warnings irrelevantes em ruído permanente.
