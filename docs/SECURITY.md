# Segurança

## Objetivo

Tratar dados financeiros como informação sensível desde o primeiro commit, mesmo quando a primeira versão for de uso pessoal.

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

A escolha de provedor será feita na fundação técnica. Requisitos:

- sessão segura;
- cookies `HttpOnly`, `Secure` e política `SameSite` adequada quando aplicável;
- MFA disponível antes de exposição pública relevante;
- rate limiting em endpoints de autenticação;
- proteção contra enumeração de usuários;
- recuperação de conta segura.

## Autorização

Toda query de dado do usuário deve carregar contexto de ownership. Nunca confiar em IDs enviados pelo cliente sem checar proprietário.

Quando houver papéis administrativos:

- `user` não acessa recursos administrativos;
- `admin` possui ações explícitas e auditadas;
- operações de suporte não devem expor portfólio sem necessidade.

## Banco

- TLS em trânsito;
- criptografia em repouso conforme infraestrutura;
- backups testados;
- migrações versionadas;
- acesso de produção restrito;
- nenhuma query dinâmica construída por concatenação de entrada.

## Segredos

- `.env` local ignorado pelo Git;
- CI usa secret store do provedor;
- rotacionar segredo após qualquer suspeita de vazamento;
- tokens diferentes por ambiente;
- nunca registrar token em log.

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

## Market data

Dados externos são não confiáveis até validação. Validar schema, moeda, escala, timestamp e identificador do ativo. Um preço 100x fora da faixa deve ser sinalizado, não propagado silenciosamente.

## Supply chain

- lockfile obrigatório;
- atualizações automáticas revisadas;
- secret scanning;
- dependency scanning;
- CI com permissões mínimas;
- GitHub Actions pinadas de forma segura conforme decisão técnica;
- branch protection quando o fluxo estiver configurado.

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

Antes de produção pública, criar runbook para:

1. contenção;
2. rotação de segredos;
3. preservação de evidência;
4. avaliação de impacto;
5. correção;
6. comunicação conforme obrigações aplicáveis;
7. post-mortem.
