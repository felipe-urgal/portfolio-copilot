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

- Node.js 24 Active LTS
- pnpm 11
- Next.js 16.3.3 / React 19.2
- TypeScript 6.0.3 strict
- ESLint + Prettier
- Vitest
- GitHub Actions

A stack foi mantida deliberadamente pequena. Banco, autenticação, providers de mercado, IA e deploy entram somente nas fases em que houver necessidade concreta.

## Desenvolvimento local

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

A aplicação fica em `http://localhost:3000` e a página de saúde em `http://localhost:3000/health`.

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

Não há variáveis de ambiente obrigatórias nesta fase. `.env.example` permanece como catálogo seguro para configurações futuras.

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
