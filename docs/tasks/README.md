# Gestão de Tarefas

A pasta `docs/tasks` mantém a visão operacional resumida do projeto. **Issues do GitHub são a fonte executável detalhada**; estes arquivos organizam foco, macro backlog e histórico.

## Arquivos

- `NEXT.md`: exatamente uma atividade pronta/prioritária;
- `BACKLOG.md`: backlog macro ainda aberto, sem repetir entregas concluídas;
- `DONE.md`: histórico resumido das entregas concluídas;
- `archive/`: snapshots históricos preservados quando a visão resumida é reconciliada;
- `../ROADMAP.md`: estado estratégico e sequência de iniciativas;
- `../DOCUMENTATION-MAP.md`: ownership e precedência de toda a documentação.

## NEXT.md

Deve conter:

- issue canônica;
- objetivo e contexto;
- dependências já atendidas;
- escopo e fora de escopo;
- critérios de aceite/gate;
- testes esperados;
- documentação afetada;
- riscos relevantes.

Não transformar `NEXT.md` em uma lista de tarefas paralelas. Quando uma atividade é concluída, o mesmo PR deve promover a próxima atividade canônica sempre que ela já estiver definida.

## BACKLOG.md

É uma visão macro **somente do trabalho ainda aberto**. Não deve continuar listando fundações já mergeadas como se fossem futuras. O detalhe de cada vertical fica na issue correspondente.

## DONE.md

É histórico resumido, não uma segunda specification.

Regras:

- novas entregas relevantes devem ser registradas sem depender de checklists antigos de issues fechadas;
- PRs e Git preservam a evidência detalhada;
- quando uma reconciliação reduzir detalhes antigos, o conteúdo anterior deve ser preservado em `archive/` ou continuar recuperável de forma explícita, sem apagar história silenciosamente.

A reconciliação do PR #88 preservou o `DONE.md` detalhado anterior em `archive/DONE-through-2026-08-27.md` e atualizou a visão resumida até R5.

## Estados conceituais

```text
BACKLOG -> READY/NEXT -> IN PROGRESS -> PR -> DONE
```

Um item pode permanecer bloqueado por dependência/regulatory gate sem entrar em `NEXT.md`.

## Regra de escopo

Se uma descoberta ampliar muito o trabalho:

1. não esconder a expansão no PR atual;
2. registrar/atualizar issue apropriada;
3. refletir a dependência em `BACKLOG.md`/`ROADMAP.md` quando material;
4. manter `NEXT.md` com uma única prioridade.

## Reconciliação

Quando houver drift entre docs e GitHub, reconciliar os documentos vivos e as issues abertas. ADRs, briefs e audits históricos não devem ser reescritos apenas para aparentar status atual; consulte `docs/DOCUMENTATION-MAP.md`.

Agentes de IA devem seguir também `AGENTS.md`, incluindo quality gate do head final e auto code review fullstack sênior obrigatório.