# Desenvolvimento

## Contratos operacionais

Este documento define o fluxo geral de engenharia do repositório.

Para agentes de IA, `AGENTS.md` é **obrigatório** e complementa este guia com o padrão esperado de engenharia fullstack sênior, revisão automática completa, segurança, domínio financeiro, UI/UX, banco e supply chain.

Consulte também `docs/DOCUMENTATION-MAP.md` para saber quais documentos são vivos, normativos ou históricos.

## Estratégia de branches

```text
main
  ↑
PR
  ↑
feature/* | bugfix/* | docs/* | refactor/* | test/* | chore/*
```

`main` deve permanecer integrável.

## Fluxo obrigatório por atividade e PR

Nenhum PR deve ser mergeado antes de completar as etapas aplicáveis:

1. ler a issue canônica, `docs/tasks/NEXT.md` e os contratos relevantes;
2. confirmar escopo, critérios de aceite e fora de escopo;
3. criar branch dedicada a partir de `main` atualizada;
4. implementar a menor entrega vertical coerente;
5. adicionar/ajustar testes e edge cases;
6. atualizar documentação viva/normativa afetada;
7. subir o app localmente e validar manualmente o fluxo alterado quando aplicável;
8. executar migration local quando a mudança envolver persistência/schema;
9. executar `pnpm check` no head atual;
10. abrir PR com problema, solução, riscos, teste e docs alteradas;
11. acompanhar o CI do **head atual**;
12. corrigir causa raiz de qualquer falha real;
13. executar auto code review completo em nível sênior sobre o diff integral;
14. aplicar todos os findings relevantes ou registrar adiamento deliberado em issue/backlog;
15. reconciliar `NEXT.md`, `BACKLOG.md`, `DONE.md`, roadmap e issues quando aplicável;
16. executar novamente o quality gate após o **último push**;
17. revisar a diff/changed-file list final e remover qualquer artefato temporário;
18. mergear somente quando CI final estiver verde e o review estiver encerrado sem finding aberto;
19. confirmar o merge e o CI pós-merge de `main` quando disponível;
20. seguir `docs/PRODUCTION.md` para migration/promoção/verify em produção quando aplicável.

### Regra de ouro

```text
app validado localmente
+ pnpm check no head final
+ CI do head final verde
+ auto code review sênior independente
+ findings corrigidos
+ docs/issues coerentes
+ diff final limpa
= elegível para merge
```

Qualquer push novo invalida a checagem final anterior.

## Desenvolvimento local

Baseline de runtime:

- Node.js 24 (`>=24 <25`);
- pnpm `11.24.0`;
- PostgreSQL `18.6-alpine` no ambiente local/CI.

Preparação inicial:

```bash
nvm use
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:up
pnpm db:migrate
```

Subir a aplicação:

```bash
pnpm dev
```

Antes de abrir/atualizar o PR:

```bash
pnpm check
```

`pnpm check` é a interface canônica do quality gate de código e executa:

```text
format:check -> lint -> typecheck -> test -> build
```

Migration fica separada porque depende de estado de banco e deve ser executada explicitamente quando aplicável:

```bash
pnpm db:migrate
```

## Quality gate e CI

O GitHub Actions é a validação preferida porque executa o gate fora da máquina do desenvolvedor.

O job obrigatório de PR prepara o banco e depois consome a mesma interface canônica usada localmente:

```text
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm check
```

Assim, regras de formatação, lint, typecheck, testes e build não ficam duplicadas entre documentação, scripts e workflow.

`pnpm check` não substitui migration validation quando persistência/schema são afetados.

Checks operacionais mais caros devem ser executados quando o risco da mudança justificar, não como custo fixo de todo PR. Mudanças visuais/integradas podem exigir browser/E2E; mudanças de segurança/supply chain podem exigir validações específicas.

### Política de testes e coverage

O objetivo da suíte é detectar regressões materiais, não maximizar contagem de casos ou uma porcentagem global.

Priorize testes para:

- regras financeiras e invariantes de domínio;
- auth/authz, ownership e isolamento;
- persistência, migrations e concorrência;
- contratos de integração;
- regressões reproduzíveis;
- comportamento relevante de UI e acessibilidade.

Evite testes que apenas repetem constantes, nomes, exports triviais ou detalhes incidentais de implementação sem proteger um contrato material. Coverage pode ser usado como diagnóstico quando necessário, mas não é meta percentual de produto nem substitui revisão da qualidade dos cenários.

## Fallback local controlado

Fallback local só é permitido quando o Actions **não consegue iniciar o job** por motivo externo confirmado — por exemplo billing/limite/runner/infra antes de executar qualquer step do projeto.

Nunca usar fallback para esconder falha funcional que o CI realmente encontrou.

```bash
git fetch origin
git switch <branch-do-pr>
git pull --ff-only origin <branch-do-pr>
git rev-parse HEAD
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm check
git status --short
```

Regras:

- validar o SHA exato do head;
- registrar SHA e resultado no PR;
- qualquer push posterior invalida a validação;
- se Actions voltar antes do merge, CI volta a ser a evidência preferida;
- workspace deve terminar sem alteração inesperada.

## Auto code review sênior

CI não substitui review.

A revisão deve cobrir, no mínimo:

- critérios de aceite/correção funcional;
- arquitetura, módulos e dependências;
- simplicidade, coesão e fontes de verdade;
- tipos, invalid states e erros;
- testes e regressões;
- segurança, auth/authz, ownership, secrets e logs;
- supply chain, lockfile e lifecycle scripts;
- compatibilidade/runtime/desempenho material;
- documentação e rastreabilidade;
- escopo e dívidas descobertas.

Para agentes de IA, o checklist completo e os gates específicos estão em `AGENTS.md`.

### Review financeiro

Toda mudança de cálculo deve responder:

- qual fórmula mudou?
- qual unidade/moeda/escala?
- qual arredondamento?
- quais invariantes/reconciliações?
- há impacto em snapshots históricos?
- há risco de look-ahead?
- há migration/version bump de metodologia?

### Review de segurança

Perguntas mínimas:

- amplia acesso a dados?
- adiciona input/fonte externa?
- adiciona segredo?
- altera auth/authz/ownership?
- pode vazar PII/dado financeiro em log/telemetria?
- adiciona integração/dependência/lifecycle script?
- exige exceção de supply chain?

## Gate para mudanças visuais

Durante a iniciativa #69 e para surfaces futuras relevantes:

- seguir Protótipo 3 + R1;
- consumir semantic tokens e `@/components/ui` quando houver primitive canônica;
- usar AppShell nas superfícies protegidas, salvo focused auth;
- não criar rota/KPI/dado/capability fictícia;
- cobrir estados empty/missing/stale/error/loading/disabled aplicáveis;
- revisar teclado, foco, landmarks, labels/accessible names, contraste e touch targets;
- considerar desktop/tablet/mobile;
- R9 fará o browser QA/fidelity gate final, mas PRs anteriores não podem introduzir regressões conhecidas.

## Pull request

O template em `.github/pull_request_template.md` é o mínimo operacional.

Todo PR não-trivial deve explicar:

- contexto/problema;
- solução e decisões importantes;
- fora de escopo;
- como testar;
- riscos/segurança;
- documentação/issues atualizadas;
- auto code review sênior e findings;
- SHA exato do head final e resultado do quality gate.

## Arquivos gerados localmente

Não versionar artefatos locais não intencionais:

- `*.tsbuildinfo`;
- `next-env.d.ts`;
- `.next/`;
- `dist/`;
- `coverage/`;
- backups/debug files como `*.bak`.

Antes de finalizar um PR, a changed-file list deve conter somente arquivos intencionais.

## Convenções de commit

Preferir Conventional Commits:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

## Definition of Done

Uma atividade só está concluída quando:

- critérios de aceite atendidos;
- implementação está na camada correta;
- app/fluxo alterado foi validado localmente quando aplicável;
- testes/edge cases adequados existem e passam;
- migrations validadas quando aplicável;
- `pnpm check` do commit final passa;
- CI/quality gate do commit final está verde;
- segurança/privacy foram revisadas;
- mudanças financeiras tiveram review de invariantes;
- UI teve review de acessibilidade/responsividade quando aplicável;
- dependências/supply chain foram revisadas;
- auto code review sênior foi concluído;
- findings foram corrigidos ou explicitamente rastreados;
- docs/ADRs/issues relevantes estão coerentes;
- `NEXT.md`/`BACKLOG.md`/`DONE.md` estão coerentes quando afetados;
- diff final está sem artefatos temporários;
- PR body reflete a implementação final e o SHA validado;
- merge ocorre somente depois de todos os itens acima.

## Handoff obrigatório após merge

A entrega deve informar, conforme aplicável:

- PR/commit mergeado;
- resumo do que entrou;
- comandos para atualizar `main`;
- instalação/migrations/configuração necessárias;
- comando para executar o app;
- quality gate local;
- variáveis de ambiente novas/alteradas;
- passos manuais ou compatibilidade relevante;
- próxima atividade canônica quando houver.

Exemplo base:

```bash
git checkout main
git pull --ff-only origin main
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm check
pnpm dev
```

Para produção, o procedimento canônico está em [`docs/PRODUCTION.md`](PRODUCTION.md).
