# Próxima Atividade — Produto MVP: persistência local opt-in do perfil financeiro

**Status:** READY após merge do compartilhamento local de `FinancialProfileSnapshot` entre Onboarding, Dashboard e Carteira.

## Objetivo

Fazer o `FinancialProfileSnapshot` validado sobreviver a reloads no mesmo navegador quando o usuário optar explicitamente por salvar o perfil neste dispositivo, mantendo a solução pequena, versionada, recuperável e honesta sobre seus limites antes de autenticação e persistência server-side.

## Decisão de escopo

Nesta etapa, persistir **somente o perfil financeiro** em armazenamento local do navegador. Portfolio, Assets, Transaction Ledger, TargetAllocation, configurações do aporte e snapshots de recomendação continuam efêmeros.

A persistência local é provisória para o MVP pré-autenticação e não substitui a direção arquitetural futura de PostgreSQL. Nenhum dado é enviado a servidor nesta atividade.

## Escopo

- manter `FinancialSessionProvider` como fonte cliente única para `FinancialProfileSnapshot | null`;
- adicionar um adapter pequeno e isolado para persistência do perfil no navegador, sem dependência externa;
- usar uma chave namespaced e um envelope com versão de schema explícita;
- persistir somente após ação/consentimento explícito do usuário na experiência de onboarding/revisão;
- reidratar o snapshot salvo no carregamento cliente sem acessar APIs de browser durante SSR;
- revalidar dados reidratados pelas invariantes canônicas do domínio antes de publicá-los na sessão;
- tratar JSON corrompido, schema incompatível ou snapshot inválido como dado indisponível, nunca como perfil parcialmente confiável;
- permitir remover explicitamente o perfil persistido do dispositivo;
- manter claro na UI quando o perfil está apenas na sessão e quando está salvo neste dispositivo;
- evitar logs com conteúdo financeiro do snapshot;
- manter Dashboard e Carteira consumindo apenas a sessão compartilhada, sem acesso direto ao storage;
- cobrir persistência, reidratação, remoção, versão incompatível, JSON inválido e snapshot de domínio inválido com testes determinísticos;
- registrar a decisão/limitação arquitetural do armazenamento local pré-autenticação em ADR/DECISIONS se a implementação confirmar essa direção.

## Fora de escopo

- persistir Portfolio, Assets, Transaction Ledger, TargetAllocation, configurações de aporte ou RecommendationSnapshot;
- PostgreSQL, ORM, migrations, API, Server Actions ou qualquer backend de persistência;
- autenticação, autorização, ownership por usuário ou multi-tenancy;
- sincronização entre abas, navegadores, dispositivos ou sessões de usuário;
- criptografia client-side com promessa de proteção que o navegador não consiga garantir contra código executando na mesma origem;
- backup, restore remoto ou exportação/importação;
- Market Data, preço, FX, valuation ou rentabilidade;
- alterar `FinancialProfile`, `FinancialGoal` ou regras financeiras;
- cálculo de progresso de reserva/objetivos;
- IA, recomendação nova, notificações ou execução financeira.

## Critérios de aceite

- sem opt-in, o comportamento atual permanece somente em memória;
- com opt-in, reload no mesmo navegador reidrata o último `FinancialProfileSnapshot` válido;
- Dashboard e Carteira continuam lendo o perfil apenas por `FinancialSessionProvider`;
- storage contém envelope versionado e somente snapshots serializáveis já existentes;
- dado persistido nunca é confiado sem parse, checagem de versão e revalidação de domínio;
- storage corrompido/incompatível não quebra a aplicação nem produz estado financeiro parcial;
- usuário consegue remover o perfil salvo do dispositivo e a sessão reflete a remoção de forma coerente;
- UI diferencia claramente “somente nesta sessão” de “salvo neste dispositivo”;
- nenhuma informação financeira é adicionada a logs técnicos;
- nenhuma dependência externa, regra financeira ou integração server-side é adicionada;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: persistência;
- `docs/ARCHITECTURE.md` — Infrastructure e direção futura de PostgreSQL;
- `docs/SECURITY.md` — classificação de dados financeiros e minimização de exposição;
- `docs/DECISIONS.md` — D-009, PostgreSQL como direção proposta de persistência;
- `packages/domain/src/onboarding/financial-profile.ts` — `FinancialProfileSnapshot` e reidratação canônica;
- `apps/web/src/components/financial-session.tsx` — fonte cliente compartilhada atual.
