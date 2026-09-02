# Produção e readiness operacional

## Estado atual

A produção pessoal/privada do Portfolio Copilot foi validada em 31/08/2026 e está habilitada no contrato consumido pelo Dev Dashboard:

```text
.dev-dashboard/production.json
production.enabled=true
strategy=git-managed
provider=vercel
branch=main
```

Topologia operacional:

- aplicação: Vercel, projeto `portfolio-copilot`, branch `main`;
- domínio canônico: `https://portfolio-copilot-plum.vercel.app`;
- banco: Neon PostgreSQL 18, branch `production`;
- runtime: `DATABASE_URL` pooled no ambiente Production da Vercel;
- migrations: `DATABASE_DIRECT_URL` direct/unpooled somente no ambiente administrativo de produção;
- check/testes: `CHECK_DATABASE_URL` em banco PostgreSQL isolado, sem dados reais;
- autenticação: Auth.js + GitHub OAuth com uma única conta explicitamente allowlisted em produção;
- health canônico: `https://portfolio-copilot-plum.vercel.app/api/health/ready`;
- exposição pública/monetização: continua fora de escopo até o Regulatory Gate aplicável ser concluído.

Nenhum segredo, URL de banco ou OAuth secret é versionado.

## Production Contract

O contrato ativo usa `strategy=git-managed`. A Vercel é responsável por criar o deployment a partir da branch `main`; não existe deploy local equivalente.

Comandos declarados para o Dev Dashboard:

```bash
pnpm prod:check
pnpm prod:migrate
pnpm prod:verify
```

`prod:status` permanece disponível para diagnóstico manual. `prod:deploy` permanece intencionalmente recusado e explica que o deploy é gerenciado pelo provider/Git; ele não é declarado em `.dev-dashboard/production.json`.

Políticas:

- backup: `external`, fornecido pelo Neon;
- migrations: `before-deploy`, explícitas e fora de `next build`;
- rollback: `manual-restore`, porque uma revisão anterior de código pode não ser compatível com schema já migrado.

## Variáveis e separação de privilégios

### Runtime Vercel

Somente o ambiente **Production** da Vercel deve receber:

```text
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
AUTH_GITHUB_ALLOWED_ACCOUNT_ID
DATABASE_URL
```

`DATABASE_URL` deve usar o endpoint pooled do Neon. Previews de PR não devem receber esses segredos nem acesso ao banco de produção.

### Check/testes locais e Dev Dashboard

O check automatizado usa somente:

```text
<projeto>/.dev-dashboard/.env.check.local
```

com:

```text
CHECK_DATABASE_URL=<PostgreSQL dedicado a check/testes>
```

`prod:check` exige `CHECK_DATABASE_URL`, promove esse valor para `DATABASE_URL` apenas nos processos filhos do gate e executa, em ordem:

```text
format:check
lint
typecheck
db:migrate
test
build
```

A migration desse fluxo ocorre somente no banco de check, antes da suíte. Depois de `format:check`, `lint` e `typecheck`, o runner verifica se o host/porta do PostgreSQL de check aceita conexão TCP. Quando `CHECK_DATABASE_URL` aponta para o endpoint local do Compose (`localhost`, `127.0.0.1` ou `::1` na porta `5433`) e ele está indisponível, o runner executa `db:up` e aguarda por até 60 segundos antes de seguir para `db:migrate`. Bancos remotos ou endpoints locais em outra porta nunca disparam Docker automaticamente: o runner apenas aguarda a disponibilidade. Em timeout, o erro informa somente host/porta e não inclui usuário, senha, database ou connection string completa. `prod:check` não usa `DATABASE_URL` ou `DATABASE_DIRECT_URL` herdadas como fallback e remove do ambiente filho credenciais de produção/provider que não pertencem ao check.

O banco de check deve ser dedicado, descartável quando possível e não pode conter dados reais. O CI usa PostgreSQL efêmero com o mesmo contrato `CHECK_DATABASE_URL`.

### Operação de produção local / Dev Dashboard

Migration e verify usam somente:

```text
<projeto>/.dev-dashboard/.env.production.local
```

com:

```text
DATABASE_DIRECT_URL=<Neon direct/unpooled URL>
PORTFOLIO_COPILOT_PRODUCTION_READY_URL=https://portfolio-copilot-plum.vercel.app/api/health/ready
```

Os scripts `prod:migrate` e `prod:verify` não carregam `.env.local` automaticamente. No Dev Dashboard, `.env.production.local` é injetado somente nas etapas locais de produção aplicáveis; `provider-deploy` não recebe esse ambiente.

Para operação manual fora do Dev Dashboard, carregue explicitamente o mesmo arquivo sem alterar os scripts canônicos:

```bash
node --env-file=.dev-dashboard/.env.production.local scripts/migrate-production.mjs
node --env-file=.dev-dashboard/.env.production.local scripts/verify-production.mjs
```

`DATABASE_DIRECT_URL` não deve ser configurada na Vercel. O script `prod:migrate` recusa hostnames identificados como pooler para não executar migration no endpoint errado.

Os arquivos `.env.check.local` e `.env.production.local` são locais, ignorados pelo Git e devem permanecer com permissões restritas.

## Health e verify

```text
GET /api/health/live
GET /api/health/ready
```

`/api/health/live` confirma apenas que a aplicação está respondendo e não acessa dependências externas.

`/api/health/ready` executa probe bounded no PostgreSQL. Retorna `200` quando aplicação + banco estão disponíveis e `503` quando a dependência não está pronta. A resposta não expõe connection string, usuário, senha, host interno nem mensagem bruta do driver.

`prod:verify` consulta o readiness canônico com retry bounded. É somente leitura e nunca repete migration ou deploy.

## Evidência do primeiro ambiente

Em 31/08/2026 foram validados manualmente no ambiente real:

1. migration Drizzle de produção aplicada com sucesso por `pnpm prod:migrate` usando conexão direct/unpooled;
2. `GET /api/health/live` retornou HTTP 200;
3. `GET /api/health/ready` retornou HTTP 200 com `dependencies.postgres=ok`;
4. `pnpm prod:verify` confirmou readiness em uma tentativa;
5. login GitHub da conta allowlisted funcionou em produção;
6. snapshot Neon `prod-baseline-2026-08-31` criado na branch `production`;
7. restore **Multi-step** do snapshot executado em nova branch, preservando `production` sem alteração;
8. restore-check no SQL Editor da branch restaurada confirmou as seis tabelas esperadas: `account_owners`, `financial_profiles`, `portfolio_asset_refs`, `portfolios`, `target_allocations` e `transactions`.

O snapshot `prod-baseline-2026-08-31` deve ser mantido como baseline inicial enquanto for compatível com a política/capacidade do plano Neon em uso. A branch temporária criada apenas para restore-check deve ser removida depois da validação.

## Migrations e recuperação

Migrations são versionadas e explícitas. O build da aplicação não altera schema.

Antes de uma migration futura com impacto de schema/dados, confirme a capacidade de recuperação disponível no Neon e crie/atualize um ponto de recuperação apropriado. A política operacional não presume que rollback de código seja suficiente depois de uma migration.

**Não fazer rollback cego.** Se uma execução já aplicou migration ou outra alteração de dados/schema, a recuperação deve considerar conjuntamente:

- revisão implantada;
- schema atual;
- dados atuais;
- snapshot/history disponível no Neon;
- compatibilidade da migration;
- readiness da revisão escolhida.

Restore destrutivo da branch `production` é operação manual deliberada. Para inspeção/restore-check, prefira Multi-step restore em branch isolada.

## Limites da produção pessoal

A ativação deste Production Contract cobre o ambiente **pessoal/privado** com allowlist de uma conta GitHub. Ela não libera automaticamente:

- uso multi-tenant;
- oferta pública a terceiros;
- monetização;
- recomendação individualizada pública;
- qualquer cenário que dependa do Regulatory Gate documentado.

Tenancy/LGPD e Regulatory Gate continuam sendo requisitos antes de ampliar o modelo de uso, mas não impedem a operação privada single-user validada aqui.

## Relação com documentos normativos

Consulte também:

- [`SECURITY.md`](SECURITY.md) para baseline de segurança e operação;
- [`REGULATORY.md`](REGULATORY.md) para a fronteira entre uso pessoal/controlado e produto público;
- [`DATA-SOURCES.md`](DATA-SOURCES.md) para provenance, freshness e licenciamento;
- [`ARCHITECTURE.md`](ARCHITECTURE.md) para fronteiras implementadas;
- [`DECISIONS.md`](DECISIONS.md) e o ADR de production foundation para a topologia vigente;
- [`ROADMAP.md`](ROADMAP.md) e [`tasks/NEXT.md`](tasks/NEXT.md) para prioridade corrente.

## Integração com o Dev Dashboard

O Dev Dashboard deve interpretar este projeto como produção `git-managed` na Vercel. O fluxo não deve executar `prod:deploy` localmente.

Antes da promoção/deploy gerenciado, `prod:check` usa exclusivamente `.dev-dashboard/.env.check.local`; quando a política exigir, `prod:migrate` usa `.dev-dashboard/.env.production.local`. Após a promoção, `prod:verify` usa o mesmo ambiente local de produção para confirmar o readiness canônico. `provider-deploy` não recebe nenhum desses arquivos.

Uma falha somente de verify deve ser tratada como verificável novamente, sem repetir migration/deploy automaticamente.
