# Desenvolvimento

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

Este fluxo é uma regra do projeto. Nenhum PR deve ser mergeado antes de completar todas as etapas aplicáveis.

1. ler `docs/tasks/NEXT.md` e os documentos canônicos relacionados;
2. confirmar escopo, critérios de aceite e fora de escopo;
3. criar uma branch dedicada;
4. implementar a menor entrega vertical coerente;
5. criar/atualizar testes e tratar edge cases;
6. atualizar os `.md` afetados pela implementação, decisões ou novos aprendizados;
7. abrir o PR com problema, solução, riscos, como testar e documentação alterada;
8. acompanhar o CI do **head atual do PR** até conclusão quando o GitHub Actions puder executar;
9. se qualquer job funcional falhar, ler o log, corrigir a causa raiz e acompanhar o novo quality gate;
10. executar auto code review completo em nível sênior sobre o diff integral;
11. revisar arquitetura, legibilidade, coesão, acoplamento, tipos, erros, testes, segurança, supply chain, desempenho e aderência ao escopo;
12. para mudanças financeiras, revisar fórmulas, unidades, precisão, arredondamento, invariantes e auditabilidade;
13. aplicar todos os ajustes encontrados no auto review;
14. atualizar novamente documentação, ADRs, `NEXT.md`, `DONE.md` e backlog quando o review alterar decisões ou escopo;
15. executar novamente o quality gate após o **último push**; resultado verde antigo não vale para um head novo;
16. fazer uma checagem final do diff e confirmar que não há findings pendentes nem arquivos temporários;
17. mergear somente quando o quality gate do head final estiver integralmente verde e o review estiver encerrado sem findings abertos;
18. confirmar o merge em `main`;
19. entregar ao usuário os comandos exatos para sincronizar o repositório e rodar/validar localmente;
20. usar o `NEXT.md` já promovido para iniciar a próxima atividade somente depois do fechamento correto da atual.

### Regra de ouro

```text
quality gate verde + auto review sênior + findings corrigidos + docs atualizados + diff final revisado = elegível para merge
```

Qualquer push novo invalida a checagem final anterior e exige validar novamente o novo head.

## Quality gate: CI preferido e fallback local controlado

O GitHub Actions continua sendo o caminho preferido porque fornece validação reproduzível fora da máquina do desenvolvedor.

Quando o Actions **não consegue iniciar o job** por motivo externo confirmado, como billing/limite de minutos ou indisponibilidade de infraestrutura antes de qualquer step, é permitido usar fallback local temporário. Esse fallback não pode ser usado para esconder ou contornar um erro funcional que o CI realmente executou e encontrou.

O fallback local obrigatório é:

```bash
git fetch origin
git switch <branch-do-pr>
git pull --ff-only origin <branch-do-pr>
git rev-parse HEAD
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm check
git status --short
```

Regras do fallback:

- validar exatamente o SHA atual do head do PR;
- registrar esse SHA na descrição/comentário do PR;
- registrar que `install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `test` e `build` passaram;
- `git status --short` não pode revelar artefatos ou alterações inesperadas;
- qualquer push posterior invalida a validação local anterior;
- se o Actions voltar a executar normalmente antes do merge, o CI volta a ser a evidência preferida;
- falha real de lint, typecheck, teste ou build deve ser corrigida no PR, nunca ignorada por causa do fallback.

## Handoff obrigatório após merge

Depois de cada merge, a resposta de entrega deve conter, conforme aplicável:

- confirmação do PR e commit mergeado;
- resumo objetivo do que entrou;
- comandos para atualizar a `main` local;
- comandos de instalação/migração/configuração necessários;
- comando para executar o app;
- comando do quality gate local;
- variáveis de ambiente novas ou alteradas;
- observações de compatibilidade ou passos manuais, se existirem.

Exemplo base, adaptado a cada PR:

```bash
git checkout main
git pull --ff-only origin main
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Nunca fornecer comandos genéricos se o PR exigir passos específicos adicionais.

## Arquivos gerados localmente

Alguns comandos do Next.js e do TypeScript geram arquivos no workspace local. Eles devem ser tratados de forma explícita para não poluir commits:

- `*.tsbuildinfo`: cache do modo incremental do TypeScript. É artefato local, não deve ser versionado e está coberto pelo `.gitignore`;
- `next-env.d.ts`: arquivo gerado automaticamente pelo Next.js durante `next dev`, `next build` e `next typegen`. Conforme a recomendação atual do Next.js, não deve ser versionado; permanece referenciado no `include` do `tsconfig.json` e está coberto pelo `.gitignore`;
- `.next/`, `dist/` e `coverage/`: artefatos de build/teste locais e não versionados.

Antes de abrir ou finalizar um PR, `git status` deve estar livre de artefatos locais não intencionais.

## Definition of Done

Uma atividade só está concluída quando:

- critérios de aceite atendidos;
- testes adequados existem e passam;
- format, lint, typecheck, testes e build passam no quality gate do commit final;
- CI é usado quando disponível; fallback local só é aceito nas condições externas documentadas acima;
- SHA exato validado fica registrado quando houver fallback local;
- erros e edge cases tratados;
- sem segredo/PII em código/log;
- mudanças de domínio documentadas;
- mudanças financeiras têm testes de invariantes;
- mudanças de fonte externa têm contract/validation tests;
- supply chain e novas dependências revisadas;
- auto code review sênior concluído;
- findings do review corrigidos ou explicitamente justificados;
- documentação afetada atualizada;
- `NEXT.md`/`DONE.md` coerentes com o estado após merge;
- diff final revisado;
- PR mergeado somente após todos os itens anteriores.

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

## Pull request

Descrição mínima:

- problema;
- solução;
- fora de escopo;
- como testar;
- riscos;
- documentação atualizada;
- checklist.

O template em `.github/pull_request_template.md` é o checklist operacional mínimo. Ele não substitui a análise do diff.

## Auto code review sênior

A revisão deve considerar, no mínimo:

- correção funcional e critérios de aceite;
- desenho de módulos, fronteiras e dependências;
- simplicidade e ausência de abstração prematura;
- clareza de nomes, APIs e contratos;
- estados inválidos e invariantes;
- tratamento de erro e comportamento em bordas;
- qualidade, cobertura e valor dos testes;
- segurança, secrets, autorização, inputs externos e logs;
- dependências, lifecycle scripts, lockfile e supply chain;
- compatibilidade/runtime e custo operacional;
- desempenho quando material;
- documentação e rastreabilidade das decisões;
- escopo: confirmar que nada importante faltou e nada desnecessário entrou.

O resultado do review deve ser aplicado no próprio PR antes do merge. Não deixar dívida conhecida sem registro explícito no backlog/ADR quando o adiamento for deliberado.

## Review financeiro

Mudança de cálculo deve responder:

- qual fórmula mudou?
- qual unidade/moeda?
- qual arredondamento?
- quais invariantes?
- há impacto em snapshots históricos?
- há migration/version bump da metodologia?

## Review de segurança

Perguntas mínimas:

- amplia acesso a dados?
- adiciona input externo?
- adiciona segredo?
- altera auth/authz?
- pode vazar dado em log/telemetria?
- adiciona integração ou dependência?
- adiciona lifecycle script de dependência?
- exige exceção de política de supply chain?

## CI alvo

Na fundação:

```text
install --frozen-lockfile
format:check
lint
typecheck
test
build
```

O fallback local executa o mesmo conjunto via `pnpm check`, precedido por `pnpm install --frozen-lockfile`.

Security checks entram gradualmente, sem transformar warnings irrelevantes em ruído permanente. Proteções de supply chain do pnpm devem permanecer ativas; exceções precisam ser estreitas, versionadas e documentadas.
