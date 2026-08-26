# Próxima Atividade — Produto MVP: onboarding financeiro básico

**Status:** READY após fechamento dos testes de invariantes do Portfolio Engine.

## Objetivo

Iniciar a Fase 3 do roadmap com contratos de domínio simples e explícitos para representar as informações financeiras mínimas que o produto precisa conhecer antes de orientar carteira e aportes, sem acoplar autenticação, persistência ou UI ao modelo.

## Escopo

- definir o contrato mínimo do perfil financeiro usado pelo onboarding;
- representar tolerância a risco por taxonomia explícita e validada, sem score criado por IA;
- representar horizonte financeiro de forma coerente com curto, médio e longo prazo documentados;
- registrar configuração da reserva de emergência necessária ao produto, incluindo base/objetivo monetário quando aplicável;
- definir objetivos financeiros mínimos e suas restrições essenciais sem misturá-los com posições da carteira;
- manter identidade/configuração separadas de projeções, saldos e dados de mercado;
- contratos imutáveis e serializáveis para futura persistência/API;
- erros de configuração tipados;
- testes de criação, estados inválidos, snapshot/round-trip, imutabilidade e determinismo;
- atualizar documentação de produto/metodologia quando a modelagem exigir decisão explícita.

## Fora de escopo

- autenticação e autorização;
- banco de dados ou migrations;
- API/Server Actions;
- formulário/telas de onboarding;
- dashboard;
- importação de carteira;
- preço, FX ou Market Data;
- recomendação de ativos;
- Quality Score, Opportunity Score ou Portfolio Fit;
- IA;
- alteração automática da política de alocação a partir do perfil.

## Critérios de aceite

- o domínio consegue representar de forma determinística o conjunto mínimo de dados financeiros do onboarding;
- tolerância a risco e horizonte não usam strings livres sem validação;
- valores monetários reutilizam `Money` e preservam moeda explícita;
- objetivos/reserva não são confundidos com holdings ou saldo corrente do `Portfolio`;
- snapshots não expõem classes, `bigint` ou objetos de infraestrutura;
- configuração inválida falha por erro de domínio tipado;
- nenhuma regra de recomendação financeira é inferida silenciosamente do perfil;
- nenhuma dependência externa nova entra sem necessidade explícita;
- `pnpm check` passa integralmente no head final validado.

## Casos mínimos

- perfil com horizonte curto, médio e longo;
- tolerâncias de risco válidas e valor desconhecido/inválido;
- reserva configurada com valores monetários válidos;
- objetivo com e sem data-alvo quando a taxonomia permitir;
- valores zero/limites definidos pela regra de domínio;
- moeda incompatível quando dois valores relacionados precisarem reconciliar;
- snapshot determinístico e round-trip;
- duas configurações distintas não compartilham estado mutável.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3 começa por onboarding financeiro básico;
- `docs/PRODUCT.md` — jornada inicia com objetivos, horizonte, reserva e tolerância a risco;
- `docs/PROJECT-BRIEF.md` — preferências e restrições devem ser explícitas e não alteradas silenciosamente por IA.
