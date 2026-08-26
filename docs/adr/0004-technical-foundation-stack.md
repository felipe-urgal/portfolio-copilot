# ADR-0004 — Stack da fundação técnica

## Status

Aceita em 26/08/2026.

## Contexto

O projeto precisa de uma base web simples, testável e evolutiva para o Portfolio Engine, sem antecipar microserviços, banco, autenticação, IA ou infraestrutura de produção.

## Decisão

Adotar:

- monorepo com pnpm workspaces;
- Node.js 24 Active LTS como baseline de desenvolvimento/CI;
- Next.js 16.3.3 (Active LTS e patch de segurança de agosto/2026);
- React 19.2.x;
- TypeScript 6.0.3 strict;
- ESLint com configuração do Next;
- Prettier;
- Vitest;
- GitHub Actions como quality gate.

TypeScript 7.0.2 é o `latest`, porém o `typescript-eslint` usado pelo `eslint-config-next` ainda rejeita TS 7. Para manter lint oficial, typecheck e framework em uma combinação suportada, a fundação fica em TypeScript 6.0.3 até o toolchain declarar suporte a TS 7. O upgrade deverá ser feito em PR próprio com CI completo.

Não adotar Turborepo nesta fase: os workspaces ainda são poucos e os scripts recursivos do pnpm cobrem a necessidade sem uma camada adicional.

## Supply chain

O pnpm 11 mantém por padrão uma janela mínima de 24 horas para releases recém-publicados. O Next.js 16.3.3 foi publicado em 25/08/2026 como atualização de segurança e foi explicitamente selecionado para esta fundação antes de completar a janela.

Por isso, `pnpm-workspace.yaml` contém exceções **por pacote e versão exatos** somente para o grafo `16.3.3` do Next que o CI identificou. A proteção global permanece ativa. `minimumReleaseAgeExcludePrune` remove exceções obsoletas em futuras alterações de dependências.

O pnpm 11 também rejeita por padrão scripts de build não revisados. `unrs-resolver@1.12.2`, dependência transitiva do tooling de resolução/lint, possui um `postinstall` para preparar/verificar seu binding nativo e foi revisado antes de entrar em `allowBuilds`. A permissão é limitada à versão exata; qualquer novo pacote ou nova versão com lifecycle script volta a falhar no CI até revisão explícita.

Não usar `trustLockfile: true`, `dangerouslyAllowAllBuilds` nem desabilitar globalmente as políticas para contornar CI.

## Consequências

- `apps/web` pode concentrar UI e API inicialmente;
- `packages/domain` permanece livre de framework;
- `packages/shared` contém somente elementos realmente compartilhados;
- banco, autenticação, providers externos e deploy ficam explicitamente fora desta decisão;
- upgrades de dependências devem preservar `pnpm check` verde e considerar advisories de segurança.

## Segurança

O CI usa `permissions: contents: read`, não recebe secrets neste milestone, usa Actions oficiais em runtime Node 24 e instala dependências por lockfile congelado.
