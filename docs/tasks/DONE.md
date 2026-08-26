# Done

Histórico resumido de atividades concluídas.

## 2026-08-26 — Fundação documental

- visão, produto e Project Brief;
- arquitetura e ADRs iniciais;
- metodologia e política de investimentos;
- segurança, dados e regulatório;
- roadmap, backlog e processo de trabalho.

## 2026-08-26 — Fundação técnica

- pnpm workspace/monorepo;
- `apps/web` com Next.js e rota `/health`;
- `packages/domain` e `packages/shared`;
- Node.js 24 Active LTS, TypeScript 6.0.3 strict e ESLint 9.39.5 em combinação compatível;
- `.nvmrc` e `engines` para evitar drift involuntário de major do Node;
- Prettier e Vitest com testes iniciais;
- scripts raiz de quality gate;
- CI GitHub Actions com permissões mínimas e Actions pinadas por SHA;
- políticas de supply chain do pnpm com exceções estreitas e documentadas;
- `.env.example` e `.gitignore` seguros;
- ADR da stack técnica;
- fluxo obrigatório de PR formalizado: acompanhar CI, auto review sênior, corrigir findings, atualizar docs, validar o head final e só então mergear;
- handoff pós-merge documentado com comandos locais obrigatórios.
