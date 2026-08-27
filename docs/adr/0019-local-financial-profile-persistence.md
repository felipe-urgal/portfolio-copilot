# ADR-0019 — Persistência local opt-in do perfil financeiro pré-autenticação

**Status:** Aceita

## Contexto

O MVP já possui um `FinancialProfileSnapshot` validado pelo domínio e compartilhado em memória entre Onboarding, Dashboard e Carteira. A próxima necessidade de produto é permitir que esse perfil sobreviva a um reload sem antecipar autenticação, ownership por usuário, API ou banco relacional.

Os dados do perfil financeiro incluem tolerância a risco, horizonte, meta de reserva e objetivos e, portanto, são tratados como dados financeiros sensíveis. A direção arquitetural futura de persistência continua sendo server-side com PostgreSQL, acompanhada por autenticação e autorização apropriadas.

## Decisão

Antes da autenticação, somente o `FinancialProfileSnapshot` poderá ser persistido no navegador, mediante ação explícita do usuário.

A implementação deve:

- usar um adapter de infraestrutura isolado para `localStorage`;
- usar chave namespaced e envelope com versão de schema explícita;
- manter `FinancialSessionProvider` como única fonte de estado consumida pela UI;
- acessar APIs do navegador somente no cliente, após mount;
- revalidar todo snapshot lido do storage por `FinancialProfile.fromSnapshot` antes de publicá-lo na sessão;
- remover dados corrompidos, incompatíveis ou inválidos em vez de tentar recuperação parcial;
- permitir remoção explícita da cópia persistida sem apagar automaticamente o perfil em memória;
- invalidar uma cópia persistida anterior quando um novo snapshot validado é publicado, exigindo novo opt-in para persistir a versão atual;
- nunca registrar o conteúdo financeiro do snapshot em logs técnicos.

A persistência local é uma conveniência provisória do MVP pré-autenticação. Ela não representa sincronização, backup, ownership, isolamento entre usuários do mesmo navegador ou proteção contra código executando na mesma origem.

## Consequências

### Positivas

- o usuário pode restaurar o perfil após reload sem introduzir backend prematuramente;
- a UI continua desacoplada de `localStorage` e lê apenas a sessão compartilhada;
- snapshots persistidos passam novamente pelas invariantes do domínio antes do uso;
- schema versionado permite rejeitar formatos incompatíveis de forma determinística;
- o opt-in explícito preserva o comportamento atual somente em memória por padrão.

### Limitações e riscos aceitos

- qualquer pessoa com acesso ao mesmo perfil do navegador pode potencialmente acessar o dado salvo;
- limpar dados do navegador remove o perfil persistido;
- não existe sincronização entre abas, navegadores, dispositivos ou contas;
- `localStorage` pode estar bloqueado ou indisponível, caso em que o produto degrada para sessão em memória;
- criptografia client-side não é apresentada como proteção suficiente contra código executando na mesma origem.

## Fora de escopo

- Portfolio, Assets, Transaction Ledger, TargetAllocation, configurações de aporte e RecommendationSnapshot;
- PostgreSQL, ORM, migrations, API ou Server Actions;
- autenticação, autorização e ownership por usuário;
- sincronização, backup remoto ou exportação/importação;
- novas regras financeiras, Market Data, FX, valuation, IA ou execução financeira.

## Relações

- complementa D-009 sem substituí-la: PostgreSQL continua sendo a direção futura de persistência server-side;
- segue a classificação e minimização de dados definida em `docs/SECURITY.md`;
- preserva a separação entre perfil declarativo e carteira definida no ADR-0018.
