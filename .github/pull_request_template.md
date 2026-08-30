## Contexto / problema

Descreva o problema/atividade, a issue canônica e por que a mudança é necessária.

## Solução

Explique o que foi implementado e as decisões/fronteiras importantes. Não limite esta seção a uma lista de arquivos.

## Fora de escopo

Liste explicitamente o que não faz parte deste PR e qualquer dívida deliberadamente separada.

## Como testar

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm check
```

Adapte os comandos ao escopo. Inclua cenários manuais relevantes e registre o SHA exato do head final validado.

## Riscos e segurança

Descreva riscos técnicos, financeiros, de segurança, privacidade, dados, compatibilidade, migration ou operação.

Quando aplicável, confirme explicitamente auth/authz/ownership, invariantes financeiras, provenance/freshness, concorrência/idempotência e supply chain.

## Documentação e issues

Liste os `.md`, ADRs, decisões e issues atualizados. Consulte `docs/DOCUMENTATION-MAP.md`.

## Auto code review sênior

**Obrigatório e independente do CI.** Revise o diff integral conforme `AGENTS.md` e registre aqui:

- findings concretos encontrados;
- correções aplicadas;
- regressions tests adicionados;
- adiamentos deliberados com issue/backlog correspondente;
- confirmação de que não restou finding aberto.

Não usar “review feito” sem explicar os pontos relevantes realmente revisados/encontrados.

## Quality gate final

**Head SHA:** `<sha-final>`

- [ ] install com lockfile congelado;
- [ ] Docker Compose config;
- [ ] format check;
- [ ] lint;
- [ ] typecheck;
- [ ] migrations;
- [ ] root `.env.local` DB fallback migration;
- [ ] tests;
- [ ] build.

Se Actions não conseguir iniciar por motivo externo confirmado antes de executar steps, documente o fallback local permitido por `docs/DEVELOPMENT.md`. Falha funcional real do CI não pode ser contornada por fallback.

## Checklist obrigatório antes do merge

- [ ] issue/critério de aceite integralmente atendido;
- [ ] implementação na camada arquitetural correta;
- [ ] testes e edge cases adequados;
- [ ] regressions tests adicionados para bugs encontrados no PR/review;
- [ ] segurança/privacidade revisadas;
- [ ] invariantes financeiras revisadas quando aplicável;
- [ ] accessibility/responsive revisados para UI;
- [ ] dependências/supply chain revisadas;
- [ ] documentação/ADRs/issues reconciliados;
- [ ] `NEXT.md`, `BACKLOG.md`, `DONE.md` e roadmap coerentes quando afetados;
- [ ] auto code review completo em nível fullstack sênior realizado sobre o diff integral;
- [ ] findings corrigidos ou adiamentos explicitamente rastreados;
- [ ] quality gate do **head final** integralmente verde;
- [ ] SHA exato validado registrado acima;
- [ ] diff final revisado sem debug, backup, workflow diagnóstico ou artefato temporário;
- [ ] nenhum finding pendente;
- [ ] PR elegível para merge conforme `AGENTS.md` e `docs/DEVELOPMENT.md`.

> Qualquer push novo invalida a checagem final anterior. CI verde em SHA antigo não valida o head atual.