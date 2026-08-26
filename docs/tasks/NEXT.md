# Próxima Atividade — Produto MVP: carteira base com cadastro local do Portfolio

**Status:** READY após merge do dashboard base com estados honestos.

## Objetivo

Criar a primeira superfície de carteira do MVP em `apps/web`, reutilizando o agregado `Portfolio` existente como fonte de verdade para identidade, nome e moeda de referência, sem inventar posições, patrimônio ou cotação antes do cadastro de transações.

## Escopo

- criar rota/tela de carteira integrada ao shell de produto;
- permitir criar o `Portfolio` mínimo com nome e moeda de referência usando os contratos existentes do domínio;
- manter o estado local/efêmero explícito enquanto persistência não existir;
- após criar o portfolio, exibir seu snapshot real e um estado vazio honesto para posições;
- deixar claro que posições serão derivadas do Transaction Ledger e não cadastradas como uma segunda fonte de verdade;
- manter dashboard e onboarding acessíveis pela navegação do produto;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para criação, validação, estado vazio, navegação e ausência de holdings/métricas fictícias;
- não duplicar validações já pertencentes ao domínio na camada web.

## Fora de escopo

- cadastro de transações;
- holdings editáveis diretamente;
- custo médio, P&L, patrimônio de mercado, preço ou cotação;
- TargetAllocation e comparação atual versus alvo;
- cálculo de aporte;
- persistência/API/Server Actions;
- autenticação/autorização;
- Market Data, FX ou benchmarks;
- recomendação/IA.

## Critérios de aceite

- `/portfolio` usa o shell reutilizável do produto e possui hierarquia clara;
- criação do portfolio reutiliza `Portfolio`, `PortfolioId` e `CurrencyCode` existentes;
- erros tipados do domínio são traduzidos para feedback acessível sem regra financeira paralela;
- o snapshot mostrado corresponde ao objeto validado pelo domínio;
- ausência de transações produz estado vazio explícito para posições, nunca holdings ou patrimônio fictícios;
- a interface explica que o estado ainda não é persistido;
- dashboard, onboarding e carteira permanecem navegáveis em desktop e mobile;
- testes cobrem estrutura, validação, navegação, estado local e ausência de dados inventados;
- nenhuma nova fórmula financeira, persistência, API ou integração externa é introduzida;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: dashboard -> carteira -> cadastro de transações;
- `docs/PRODUCT.md` — jornada principal e tela de carteira;
- `docs/ARCHITECTURE.md` — `Portfolio` separado de posições e Transaction Ledger como fonte histórica;
- `docs/adr/0007-portfolio-aggregate-boundary.md` — agregado Portfolio mínimo;
- `docs/adr/0009-asset-position-projection.md` — posições derivadas do ledger.
