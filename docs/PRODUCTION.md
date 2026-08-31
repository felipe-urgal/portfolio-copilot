# Produção e readiness operacional

## Estado atual

A produção está **deliberadamente desabilitada** no contrato consumível por automação:

```text
.dev-dashboard/production.json
production.enabled=false
reasonCode=production-readiness-gate
```

Isso não significa que o projeto não possua build, PostgreSQL, migrations, autenticação ou health. Significa que essas fundações ainda não formam, por si só, um contrato de produção habilitado para deploy automático.

A primeira topologia alvo é de **uso pessoal/privado**:

- aplicação: Vercel, branch `main`;
- banco: Neon PostgreSQL 18, branch `production`;
- runtime: `DATABASE_URL` com conexão pooled;
- migrations: `DATABASE_DIRECT_URL` com conexão direct/unpooled;
- autenticação: Auth.js + GitHub OAuth com uma única conta explicitamente allowlisted em produção;
- exposição pública/monetização: continua fora de escopo até o Regulatory Gate aplicável ser concluído.

Nenhum segredo, URL de banco ou OAuth secret é versionado.

## Comandos padronizados

```bash
pnpm prod:status
pnpm prod:check
pnpm prod:migrate
pnpm prod:deploy
pnpm prod:verify
```

- `prod:status` informa de forma não mutável que o gate de deploy permanece fechado;
- `prod:check` reutiliza o quality gate atual do repositório;
- `prod:migrate` exige `DATABASE_DIRECT_URL` e executa as migrations Drizzle explicitamente fora do build;
- `prod:deploy` continua falhando com exit code não-zero enquanto `production.enabled=false`;
- `prod:verify` consulta somente o readiness canônico, com retry bounded e sem repetir migration/deploy.

Não existe bypass por variável de ambiente ou feature flag para `prod:deploy`. Habilitar produção exige mudança explícita do contrato após um primeiro deploy real ter sido validado.

## Variáveis de ambiente

Produção exige, no mínimo:

```text
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
AUTH_GITHUB_ALLOWED_ACCOUNT_ID
DATABASE_URL
DATABASE_DIRECT_URL
PORTFOLIO_COPILOT_PRODUCTION_READY_URL
```

### Auth

`AUTH_GITHUB_ALLOWED_ACCOUNT_ID` é o ID numérico da única conta GitHub permitida na primeira produção pessoal. Em `NODE_ENV=production`, ausência, formato inválido, provider inesperado ou account id diferente falham fechado. Desenvolvimento local não exige essa allowlist.

### PostgreSQL

`DATABASE_URL` é usada pelo runtime da aplicação e deve apontar para a conexão pooled do Neon.

`DATABASE_DIRECT_URL` é usada apenas por `prod:migrate` e deve apontar para a conexão direct/unpooled. O script recusa hostnames identificados como pooler para evitar executar migrations pelo endpoint errado.

### Readiness

`PORTFOLIO_COPILOT_PRODUCTION_READY_URL` deve ser HTTPS, sem credenciais embutidas, e apontar para:

```text
https://<dominio-canônico>/api/health/ready
```

Parâmetros opcionais de operação:

```text
PORTFOLIO_COPILOT_VERIFY_TIMEOUT_MS
PORTFOLIO_COPILOT_VERIFY_INTERVAL_MS
PORTFOLIO_COPILOT_VERIFY_REQUEST_TIMEOUT_MS
```

Overrides malformados não são parcialmente aceitos; o verify volta aos defaults seguros.

## Health operacional

Dois endpoints têm semânticas diferentes:

```text
GET /api/health/live
GET /api/health/ready
```

`/api/health/live` confirma apenas que a aplicação está respondendo e não acessa dependências externas.

`/api/health/ready` executa um probe bounded no PostgreSQL. Retorna `200` quando aplicação + banco estão disponíveis e `503` quando a dependência não está pronta. A resposta não expõe connection string, usuário, senha, host interno nem mensagem bruta do driver.

`prod:verify` pode repetir o readiness por uma janela curta porque Vercel/compute/banco podem precisar de alguns segundos para aquecer. O retry é somente leitura e nunca chama `prod:migrate` ou `prod:deploy`.

## Ordem do primeiro deploy

O primeiro deploy real deve seguir esta ordem:

1. criar o projeto Neon e guardar pooled/direct URLs fora do repositório;
2. gerar `AUTH_SECRET` e obter o GitHub account id permitido;
3. mergear a foundation de produção com auth allowlist, health, migration e verify;
4. criar/importar o projeto Vercel a partir de `felipe-urgal/portfolio-copilot`;
5. configurar os segredos/variáveis somente no ambiente apropriado;
6. criar/configurar o GitHub OAuth App com callback canônico da Vercel;
7. executar `pnpm prod:migrate` explicitamente usando `DATABASE_DIRECT_URL`;
8. validar `/api/health/live` e `/api/health/ready`;
9. validar login da conta permitida e recusa de uma conta não autorizada;
10. somente depois abrir PR separado para mudar o Production Contract para `git-managed`/Vercel e `production.enabled=true`.

Não executar migrations automaticamente em `next build`.

## Gates antes de habilitar produção

O manifesto continua registrando como bloqueadores, no mínimo:

- segurança operacional de produção;
- backup/restore e disaster recovery testados;
- observabilidade e SLOs aplicáveis;
- tenancy/LGPD para o modelo de uso pretendido;
- Regulatory Gate antes de recomendação individualizada pública, monetização ou prestação equivalente a terceiros.

Para produção **privada/pessoal**, o enquadramento regulatório público pode ter escopo diferente, mas segurança, backup/DR e operação continuam obrigatórios e precisam ser definidos explicitamente antes de mudar `production.enabled`.

## Backup, migrations e recuperação

As migrations são versionadas e explícitas. O build da aplicação não altera schema.

A política de backup/restore permanece `not-configured` no Production Contract até a capacidade real do ambiente Neon ser documentada e testada. O contrato não será marcado como pronto apenas porque o provider oferece recuperação: precisamos registrar janela, operação e evidência de restore-check compatíveis com o plano usado.

Não fazer rollback cego de código quando uma migration já tiver sido aplicada. Recuperação deve considerar revisão implantada, schema, dados, backup/checkpoint e compatibilidade da migration.

## Relação com documentos normativos

Este documento não redefine regras já existentes. Consulte:

- [`SECURITY.md`](SECURITY.md) para baseline de segurança e operação;
- [`REGULATORY.md`](REGULATORY.md) para a fronteira entre uso pessoal/controlado e produto público;
- [`DATA-SOURCES.md`](DATA-SOURCES.md) para provenance, freshness e licenciamento;
- [`ARCHITECTURE.md`](ARCHITECTURE.md) para fronteiras implementadas;
- [`DECISIONS.md`](DECISIONS.md) e o ADR de production foundation para a topologia vigente;
- [`ROADMAP.md`](ROADMAP.md) e [`tasks/NEXT.md`](tasks/NEXT.md) para prioridade corrente.

## Integração com o Dev Dashboard

Enquanto `production.enabled=false`, o Dev Dashboard deve interpretar este projeto como **produção bloqueada**, não como serviço parado nem como falha de health. `prod:deploy` não deve ser executado automaticamente.

Após validação real do primeiro ambiente, um PR separado deverá definir provider/strategy/external project/health e políticas operacionais concretas, removendo somente os blockers realmente resolvidos.
