# Auth e sessão — focused auth

## Status

Implementação do R4 da iniciativa #69, issue #76.

Esta superfície aplica o contrato `focused auth` definido no R1 usando exclusivamente os tokens e primitives do R2. Auth permanece deliberadamente fora do `AppShell`: entrar, sair e recuperar acesso são tarefas focadas e não precisam de sidebar.

## Ownership

- `apps/web/src/app/sign-in/page.tsx` — resolve sessão/callback e dispara GitHub OAuth;
- `apps/web/src/app/sign-out/page.tsx` — resolve identidade e encerra sessão;
- `apps/web/src/components/auth-surface.tsx` — composição compartilhada e estados visuais;
- `apps/web/src/components/auth-submit-button.tsx` — única ilha client do auth, responsável apenas por `pending` do form;
- `apps/web/src/components/auth-surface.module.css` — anatomy da superfície, sem primitives ou paleta paralela.

`auth.ts`, `proxy.ts`, `identity.ts`, canonical identity e ownership não são alterados pelo R4.

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
- desktop usa composição centralizada;
- mobile preserva uma coluna e reduz somente a escala do título/espaçamento externo;
- não existe navegação ou chrome alternativo de produto no auth.

## Segurança preservada

O R4 não modifica:

- provider GitHub;
- estratégia JWT;
- tempo máximo da sessão;
- callback/redirect validation;
- canonical identity subject;
- ownership de dados persistidos;
- proxy de rotas protegidas;
- contratos de persistência financeira.

## Validação

Os testes do R4 verificam:

- uma única ação de login;
- ausência de `/health` e badges/eyebrows antigos;
- progressive disclosure de privacidade;
- erro seguro;
- copy de reentrada;
- saída com contexto mínimo e cancelamento claro;
- CSS sem paleta auth paralela;
- consumo dos semantic tokens/focus/touch-target do R2.

O CI canônico continua responsável por format, lint, typecheck, migrations, fallback de `.env.local`, tests e build.
