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
- TypeScript strict;
- ESLint com configuração do Next;
- Prettier;
- Vitest;
- GitHub Actions como quality gate.

Não adotar Turborepo nesta fase: os workspaces ainda são poucos e os scripts recursivos do pnpm cobrem a necessidade sem uma camada adicional.

## Consequências

- `apps/web` pode concentrar UI e API inicialmente;
- `packages/domain` permanece livre de framework;
- `packages/shared` contém somente elementos realmente compartilhados;
- banco, autenticação, providers externos e deploy ficam explicitamente fora desta decisão;
- upgrades de dependências devem preservar `pnpm check` verde e considerar advisories de segurança.

## Segurança

O CI usa `permissions: contents: read`, não recebe secrets neste milestone e instala dependências por lockfile congelado.
