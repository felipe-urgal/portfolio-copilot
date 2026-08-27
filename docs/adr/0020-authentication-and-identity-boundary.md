# ADR-0020 — Autenticação server-side e fronteira de identidade

**Status:** Aceita

## Contexto

O MVP já possui superfícies de produto funcionais e um `FinancialProfileSnapshot` que pode permanecer somente em memória ou ser salvo localmente mediante opt-in. Esse dado financeiro local não possui ownership persistido no servidor e não deve ser promovido implicitamente a dado de conta.

A próxima etapa exige estabelecer quem está usando a aplicação, criar uma sessão autenticada verificável no servidor e proteger as superfícies de produto sem introduzir armazenamento próprio de senhas, sessão client-only ou autorização fictícia por recursos que ainda não existem no backend.

## Decisão

Usar Auth.js v5 (`next-auth@5.0.0-beta.32`) integrado ao Next.js atual, inicialmente com GitHub OAuth como provedor de identidade.

A implementação adota:

- OAuth externo: o produto não recebe nem persiste senha do usuário;
- sessão Auth.js com estratégia JWT, cifrada pelo mecanismo mantido da biblioteca e limitada inicialmente a 8 horas;
- `AUTH_SECRET` distinto por ambiente e credenciais OAuth somente por variáveis de ambiente;
- cookies padrão do Auth.js, preservando `HttpOnly`, `SameSite=Lax` e `Secure` quando a origem usa HTTPS, sem reimplementar política manual de cookies;
- identidade canônica mínima no formato interno `provider:providerAccountId`, separada de `FinancialProfileId`, `PortfolioId`, `AssetId` e demais IDs financeiros;
- exposição ao shell apenas de nome de exibição e, quando necessário, e-mail; o subject interno não é informação primária de UI;
- proteção antecipada em `proxy.ts` para `/dashboard`, `/portfolio` e `/onboarding`;
- segunda verificação server-side nas páginas protegidas, para que acesso não dependa somente de redirect no cliente ou do proxy;
- validação positiva de `auth.user.id`, em vez de verificar apenas se o objeto `auth` é truthy;
- `/health` fora da fronteira autenticada e sem dependência do contexto financeiro;
- callbacks de retorno limitados a caminhos internos protegidos para evitar open redirect;
- logout que encerra somente a sessão autenticada e não remove automaticamente o perfil financeiro persistido localmente.

O `FinancialSessionProvider` e o adapter de `localStorage` permanecem independentes da identidade autenticada. Nesta etapa não existe cópia, upload, associação, sincronização ou ownership server-side do `FinancialProfileSnapshot`.

## Por que Auth.js

Auth.js é uma solução mantida e específica para autenticação em aplicações Next.js, com integração server-side para App Router, OAuth, sessão e proteção de rotas. A versão `5.0.0-beta.32` foi escolhida porque contém correções de segurança publicadas para versões beta anteriores, inclusive para cenários em que uma configuração inválida podia tornar verificações baseadas apenas na existência de `auth` fail-open.

A versão permanece beta; por isso a dependência é fixada exatamente, o lockfile é obrigatório e upgrades exigem revisão de changelog/advisories e execução integral do quality gate.

## Consequências

### Positivas

- senha não entra na aplicação;
- sessão e cookies ficam sob uma implementação mantida em vez de criptografia/token customizado;
- proteção de acesso ocorre no servidor;
- identidade passa a ter fronteira própria, sem contaminar IDs de domínio financeiro;
- o fluxo atual de persistência financeira local continua funcionando de forma independente;
- GitHub OAuth reduz a quantidade de infraestrutura necessária para estabelecer identidade real no MVP.

### Limitações e riscos aceitos

- Auth.js v5 ainda está em beta e precisa de acompanhamento de advisories;
- GitHub é o único provedor inicial; não representa estratégia definitiva de identidade pública;
- não existe banco de usuários/contas nesta etapa, portanto a identidade canônica vive no contexto da sessão e não concede ownership persistido;
- revogar acesso no provedor não substitui política futura de sessão, conta, auditoria e MFA;
- ambientes precisam configurar corretamente secret e OAuth App; configuração ausente deve falhar de forma explícita e nunca ser tratada como usuário autenticado.

## Fora de escopo

- persistência server-side de dados financeiros;
- migração de `localStorage` para uma conta;
- sincronização entre dispositivos;
- autorização granular por Portfolio ou outro recurso;
- banco de usuários, adapter Auth.js ou lifecycle de conta;
- MFA obrigatório, billing, papéis administrativos e recuperação de conta customizada;
- Market Data, IA ou nova lógica financeira.

## Segurança operacional

- nunca registrar token, cookie, secret ou conteúdo do perfil financeiro em logs;
- `AUTH_SECRET`, `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET` nunca entram no repositório;
- produção deve operar em HTTPS para ativar cookies `Secure`;
- qualquer upgrade de Auth.js deve revisar advisories e manter a validação positiva da identidade;
- autorização futura deve checar ownership persistido explicitamente e não inferi-lo apenas da existência de sessão.

## Relações

- implementa a fronteira `identity` prevista em `docs/ARCHITECTURE.md`;
- atende requisitos de autenticação e cookies de `docs/SECURITY.md`;
- preserva integralmente o ADR-0019: persistência financeira local continua opt-in e não é migrada para a conta;
- não altera D-009: PostgreSQL continua sendo a direção futura de persistência server-side.
