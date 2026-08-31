# Produção e readiness operacional

## Estado atual

A produção está **deliberadamente desabilitada** no contrato consumível por automação:

```text
.dev-dashboard/production.json
production.enabled=false
reasonCode=production-readiness-gate
```

Isso não significa que o projeto não possua build, PostgreSQL, migrations, autenticação ou health local. Significa que essas fundações ainda não formam, por si só, um contrato de produção seguro e público.

## Comandos padronizados

```bash
pnpm prod:status
pnpm prod:check
pnpm prod:deploy
pnpm prod:verify
```

- `prod:status` informa de forma não mutável que o gate permanece fechado;
- `prod:check` reutiliza o quality gate atual do repositório;
- `prod:deploy` falha com exit code não-zero enquanto `production.enabled=false`;
- `prod:verify` também falha enquanto não existe ambiente de produção canônico para verificar.

Não existe bypass por variável de ambiente ou feature flag. Habilitar produção exige uma mudança explícita do contrato e dos documentos normativos aplicáveis.

## Gates antes de habilitar produção

O manifesto registra como bloqueadores, no mínimo:

- segurança operacional de produção;
- backup/restore e disaster recovery testados;
- observabilidade e SLOs aplicáveis;
- tenancy/LGPD para o modelo de uso pretendido;
- Regulatory Gate antes de recomendação individualizada pública, monetização ou prestação equivalente a terceiros.

Para produção **privada/pessoal**, o enquadramento regulatório público pode ter escopo diferente, mas segurança, backup/DR e operação continuam obrigatórios e precisam ser definidos explicitamente antes de mudar `production.enabled`.

## Relação com documentos normativos

Este documento não redefine regras já existentes. Consulte:

- [`SECURITY.md`](SECURITY.md) para baseline de segurança e operação;
- [`REGULATORY.md`](REGULATORY.md) para a fronteira entre uso pessoal/controlado e produto público;
- [`DATA-SOURCES.md`](DATA-SOURCES.md) para provenance, freshness e licenciamento;
- [`ARCHITECTURE.md`](ARCHITECTURE.md) para fronteiras implementadas;
- [`ROADMAP.md`](ROADMAP.md) e [`tasks/NEXT.md`](tasks/NEXT.md) para prioridade corrente.

## Integração futura com o Dev Dashboard

O futuro control plane deve interpretar este projeto como **produção bloqueada**, não como serviço parado nem como falha de health. `prod:deploy` não deve ser executado automaticamente enquanto o manifesto permanecer desabilitado.

Quando os gates forem concluídos, a mudança futura deverá definir provider/strategy, health/readiness, backup, migrations, rollback/recovery e apenas então substituir o comportamento fail-closed.
