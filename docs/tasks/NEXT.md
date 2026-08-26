# Próxima Atividade — Produto MVP: TargetAllocation local e baseline do aporte por AssetClass

**Status:** READY após merge de Asset local + `BUY`/`SELL` + posições derivadas.

## Objetivo

Adicionar o primeiro fluxo de aporte do MVP sobre a carteira local, configurando uma `TargetAllocation` por `AssetClass` e calculando um baseline determinístico com `allocateContribution` a partir de valores monetários atuais declarados explicitamente pelo usuário. Enquanto não houver Market Data, quantidade de posição não será convertida em valor de mercado nem usada para inventar valuation.

## Escopo

- evoluir a sessão local de `/portfolio` com uma seção de aporte vinculada ao `PortfolioId` atual;
- criar `TargetAllocation` reutilizando `TargetAllocation`, `AssetClass` e `AllocationWeight` existentes no domínio;
- permitir configurar pesos-alvo por `AssetClass` como strings e deixar `TargetAllocation.create` validar duplicidade, pesos positivos e soma exata de 100%;
- receber valores monetários atuais por `AssetClass` como entrada manual e explicitamente declarada, separados das quantidades projetadas pelo Transaction Ledger;
- receber `portfolioValue` e valor do novo aporte na moeda de referência do Portfolio usando `Money`;
- exigir que os valores atuais reconciliem com `portfolioValue` pelas invariantes já existentes no domínio;
- executar `allocateContribution` como única fonte do baseline de distribuição do aporte por `AssetClass`;
- mostrar necessidade pós-aporte, valor baseline alocado e eventual `unallocatedContribution` sem reinterpretar as fórmulas na camada web;
- deixar visualmente explícito que os valores atuais são uma base monetária manual temporária, não valuation derivado de preço;
- manter Portfolio, Asset, Transaction Ledger, TargetAllocation e aporte exclusivamente locais/efêmeros;
- preservar acessibilidade, foco, semântica e responsividade desktop/mobile;
- adicionar testes para pesos-alvo, reconciliação monetária, moedas, aporte zero/positivo, baseline e estados honestos.

## Fora de escopo

- derivar valor de mercado de `AssetQuantity` sem preço;
- Market Data, preço, cotação, FX ou benchmarks;
- conversão de `Money` em `AssetQuantity` ou quantidade recomendada;
- escolha/ranking de ativo destino dentro de uma classe;
- restrições de execução, unidade mínima negociável, custos ou impacto tributário na UI;
- orquestração completa do pipeline de recomendação de aporte;
- persistência/API/Server Actions;
- autenticação/autorização;
- recomendação por IA.

## Critérios de aceite

- a `TargetAllocation` pertence ao `PortfolioId` atual e seus pesos são validados pelo domínio;
- pesos-alvo não são somados ou validados por regra financeira duplicada na camada web;
- `portfolioValue`, valores atuais e aporte usam `Money`, sem `number` binário;
- a interface identifica os valores atuais como declarados manualmente e nunca como valor de mercado das posições;
- valores atuais reconciliam exatamente com `portfolioValue` pelas invariantes existentes;
- `allocateContribution` produz o baseline exibido por `AssetClass` e a sobra não alocada;
- nenhuma quantidade, preço, patrimônio ou valuation é inferido sem Market Data;
- erros tipados do domínio são traduzidos para feedback acessível;
- todo o estado continua local/efêmero e essa limitação permanece explícita;
- testes cobrem sucesso, pesos inválidos, moeda/reconciliação, aporte e ausência de valuation fictício;
- nenhuma nova fórmula financeira, persistência, API ou integração externa é introduzida;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: cadastro de transações -> aporte do mês;
- `docs/FINANCIAL-METHODOLOGY.md` — metodologia financeira e fronteiras do aporte;
- `docs/adr/0010-target-allocation.md` — política-alvo por `AssetClass`;
- `docs/adr/0012-contribution-allocator.md` — baseline determinístico do aporte;
- `packages/domain/src/portfolio/target-allocation.ts` — contrato atual de `TargetAllocation`;
- `packages/domain/src/contribution/contribution-allocator.ts` — contrato atual de `allocateContribution`.
