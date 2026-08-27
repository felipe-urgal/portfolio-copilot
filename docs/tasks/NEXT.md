# Próxima Atividade — Produto MVP: perfil financeiro local compartilhado na sessão

**Status:** READY após merge da explicação local determinística do aporte.

## Objetivo

Fazer o `FinancialProfileSnapshot` já validado pelo onboarding sobreviver à navegação cliente durante a sessão e ser reutilizado por Dashboard e Carteira como contexto declarado do usuário, sem persistência, sem reconstruir o domínio e sem inventar progresso de metas ou reserva.

## Escopo

- evoluir a aplicação a partir do `FinancialProfileSnapshot` já produzido e validado pelo onboarding;
- introduzir um contexto cliente de sessão no shell da aplicação como único dono do snapshot financeiro local compartilhado;
- manter o estado somente em memória durante a sessão da aplicação, sem `localStorage`, cookie, API ou banco;
- fazer o onboarding publicar no contexto apenas o snapshot final validado pelo domínio;
- permitir que Dashboard e Carteira leiam o mesmo snapshot sem duplicar ou revalidar regras financeiras;
- exibir moeda de referência, tolerância a risco e horizonte como dados declarados do perfil;
- exibir a meta de reserva de emergência quando configurada e um estado honesto quando ausente;
- exibir objetivos existentes com tipo, valor-alvo e data-alvo quando aplicável;
- usar os quatro tipos canônicos de `FinancialGoal`: `NET_WORTH`, `PASSIVE_INCOME_MONTHLY`, `RETIREMENT` e `DATED_PURPOSE`;
- manter os IDs de perfil/objetivos internos ao contrato e fora da UX primária;
- preservar a distinção entre meta desejada e saldo/progresso atual;
- deixar explícito que navegar/recarregar fora da sessão em memória pode perder o contexto nesta etapa;
- garantir leitura responsiva e acessível sem criar card grid redundante;
- adicionar testes de publicação do snapshot pelo onboarding, leitura compartilhada entre superfícies e estados sem perfil/reserva/objetivos.

## Fora de escopo

- persistência em `localStorage`, IndexedDB, cookie, API, Server Actions ou banco;
- autenticação/autorização;
- sincronização entre abas, dispositivos ou sessões;
- cálculo de progresso da reserva ou dos objetivos;
- associar automaticamente patrimônio, ledger ou posições a um objetivo;
- sugerir contribuição mensal para objetivos;
- alterar `FinancialProfile`, `FinancialGoal` ou suas invariantes no domínio;
- Market Data, preço, FX, valuation ou rentabilidade;
- ranking, recomendação ou geração por IA;
- notificações, calendário ou execução financeira.

## Critérios de aceite

- existe uma única fonte cliente de sessão para `FinancialProfileSnapshot | null`;
- somente snapshot validado pelo onboarding é publicado nessa fonte;
- Dashboard e Carteira conseguem ler o mesmo snapshot após navegação cliente;
- ausência de snapshot mostra estado explícito e não métricas fictícias;
- meta de reserva é apresentada como meta, nunca como saldo atual ou percentual concluído;
- objetivos são apresentados com os campos já presentes no snapshot, sem cálculo de progresso;
- IDs internos não aparecem como informação primária;
- recarregar a aplicação não promete persistência que ainda não existe;
- nenhuma regra financeira, dependência, persistência ou integração externa é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: objetivos/reserva;
- `packages/domain/src/onboarding/financial-profile.ts` — `FinancialProfileSnapshot` e meta de reserva;
- `packages/domain/src/onboarding/financial-goal.ts` — objetivos e tipos canônicos;
- `apps/web/src/features/onboarding/onboarding-form.ts` — construção/validação atual do snapshot;
- `apps/web/src/components/product-shell.tsx` — fronteira atual compartilhada entre superfícies.
