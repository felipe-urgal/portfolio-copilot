# Próxima Atividade — MVP: migração opt-in do perfil financeiro local para a conta

**Status:** BLOCKED até o merge da issue #37; depois, READY.

## Issue canônica

- #38 — `MVP: migração opt-in do perfil financeiro local para a conta`

## Objetivo

Permitir que um usuário autenticado associe explicitamente à conta um `FinancialProfileSnapshot` previamente salvo no dispositivo, sem upload automático, perda silenciosa ou mistura entre identidade e domínio financeiro.

## Escopo

- detectar perfil local existente sem enviá-lo ao servidor;
- explicar a diferença entre dado local e dado da conta;
- pedir consentimento explícito antes de qualquer migração;
- comparar snapshots local e server-side quando ambos existirem;
- apresentar conflito de forma determinística;
- permitir manter somente local, migrar ou descartar o local explicitamente;
- revalidar o snapshot pelo domínio antes da persistência;
- manter remoção do dado local como ação separada;
- cobrir consentimento, conflitos e idempotência com testes.

## Fora de escopo

- sincronização genérica multi-dispositivo;
- migração automática no login;
- importação de corretora/Open Finance;
- Market Data, valuation ou IA;
- alteração das regras financeiras do onboarding.

## Critérios de aceite

- autenticar nunca dispara upload/migração do perfil local;
- nenhuma escolha destrutiva ocorre sem ação explícita;
- snapshot é revalidado antes de persistir;
- conflitos são visíveis e determinísticos;
- logout continua independente da remoção do storage local;
- `pnpm check` passa integralmente no head final.

## Referências canônicas

- issue #38;
- ADR-0019 — persistência local opt-in;
- ADR-0020 — autenticação e identidade;
- ADR-0021 — persistência PostgreSQL com ownership.
