# Segurança

## Objetivo

Tratar dados financeiros como informação sensível desde o primeiro commit, inclusive na produção pessoal/privada atualmente ativa.

## Princípios

- mínimo privilégio;
- deny by default;
- segredo nunca no repositório;
- autenticação e autorização separadas;
- dados pessoais minimizados;
- nenhuma credencial de corretora no MVP;
- integrações financeiras inicialmente read-only quando existirem;
- auditabilidade de ações sensíveis;
- dependências e CI tratados como superfície de ataque.

## Dados

Classificação inicial:

### Alta sensibilidade

- patrimônio;
- posições;
- transações;
- renda/despesas;
- objetivos financeiros;
- perfil de risco;
- tokens de integração.

### Média

- preferências de interface;
- listas de ativos/radar pessoais.

### Pública

- metadados públicos de ativos e mercado, respeitando licença do provedor.

## Autenticação

O contrato atual usa **Auth.js v5 com GitHub OAuth**. Em produção pessoal/privada, o acesso é fail-closed por allowlist explícita da conta autorizada; ausência ou divergência da identidade permitida deve negar acesso.

Requisitos atuais e futuros:

- sessão segura;
- cookies `HttpOnly`, `Secure` e política `SameSite` adequada quando aplicável;
- callbacks/redirects limitados a destinos aceitos;
- credenciais OAuth distintas por ambiente quando aplicável;
- `AUTH_SECRET` e credenciais do GitHub somente em secret stores/ambiente, nunca no repositório;
- MFA/reautenticação disponível antes de exposição pública relevante, quando compatível com o modelo de identidade adotado;
- rate limiting/abuse protection em endpoints de autenticação antes de exposição pública relevante;
- proteção contra enumeração de usuários;
- recuperação de conta segura quando houver fluxo próprio de conta.

A allowlist single-user é um controle do ambiente pessoal atual, não uma solução de tenancy para produto público.

## Autorização

Toda query de dado do usuário deve carregar contexto de ownership. Nunca confiar em IDs enviados pelo cliente sem checar proprietário.

Quando houver papéis administrativos:

- `user` não acessa recursos administrativos;
- `admin` possui ações explícitas e auditadas;
- operações de suporte não devem expor portfólio sem necessidade.

## Banco

- TLS em trânsito;
- criptografia em repouso conforme infraestrutura;
- backups/snapshots e recuperação testados de acordo com o ambiente;
- migrações versionadas e explícitas;
- acesso de produção restrito;
- nenhuma query dinâmica construída por concatenação de entrada.

Na produção pessoal atual:

- Neon PostgreSQL 18 é o banco canônico;
- `DATABASE_URL` pooled é usado no runtime;
- `DATABASE_DIRECT_URL` direct/unpooled é reservado a migration/admin explícito;
- migrations não rodam implicitamente no startup/deploy;
- o baseline de recuperação foi validado por snapshot e restore-check em branch isolada, conforme `docs/PRODUCTION.md`.

## Segredos

- `.env`/`.env.local` locais são ignorados pelo Git;
- CI e produção usam secret store do provedor;
- variáveis de produção ficam restritas ao ambiente de Production quando aplicável;
- `DATABASE_DIRECT_URL` não deve ser exposta ao runtime se não for necessária;
- rotacionar segredo após qualquer suspeita de vazamento;
- tokens diferentes por ambiente;
- nunca registrar token em log;
- `.dev-dashboard/production.json` registra somente metadados não secretos do Production Contract.

## Produção pessoal/privada

O ambiente Vercel + Neon ativado em 31/08/2026 é **single-user/controlado** e não equivale a produto público.

Controles operacionais atuais incluem:

- promoção pela branch `main` via integração Git/provider;
- deploy local bloqueado pelo contrato `git-managed`;
- autenticação GitHub com allowlist fail-closed;
- health liveness sem dependência externa em `/api/health/live`;
- readiness com PostgreSQL em `/api/health/ready`;
- migrations e verificação de produção explícitas;
- snapshot/restore-check documentado.

Exposição pública, multi-tenancy, monetização, observabilidade/SLO, pentest independente, incident response completo e demais requisitos de operação para terceiros continuam atrás da #50/Regulatory Gate.

## Integrações financeiras

MVP não executará ordens nem armazenará senha de corretora.

Fase futura de integração:

- preferir OAuth/consentimento padronizado;
- scopes mínimos;
- read-only por padrão;
- tokens cifrados;
- revogação clara;
- trilha de consentimento;
- não reutilizar token entre ambientes.

## LLM/IA

Antes de enviar contexto a um modelo:

- remover informação pessoal desnecessária;
- enviar apenas campos necessários;
- tratar texto externo como não confiável;
- proteger contra prompt injection em notícias/documentos;
- respostas de IA nunca concedem autorização nem executam ação financeira;
- ferramentas de IA usam allowlist de ações.

### Ingestão de conteúdo externo

Notícias, documentos e resultados entram por uma fronteira separada e deny-by-default definida no ADR-0027.

Requisitos mínimos:

- adapter precisa declarar `sourceId` existente em allowlist;
- URL de provenance é HTTPS e precisa pertencer ao host permitido pela policy;
- parser falha explicitamente; erro não vira fato nem conteúdo vazio silencioso;
- texto é normalizado e limitado antes de hash/classificação;
- controles Unicode invisíveis/bidi são neutralizados;
- metadata possui limites e rejeita chaves de prototype pollution;
- todo record mantém `trustBoundary = UNTRUSTED_EXTERNAL_CONTENT` e `instructionAuthority = NONE`;
- padrões de prompt injection de alto risco colocam o conteúdo em `QUARANTINED` antes do classificador;
- conteúdo quarantined não é enviado ao classificador normal;
- dedupe usa fingerprint do conteúdo normalizado e mantém revisões da fonte sem sobrescrever histórico;
- classificação por ativo/tese/evento é derivada, validada e falível; nunca equivale a fato canônico;
- stale, source mutation e falha do classifier permanecem explícitos;
- audit store é append-only por contrato e cada source policy define retenção;
- um adapter de rede futuro precisa aplicar SSRF/redirect/DNS/IP/content-type/timeout/size controls antes dessa pipeline.

A detecção inicial por padrões não é defesa completa. A suíte adversarial contínua entra na #46.

## Market data

Dados externos são não confiáveis até validação. Validar schema, moeda, escala, timestamp e identificador do ativo. Um preço 100x fora da faixa deve ser sinalizado, não propagado silenciosamente.

## Supply chain

- lockfile obrigatório e instalação de CI com `--frozen-lockfile`;
- política de idade mínima de releases do pnpm permanece ativa;
- exceções de idade são estreitas, por pacote/versão e documentadas;
- lifecycle scripts de dependências são deny-by-default e exigem allowlist versionada após revisão;
- GitHub Actions de CI são pinadas por SHA imutável, com comentário da versão humana;
- checkout de CI não persiste credenciais quando não há necessidade de escrita;
- workflows usam permissões mínimas;
- atualizações automáticas devem ser revisadas;
- secret scanning e dependency scanning entram conforme a infraestrutura do repositório evoluir;
- branch protection deve exigir o quality gate quando o fluxo estiver configurado.

## Web

Cobrir no mínimo:

- XSS;
- CSRF quando aplicável;
- SSRF em fetchers;
- IDOR/BOLA;
- injection;
- open redirect;
- upload inseguro;
- headers de segurança;
- rate limiting;
- validação server-side.

## Logging

Nunca logar carteira completa por conveniência. Preferir IDs, métricas e eventos sanitizados. Audit log de negócio é separado de log técnico.

## Incidentes

Antes de produção **pública**, criar e validar runbook compatível com a operação para terceiros:

1. contenção;
2. rotação de segredos;
3. preservação de evidência;
4. avaliação de impacto;
5. correção;
6. comunicação conforme obrigações aplicáveis;
7. post-mortem.

Para a produção pessoal atual, os procedimentos mínimos de health, migration, verificação e recuperação estão em `docs/PRODUCTION.md`.
