# Próxima Atividade — Produto MVP: fundação de autenticação e identidade

**Status:** READY após merge da persistência local opt-in do perfil financeiro.

## Objetivo

Introduzir uma fronteira real de identidade e sessão autenticada para o MVP, com autenticação server-side segura e UX mínima de entrar/sair, sem migrar automaticamente dados financeiros locais para servidor e sem criar autorização fictícia antes de existir ownership persistido.

## Decisão de escopo

Nesta etapa, autenticação serve para estabelecer **quem está usando o produto** e proteger a sessão da aplicação. O `FinancialProfileSnapshot` salvo localmente continua sendo dado do dispositivo e não é enviado, associado ou sincronizado com a conta automaticamente.

A implementação deve usar solução de autenticação mantida e adequada ao Next.js atual; não criar armazenamento próprio de senha, hash caseiro, token customizado ou sessão client-only.

## Escopo

- definir e integrar a solução de autenticação compatível com a arquitetura atual e requisitos de segurança do projeto;
- introduzir identidade canônica mínima de usuário separada dos IDs de domínio financeiro;
- estabelecer sessão server-side com cookie seguro e sem expor token de autenticação ao JavaScript quando não for necessário;
- implementar entrar, sair e estado autenticado/não autenticado com UX simples e acessível;
- proteger as superfícies de produto que exigirem sessão por fronteira server-side, evitando depender apenas de redirect no cliente;
- manter `/health` utilizável conforme a finalidade operacional existente, sem carregar contexto financeiro;
- disponibilizar somente os dados mínimos de identidade necessários ao shell da aplicação;
- deixar explícito quando o usuário está autenticado sem exibir identificadores internos como informação primária;
- não copiar nem enviar automaticamente o perfil salvo em `localStorage` para a conta autenticada;
- manter a persistência local do perfil funcionando de forma independente da sessão autenticada nesta etapa;
- tratar sessão ausente, expirada ou inválida de forma previsível e sem revelar informação sensível;
- evitar logs com tokens, cookies, perfil financeiro ou dados pessoais desnecessários;
- adicionar testes para fronteira autenticada, logout, sessão inválida/ausente e separação entre identidade e storage financeiro local;
- registrar ADR/DECISIONS para a escolha do mecanismo/provedor de autenticação e fronteira de sessão.

## Fora de escopo

- persistir `FinancialProfileSnapshot`, Portfolio, Assets, Transaction Ledger, TargetAllocation ou recomendações no servidor;
- migrar dados existentes do dispositivo para uma conta;
- sincronização entre dispositivos;
- autorização granular por portfolio/recurso antes de existir persistência com ownership;
- painel administrativo ou papéis de suporte;
- cobrança/billing;
- integração com corretora/Open Finance;
- MFA obrigatório nesta etapa, embora deva permanecer requisito antes de exposição pública relevante;
- recuperação de conta customizada quando o provedor escolhido já oferecer fluxo seguro;
- Market Data, FX, valuation, IA ou regra financeira nova.

## Critérios de aceite

- existe uma identidade autenticada mínima e uma sessão server-side verificável;
- login/logout funcionam sem armazenar senha ou token sensível em código cliente do produto;
- cookies de sessão usam atributos de segurança adequados ao ambiente e à solução escolhida;
- superfícies protegidas não confiam apenas em estado cliente para decidir acesso;
- sessão ausente/expirada retorna o usuário ao fluxo de autenticação sem vazar dados;
- shell exibe estado autenticado de forma mínima e acessível;
- perfil financeiro local não é enviado nem associado à conta automaticamente;
- logout não promete apagar storage financeiro local do dispositivo; essa remoção continua sendo ação própria e explícita;
- nenhuma informação financeira, token ou cookie é registrada em logs técnicos;
- solução/provedor e trade-offs ficam documentados em ADR/DECISIONS;
- `pnpm check` passa integralmente no head final validado pelo CI.

## Referências canônicas

- `docs/ROADMAP.md` — Fase 3: autenticação;
- `docs/ARCHITECTURE.md` — módulo `identity` e camada Application/Infrastructure;
- `docs/SECURITY.md` — requisitos de autenticação, cookies, autorização, logging e segredos;
- `docs/adr/0019-local-financial-profile-persistence.md` — persistência local pré-autenticação e limites deliberados;
- `apps/web/src/components/financial-session.tsx` — sessão financeira cliente que deve permanecer separada da identidade autenticada;
- `apps/web/src/components/product-shell.tsx` — superfície compartilhada onde o estado mínimo de identidade poderá ser apresentado.
