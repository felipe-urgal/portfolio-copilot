# Portfolio Copilot

Copiloto inteligente de investimentos para organizar patrimônio, orientar aportes e tornar decisões financeiras explicáveis, auditáveis e disciplinadas.

> Status: **fundação técnica em construção**. Nenhuma recomendação automatizada de investimento está implementada.

## Problema que queremos resolver

A pergunta central do produto é:

> **Tenho R$ X para investir hoje. Considerando minha carteira, objetivos, risco, alocação, qualidade dos ativos e cenário, onde faz mais sentido aportar — e por quê?**

O Portfolio Copilot não nasce como corretora nem como robô de trade. Ele nasce como um sistema de apoio à decisão com três responsabilidades separadas:

1. entender a carteira e seus objetivos;
2. avaliar ativos e oportunidades com metodologia explícita;
3. sugerir um plano de aporte explicável, sem executar ordens.

## Princípios

- segurança e reserva antes de retorno;
- diversificação por fatores de risco, não por quantidade de tickers;
- motor financeiro determinístico e testável;
- IA auxilia análise e explicação, mas não controla regras financeiras;
- empresa boa não significa ativo barato;
- qualidade, oportunidade e aderência à carteira são conceitos distintos;
- rebalanceamento preferencialmente por novos aportes;
- toda recomendação deve ter motivos, dados, versão da metodologia e snapshot;
- nenhuma promessa de retorno;
- nenhuma execução de ordens no MVP.

## Arquitetura planejada

O sistema começa como **monólito modular**, evitando microserviços prematuros.

```text
apps/web
packages/domain
packages/persistence
packages/portfolio-engine
packages/investment-engine
packages/market-data
packages/shared
```

Módulos de domínio previstos:

```text
auth
users
profiles
goals
assets
portfolios
holdings
transactions
allocations
contributions
risk
fundamentals
valuation
ranking
recommendations
theses
market-events
news
simulations
alerts
audit
```

## Stack atual

- Node.js 24 Active LTS (`.nvmrc` e `engines` restringem o major 24)
- pnpm 11
- Next.js 16.3.3 / React 19.2
- TypeScript 6.0.3 strict
- Auth.js v5 / `next-auth@5.0.0-beta.32` com GitHub OAuth
- PostgreSQL 18 + Drizzle ORM + `node-postgres` para persistência server-side
- ESLint 9.39.5 + Prettier
- Vitest
- GitHub Actions

A stack é mantida deliberadamente pequena. Providers de mercado, IA e deploy entram somente nas fases em que houver necessidade concreta.

## Desenvolvimento local

```bash
nvm use
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
```

### Configuração local

Crie `.env.local` na raiz do repositório a partir do catálogo seguro:

```bash
cp .env.example .env.local
```

Nunca versione valores reais. Comandos de migration priorizam `DATABASE_URL` já exportado no processo e, na ausência dele, leem `.env.local` e depois `.env` na raiz do repositório.

### PostgreSQL local

O ambiente de desenvolvimento possui um serviço Docker Compose próprio. Ele publica PostgreSQL somente em `127.0.0.1:5433`, evitando conflito com instalações locais que já usem a porta padrão `5432`.

Suba o banco:

```bash
pnpm db:up
```

Mantenha em `.env.local`:

```text
DATABASE_URL=postgresql://portfolio:portfolio@localhost:5433/portfolio_copilot
```

Aplique as migrations:

```bash
pnpm db:migrate
```

Para encerrar o serviço local:

```bash
pnpm db:down
```

O volume nomeado do Compose preserva os dados entre reinicializações. Não use as credenciais locais de exemplo em produção.

### Autenticação local

Configure uma GitHub OAuth App para o ambiente local com callback:

```text
http://localhost:3000/api/auth/callback/github
```

Preencha em `.env.local`:

```text
AUTH_SECRET=<segredo aleatório forte>
AUTH_GITHUB_ID=<client id da OAuth App>
AUTH_GITHUB_SECRET=<client secret da OAuth App>
```

O login estabelece somente identidade e sessão autenticada; ele não envia nem associa automaticamente à conta o perfil financeiro eventualmente salvo em `localStorage`.

Depois execute:

```bash
pnpm dev
```

A aplicação fica em `http://localhost:3000` e a página de saúde em `http://localhost:3000/health`. `/health` permanece pública para finalidade operacional; Dashboard, Carteira e Onboarding exigem sessão autenticada.

### Quality gate

```bash
pnpm check
```

O comando executa, na mesma ordem usada pelo CI:

1. `format:check`;
2. `lint`;
3. `typecheck`;
4. `test`;
5. `build`.

Os testes de integração de persistência são executados quando `DATABASE_URL` está disponível. O CI sobe PostgreSQL isolado, aplica as migrations e executa esses testes contra o banco real.

## Documentação

Comece por estes três documentos:

- [Project Brief — decisões e ideias preservadas da descoberta](docs/PROJECT-BRIEF.md)
- [Política de investimentos — base do produto](docs/portfolio/INVESTMENT-POLICY.md)
- [Catálogo de funcionalidades](docs/product/FEATURE-CATALOG.md)

Documentação de engenharia e governança:

- [Visão](docs/VISION.md)
- [Produto](docs/PRODUCT.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Metodologia financeira](docs/FINANCIAL-METHODOLOGY.md)
- [Segurança](docs/SECURITY.md)
- [Fontes de dados](docs/DATA-SOURCES.md)
- [Regulatório](docs/REGULATORY.md)
- [Roadmap](docs/ROADMAP.md)
- [Decisões](docs/DECISIONS.md)
- [Desenvolvimento e regra obrigatória de PR](docs/DEVELOPMENT.md)
- [Próxima atividade](docs/tasks/NEXT.md)
- [Backlog](docs/tasks/BACKLOG.md)

## Fluxo de trabalho

```text
NEXT.md -> branch -> implementação -> testes -> PR -> acompanhar CI -> auto code review sênior -> corrigir findings -> atualizar docs -> CI final verde -> merge -> handoff local
```

Nenhuma funcionalidade financeira é considerada concluída sem testes, critérios de aceite e documentação correspondente. Nenhum PR é mergeado enquanto houver CI pendente/falhando ou finding de review em aberto.

## Aviso

Este repositório está em fase de desenvolvimento. A metodologia descrita é de engenharia de produto e pesquisa financeira; não representa promessa de rentabilidade nem, por si só, serviço público de consultoria de valores mobiliários.
