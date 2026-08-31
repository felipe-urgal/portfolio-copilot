# ADR-0028 — Produção pessoal em Vercel + Neon com gate fail-closed

## Status

Aceita.

## Contexto

O Portfolio Copilot já possui autenticação GitHub, persistência PostgreSQL e um Production Contract fail-closed. A primeira exposição fora do ambiente local será de uso pessoal/privado e manipula dados financeiros de alta sensibilidade.

Habilitar deploy apenas porque Vercel e PostgreSQL estão disponíveis criaria uma fronteira insegura: qualquer conta aceita pelo OAuth poderia autenticar, migrations poderiam ser misturadas ao build e readiness não distinguiria processo vivo de banco disponível.

## Decisão

A primeira topologia de produção será:

- Vercel para a aplicação Next.js, promovida pela branch `main`;
- Neon PostgreSQL 18 para persistência;
- conexão pooled em `DATABASE_URL` para runtime;
- conexão direct/unpooled em `DATABASE_DIRECT_URL` para migrations explícitas;
- Auth.js + GitHub OAuth, com `AUTH_GITHUB_ALLOWED_ACCOUNT_ID` obrigatório e fail-closed quando `NODE_ENV=production`;
- liveness em `/api/health/live` sem dependências externas;
- readiness em `/api/health/ready` com probe bounded do PostgreSQL e sem detalhe sensível;
- `prod:migrate` separado do build/deploy;
- `prod:verify` somente leitura e com retry bounded;
- `production.enabled=false` até o primeiro ambiente real, backup/restore e demais gates aplicáveis terem sido validados.

Neon Auth não será introduzido nesta fase; Auth.js continua sendo a fonte de verdade de autenticação.

## Consequências

### Positivas

- produção pessoal não amplia o conjunto de usuários autorizados por acidente;
- deploy/build não altera schema implicitamente;
- runtime serverless usa pooling enquanto migrations usam uma conexão adequada à operação;
- health permite distinguir aplicação viva de dependência pronta;
- o Dev Dashboard continua fail-closed até existir evidência operacional real;
- o Regulatory Gate para produto público/monetizado não é enfraquecido.

### Custos

- existem duas connection strings para o mesmo banco e elas precisam ser geridas corretamente no secret store;
- migrations exigem uma etapa operacional explícita;
- preview environments sem a allowlist configurada não permitem login, por desenho seguro;
- backup/restore, observabilidade/SLO e ativação do Production Contract permanecem trabalho posterior.

## Regras

- nunca versionar connection strings, OAuth secrets ou `AUTH_SECRET`;
- nunca executar migration dentro de `next build`;
- nunca logar URL de banco nem erro bruto que possa carregar credenciais;
- não habilitar `production.enabled=true` no mesmo passo em que a fundação é criada;
- produto público, terceiros ou monetização continuam sujeitos a `docs/REGULATORY.md`.

## Referências

- issue #97;
- `docs/PRODUCTION.md`;
- `docs/SECURITY.md`;
- `docs/REGULATORY.md`;
- ADR-0020 (Auth.js/GitHub);
- ADR-0021 (PostgreSQL/ownership).
