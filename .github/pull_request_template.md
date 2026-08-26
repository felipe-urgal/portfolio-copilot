## Problema

Descreva o problema/atividade que este PR resolve.

## Solução

Descreva a implementação e as principais decisões.

## Fora de escopo

Liste explicitamente o que não faz parte deste PR.

## Como testar

```bash
pnpm install --frozen-lockfile
pnpm check
```

Inclua passos adicionais quando necessários e registre o SHA exato validado.

## Riscos e impacto

Descreva riscos técnicos, financeiros, de segurança, dados, compatibilidade ou operação.

## Documentação atualizada

Liste os `.md`, ADRs e tarefas alterados.

## Checklist obrigatório antes do merge

- [ ] critérios de aceite atendidos;
- [ ] testes/edge cases adequados;
- [ ] quality gate do **head final** integralmente verde via CI ou fallback local documentado quando Actions não puder iniciar por billing/infra;
- [ ] SHA exato validado registrado no PR;
- [ ] auto code review completo em nível sênior realizado;
- [ ] findings do review aplicados ou adiamentos explicitamente registrados;
- [ ] arquitetura e escopo revisados;
- [ ] segurança e supply chain revisadas;
- [ ] documentação/ADRs atualizados;
- [ ] `NEXT.md`, `DONE.md` e backlog coerentes;
- [ ] diff final revisado sem arquivos temporários;
- [ ] nenhum finding pendente.

> Um push novo invalida a checagem final. CI continua preferido. Se o GitHub Actions estiver impedido de iniciar por billing/infra, o fallback local deve executar `pnpm install --frozen-lockfile` e `pnpm check` no SHA exato do head, registrar o resultado no PR e repetir após qualquer novo push.
