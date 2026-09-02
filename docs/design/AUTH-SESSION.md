# Auth e sessão — focused auth

## Status

Implementação do R4 da iniciativa #69, issue #76, com hardening incremental de acessibilidade no R9 / #81.

Esta superfície aplica o contrato `focused auth` definido no R1 usando exclusivamente os tokens e primitives do R2. Auth permanece deliberadamente fora do `AppShell`: entrar, sair e recuperar acesso são tarefas focadas e não precisam de sidebar.

## Ownership

- `apps/web/src/app/sign-in/page.tsx` — resolve sessão/callback e dispara GitHub OAuth;
- `apps/web/src/app/sign-out/page.tsx` — resolve identidade e encerra sessão;
- `apps/web/src/components/auth-surface.tsx` — composição compartilhada e estados visuais;
- `apps/web/src/components/auth-submit-button.tsx` — única ilha client do auth, responsável apenas por `pending` do form;
- `apps/web/src/components/auth-surface.module.css` — anatomy da superfície, sem primitives ou paleta paralela.

`auth.ts`, `proxy.ts`, `identity.ts`, canonical identity e ownership não foram alterados pelo R4. Evoluções operacionais posteriores permanecem documentadas abaixo sem reescrever o histórico do redesign.

## Sign-in

A ordem visual é intencionalmente curta:

1. brand;
2. título e contexto breve;
3. erro seguro, quando existir;
4. uma única ação primária: `Entrar com GitHub`;
5. `Privacidade e segurança` em disclosure secundário.

`/health` não aparece como CTA concorrente. Badges decorativos de segurança, detalhes de cookies/tokens e avisos repetidos de persistência local também não fazem parte da primeira hierarquia.

Quando o proxy envia `callbackUrl`, a tela assume postura de reentrada: explica que uma sessão ativa é necessária sem afirmar causa específica nem expor detalhes internos. O callback continua passando por `resolveSafeCallbackPath` antes do OAuth.

## Loading e erro

O form continua usando Server Action. O botão submit é a única ilha client e usa `useFormStatus` para alimentar `loading`/`disabled` da primitive `Button`.

Erros de autenticação usam a primitive `Alert` com mensagem deliberadamente genérica. A UI não mostra token, cookie, stack, provider payload ou razão interna da falha.

## Privacidade e segurança

O disclosure de sign-in preserva três informações de confiança:

- o Portfolio Copilot não recebe a senha do GitHub;
- perfil financeiro local e autenticação permanecem separados;
- a sessão pode exigir nova autenticação após expirar.

Esses pontos ficam acessíveis por teclado via `<details>/<summary>` nativo sem disputar a ação principal.

## Sign-out

A saída mantém composição calma:

- contexto da conta limitado ao `displayName` necessário para confirmação;
- uma ação primária inequívoca para encerrar a sessão;
- retorno simples ao Dashboard;
- efeitos da saída em disclosure secundário.

Email, subject canônico e detalhes internos não são necessários para confirmar a ação e não aparecem nessa superfície.

Sair encerra a sessão autenticada no navegador e não apaga o perfil financeiro salvo localmente.

## Design system e responsividade

- `Surface`, `Container`, `Stack`, `Alert`, `Button` e `LinkButton` vêm de `@/components/ui`;
- cores e focus usam semantic tokens do R2;
- translucência decorativa é derivada dos tokens com `color-mix`;
- touch target do disclosure usa `--touch-target-min`;
- a brand navegável também preserva `--touch-target-min` (44px), enquanto o glyph continua visualmente compacto em `--control-height-sm`;
- desktop usa composição centralizada;
- mobile preserva uma coluna e reduz somente a escala do título/espaçamento externo;
- não existe navegação ou chrome alternativo de produto no auth.

## Segurança preservada pelo R4

O R4 não modificou:

- provider GitHub;
- estratégia JWT;
- tempo máximo da sessão;
- callback/redirect validation;
- canonical identity subject;
- ownership de dados persistidos;
- proxy de rotas protegidas;
- contratos de persistência financeira.

## Evolução de produção pessoal — #97 / ADR-0028

A production foundation adiciona uma restrição operacional sem alterar a UI focused auth, identidade canônica ou ownership:

- GitHub continua sendo o único provider;
- quando `NODE_ENV=production`, `AUTH_GITHUB_ALLOWED_ACCOUNT_ID` é obrigatório por comportamento;
- o callback `signIn` aceita somente `provider=github` e `providerAccountId` exatamente igual ao ID numérico allowlisted;
- allowlist ausente, malformada, provider inesperado ou conta diferente falham fechado;
- desenvolvimento local continua sem exigir allowlist;
- previews que executem com `NODE_ENV=production` também falham fechado se a variável não for configurada, evitando exposição acidental.

A UI continua mostrando erro genérico. O account id esperado, provider payload e razão interna da recusa não são exibidos ao usuário nem registrados como diagnóstico de produto.

Em 31/08/2026, #99 / PR #100 validou esse contrato no ambiente Vercel real e ativou o Production Contract pessoal. Essa ativação não mudou a composição visual, o provider, a canonical identity nem o ownership; somente confirmou operacionalmente a fronteira fail-closed já definida em #97/ADR-0028.

## Validação

Os testes do R4/R9 verificam:

- uma única ação de login;
- ausência de `/health` e badges/eyebrows antigos;
- progressive disclosure de privacidade;
- erro seguro;
- copy de reentrada;
- saída com contexto mínimo e cancelamento claro;
- CSS sem paleta auth paralela;
- consumo dos semantic tokens/focus/touch-target do R2;
- brand navegável com área mínima de 44px sem aumentar o glyph visual de 36px.

A production foundation acrescenta regressões para allowlist fail-closed em produção sem alterar os testes de composição visual.

O CI canônico continua responsável por format, lint, typecheck, migrations, fallback de `.env.local`, tests e build.
