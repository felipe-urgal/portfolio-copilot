# Gestão de Tarefas

A pasta `docs/tasks` é a fila operacional do projeto.

## Arquivos

- `NEXT.md`: uma única atividade pronta para execução;
- `BACKLOG.md`: atividades futuras ordenadas;
- `DONE.md`: histórico resumido das entregas concluídas.

## Regra

`NEXT.md` precisa conter:

- objetivo;
- contexto;
- escopo;
- fora de escopo;
- critérios de aceite;
- testes esperados;
- documentação afetada;
- riscos.

Não transformar `NEXT.md` em uma lista de vinte tarefas paralelas. A intenção é preservar foco e permitir revisão clara.

## Estados conceituais

```text
BACKLOG -> READY/NEXT -> IN PROGRESS -> PR -> DONE
```

Se uma descoberta ampliar muito o escopo, registrar no backlog em vez de escondê-la no PR atual.
