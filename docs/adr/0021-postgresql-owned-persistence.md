# ADR-0021 — PostgreSQL com persistência orientada a ownership

- **Status:** Aceita
- **Data:** 2026-08-27

## Contexto

A autenticação server-side estabelece uma identidade canônica, mas os dados financeiros do produto ainda não possuíam uma persistência relacional vinculada à conta. O domínio já define `FinancialProfileSnapshot`, `Portfolio`, transaction ledger e `TargetAllocation` sem dependência de framework ou banco.

A persistência precisa preservar essas fronteiras, impedir acesso cruzado entre usuários e manter o ledger como fonte de fatos imutáveis. O perfil salvo no dispositivo antes da autenticação não pode ser associado à conta automaticamente.

## Decisão

Adotar PostgreSQL como banco relacional inicial e Drizzle ORM com `node-postgres` na camada de infraestrutura, encapsulados em `packages/persistence`.

O subject canônico produzido pela autenticação é a chave de ownership. A camada web nunca recebe `ownerSubject` de payload do cliente: `requireOwnedPersistence()` deriva o subject da sessão autenticada no servidor e abre um repository já limitado ao proprietário.

O schema reforça a mesma fronteira com chaves primárias e foreign keys compostas por `owner_subject` e pelo identificador do recurso. Assim, uma transação ou configuração de alocação não pode ser associada no banco ao portfolio de outro usuário.

A API pública de `@portfolio-copilot/persistence` não expõe pool, schema nem conexão Drizzle bruta. Aplicação usa repositories com ownership; os primitivos de conexão permanecem internos ao package e são usados diretamente apenas pelos testes de integração.

### Dados persistidos nesta fundação

- uma identidade técnica mínima em `account_owners`, contendo somente o subject canônico e timestamps operacionais;
- um `FinancialProfileSnapshot` por owner;
- `Portfolio` com ownership composto;
- transaction ledger append-only pelo repository, com repetição idêntica idempotente e conflito explícito quando o mesmo `TransactionId` tenta representar conteúdo diferente;
- `TargetAllocation` por portfolio, com versão incremental de persistência;
- referências de `AssetId` observadas no ledger de cada portfolio.

O Asset Master canônico e metadados públicos dos instrumentos permanecem fora desta etapa e serão tratados separadamente. Um ativo público não é modelado como propriedade do usuário.

Snapshots são revalidados pelo domínio na entrada e na leitura. Tabelas materiais carregam `schema_version`, provenance e timestamps em UTC. Não são persistidos tokens OAuth, cookies ou dados de identidade desnecessários.

### Migrações

O schema Drizzle é a definição da infraestrutura e gera migrations SQL versionadas em `packages/persistence/drizzle`. CI sobe PostgreSQL isolado, aplica as migrations e executa testes reais de ownership, acesso cruzado e ledger.

### Backup e restauração

Para qualquer ambiente que contenha dados reais:

1. o provedor PostgreSQL deve fornecer backup automatizado diário, criptografia em repouso e TLS em trânsito;
2. retenção inicial mínima é de 7 dias; point-in-time recovery deve ser habilitado quando o provedor oferecer o recurso;
3. antes de exposição pública, deve existir restore drill documentado e executado periodicamente;
4. exportações manuais usam formato custom do PostgreSQL (`pg_dump --format=custom`) e restauração controlada com `pg_restore`; dumps são dados sensíveis, não entram no repositório e devem seguir a mesma proteção do banco;
5. migration e backup são mecanismos diferentes: migration nunca substitui backup.

## Consequências

- ownership deixa de ser apenas convenção de application code e passa a ter reforço estrutural no banco;
- o domínio continua sem importar ORM ou PostgreSQL;
- migrations e testes de integração passam a exigir PostgreSQL no CI;
- a dependência operacional do banco aumenta, mas permanece dentro do monólito modular;
- a migração do perfil local para a conta continua deliberadamente separada e opt-in;
- operações administrativas futuras não devem receber acesso ao schema bruto por conveniência; precisam de casos de uso autorizados e auditados.

## Alternativas consideradas

### Persistência somente local

Rejeitada porque não oferece ownership, multi-dispositivo, backup server-side nem base adequada para futuras integrações.

### SQL manual como única camada

Possível, porém aumenta a chance de divergência entre schema TypeScript, migration e mapping. SQL continua visível nas migrations, enquanto Drizzle fornece tipagem na infraestrutura.

### ORM com runtime/codegen mais amplo

Não escolhido nesta fase para manter a dependência menor e o schema próximo do SQL, sem alterar as fronteiras do domínio.
