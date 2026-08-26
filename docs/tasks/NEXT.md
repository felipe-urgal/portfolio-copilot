# Próxima Atividade — Produto MVP: fluxo web do onboarding financeiro

**Status:** READY após merge dos contratos de domínio do onboarding financeiro.

## Objetivo

Tornar o primeiro vertical da Fase 3 utilizável no `apps/web`, coletando as informações do `FinancialProfile` em um fluxo simples, acessível e validado pelo domínio, sem introduzir autenticação ou persistência.

## Escopo

- criar rota/tela de onboarding financeiro no app web;
- coletar moeda de referência, tolerância a risco e horizonte usando as taxonomias exportadas pelo domínio;
- permitir configurar ou deixar pendente o alvo da reserva de emergência;
- permitir adicionar/remover objetivos com tipo, valor-alvo e data-alvo quando aplicável;
- manter valores monetários como strings na UI e construir `Money` somente na fronteira de submissão, sem `number` binário para dinheiro;
- gerar `FinancialProfileId` e `FinancialGoalId` na camada de aplicação, nunca dentro do domínio;
- usar `FinancialProfile.create`/`FinancialGoal.create` como fonte de verdade da validação;
- mapear erros de domínio para feedback de campo/fluxo sem duplicar regras financeiras no componente;
- após validação, exibir uma etapa de revisão baseada em `FinancialProfileSnapshot`;
- estado permanece local/efêmero nesta primeira versão;
- testes de interação e acessibilidade para o caminho principal e erros relevantes.

## Fora de escopo

- autenticação/autorização;
- banco de dados, migrations ou persistência de sessão;
- API/Server Actions para salvar perfil;
- dashboard;
- carteira/holdings/transações;
- transformação automática do perfil em `TargetAllocation`;
- suitability regulatório ou score de risco;
- recomendação de ativos;
- Market Data, preço ou FX;
- IA.

## Critérios de aceite

- usuário consegue preencher e revisar um `FinancialProfileSnapshot` válido pelo domínio;
- horizonte e risco não são strings livres;
- valores monetários não passam por `number`/`parseFloat`;
- objetivo `DATED_PURPOSE` exige data e datas inválidas são explicadas ao usuário;
- reserva opcional não é confundida com saldo atual;
- nenhum perfil é salvo remotamente;
- refresh pode perder o estado nesta versão e isso deve estar claro no código/escopo;
- componentes não reimplementam validações do pacote de domínio;
- fluxo funciona em desktop e mobile e possui labels/foco/erros acessíveis;
- testes cobrem submissão válida, erro monetário, erro de data, adicionar/remover objetivo e revisão;
- `pnpm check` passa integralmente no head final validado.

## Referências canônicas

- `docs/adr/0018-basic-financial-onboarding-domain.md`;
- `docs/PRODUCT.md` — jornada principal começa com objetivos, horizonte, reserva e tolerância a risco;
- `docs/ROADMAP.md` — Fase 3 inicia pelo onboarding financeiro básico.
