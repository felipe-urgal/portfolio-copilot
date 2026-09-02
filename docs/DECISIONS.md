# Registro de Decisões

Este arquivo resume decisões. Decisões arquiteturais importantes também ganham ADR dedicado.

| ID | Decisão | Status |
|---|---|---|
| D-001 | Produto nasce como copiloto, não corretora | Aceita |
| D-002 | MVP não executa ordens | Aceita |
| D-003 | Monólito modular antes de microserviços | Aceita |
| D-004 | Motor financeiro determinístico; IA assistiva | Aceita |
| D-005 | Quality, Opportunity e Portfolio Fit são separados | Aceita |
| D-006 | Rebalanceamento prioriza novos aportes | Aceita |
| D-007 | RecommendationSnapshot é imutável | Aceita |
| D-008 | Dados materiais precisam de provenance e `asOf` | Aceita |
| D-009 | PostgreSQL é a persistência relacional inicial; ORM fica restrito à infraestrutura | Aceita — ADR-0021 |
| D-010 | Web responsiva é a interface atual; instalação PWA permanece evolução futura e só entra com estratégia segura de cache/offline | Aceita |
| D-011 | Produto público exige Regulatory Gate | Aceita |
| D-012 | Sem microaportes artificiais: o motor pode concentrar o aporte do mês em menos destinos para corrigir gaps | Aceita |
| D-013 | Valores financeiros fundamentais usam representação decimal inteira; `Money` não usa float e quantidade/preço terão tipos próprios | Aceita — ADR-0005 |
| D-014 | `AssetId` é independente de ticker/provedor e classe econômica (`AssetClass`) é separada do veículo (`InstrumentType`) | Aceita — ADR-0006 |
| D-015 | `Portfolio` guarda somente identidade/configuração; posições e saldos serão projeções do transaction ledger | Aceita — ADR-0007 |
| D-016 | Transaction Ledger registra fatos imutáveis; direção vem do tipo e quantidade usa 12 casas exatas sem arredondamento silencioso | Aceita — ADR-0008 |
| D-017 | Posições abertas são projeções puras do ledger; venda acima da posição falha e fatos com timestamp igual preservam a ordem de entrada | Aceita — ADR-0009 |
| D-018 | `TargetAllocation` é política completa por `AssetClass`: buckets positivos, sem duplicidade e soma exata de 100% | Aceita — ADR-0010 |
| D-019 | `AllocationGap` usa valores atuais reconciliados e maiores restos para converter pesos em centavos sem perder a soma monetária | Aceita — ADR-0011 |
| D-020 | `ContributionAllocator` calcula necessidades sobre `portfolioValue + contribution` e distribui o aporte proporcionalmente por maiores restos, preservando sobra explícita | Aceita — ADR-0012 |
| D-021 | Política de aporte limita destinos por maior necessidade pós-aporte e elimina alocações abaixo de um mínimo monetário, redistribuindo por maiores restos | Aceita — ADR-0013 |
| D-022 | Restrições de execução do aporte usam `AssetId`, elegibilidade explícita e `AssetQuantity` mínima; bloqueios retornam valor para caixa sem redistribuir a decisão econômica | Aceita — ADR-0014 |
| D-023 | Limites de concentração por `AssetClass` usam `softMaxWeight` como alerta e `hardMaxWeight` como teto obrigatório; valor bloqueado retorna para a sobra sem redistribuição | Aceita — ADR-0015 |
| D-024 | Custos conhecidos e impacto tributário reservado consomem o orçamento bruto do destino; se igualarem ou superarem a alocação, o destino é bloqueado e o valor retorna para caixa | Aceita — ADR-0016 |
| D-025 | O pipeline canônico de aporte é orquestrado sem reimplementar regras e produz snapshot serializável com `methodologyVersion`, reason codes e provenance das etapas | Aceita — ADR-0017 |
| D-026 | Onboarding financeiro é configuração declarativa separada de `Portfolio`, autenticação e saldos; risco/horizonte são taxonomias explícitas e nunca alteram alocação automaticamente | Aceita — ADR-0018 |
| D-027 | Antes de autenticação, somente `FinancialProfileSnapshot` pode usar persistência local opt-in, versionada e revalidada pelo domínio; essa conveniência não substitui PostgreSQL server-side futuro | Aceita — ADR-0019 |
| D-028 | Autenticação usa Auth.js v5 com GitHub OAuth e sessão server-side; identidade canônica é separada dos IDs financeiros e login/logout não migram nem apagam automaticamente o perfil local | Aceita — ADR-0020 |
| D-029 | Toda persistência privada usa ownership derivado da sessão no servidor e reforçado por chaves/FKs compostas; conexão e schema brutos não são API de aplicação | Aceita — ADR-0021 |
| D-030 | Migração do `FinancialProfileSnapshot` local para a conta é opt-in, revalidada pelo domínio, preserva a cópia local e trata conflito antes de qualquer substituição server-side | Aceita — ADR-0019/0020/0021 |
| D-031 | Asset Master preserva `AssetId` como identidade; listings atuais/históricos e identificadores externos carregam provenance, e matching exato retorna `UNMATCHED`, `PARTIAL_MATCH`, `MATCH` ou `CONFLICT` sem dedupe heurístico | Aceita — ADR-0022 |
| D-032 | Market Data vive em package próprio; snapshots materiais usam decimal exato, provenance e `asOf`, freshness/cache são independentes, e fallback só ocorre para falhas explicitamente autorizadas | Aceita — ADR-0023 |
| D-033 | Investment Engine mantém Quality, Opportunity e Dividend separados, usa metodologias versionadas por classe/setor, bloqueia missing/stale/conflict/look-ahead e exige valuation auditável para Opportunity | Aceita — ADR-0024 |
| D-034 | Portfolio Fit consome contexto da mesma carteira e permanece separado de Quality/Opportunity; ranking preserva componentes, rejeita dados/contextos incompatíveis e desempata por `AssetId` canônico | Aceita — ADR-0025 |
| D-035 | `InvestmentThesis` é snapshot imutável/versionado; fatos carregam provenance, mudanças materiais exigem review `REVISED` ligada à nova versão e stale/invalidação são estados explícitos da timeline | Aceita — ADR-0026 |
| D-036 | Conteúdo externo de IA é sempre `UNTRUSTED_EXTERNAL_CONTENT` com autoridade de instrução `NONE`; fontes são allowlisted, prompt injection suspeito é quarantined antes do classifier e dedupe/classificação permanecem auditáveis | Aceita — ADR-0027 |
| D-037 | A arquitetura visual do app deriva do Protótipo 3/R1: sidebar persistente apenas quando comportada, drawer/sheet em viewports menores, informação técnica em progressive disclosure e nenhuma rota, métrica ou UI de Copiloto fictícia pode ser criada para reproduzir o mockup | Aceita — `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md` |
| D-038 | A fundação visual de `apps/web` usa semantic CSS tokens e React primitives canônicas; novos controles fundamentais não podem recriar styling por feature, R2 não adiciona biblioteca visual externa e Lucide outline é a família de ícones de referência quando glyphs reais entrarem | Aceita — `docs/design/DESIGN-SYSTEM.md` |
| D-039 | Superfícies protegidas usam um único `AppShell`: sidebar em desktop e drawer em viewports menores, navegação só para capabilities reais, e somente `displayName` atravessa para a ilha client da navegação | Aceita — `docs/design/APP-SHELL.md` |
| D-040 | Sign-in/sign-out usam focused auth fora do AppShell; GitHub permanece provider, a CTA principal é única, privacidade/segurança ficam em progressive disclosure e o redesign não altera callback safety, identidade ou ownership | Aceita — `docs/design/AUTH-SESSION.md` |
| D-041 | O onboarding R5 preserva reducer, validações e `FinancialProfileSnapshot`; progressão é orientação subordinada ao AppShell, controles vêm das primitives R2, persistência continua opt-in/second-order e objetivos usam seções abertas sem card-in-card | Aceita — `docs/design/ONBOARDING.md` |
| D-042 | A primeira produção é pessoal/privada em Vercel + Neon: runtime usa conexão pooled, migrations usam conexão direta explícita, GitHub OAuth exige allowlist fail-closed em produção e o Production Contract permanece desabilitado até validação operacional real | Aceita — ADR-0028 |
| D-043 | Checks automatizados de produção usam `CHECK_DATABASE_URL` em banco PostgreSQL isolado e nunca fazem fallback para credenciais/banco de produção; migration/verify de produção recebem ambiente administrativo separado e explícito | Aceita — refinamento operacional de ADR-0028 |

## Estado operacional da D-042

A condição de ativação prevista pela D-042 foi satisfeita em 31/08/2026 por #99 / PR #100, após validação de migration, liveness/readiness, autenticação allowlisted, `prod:verify` e restore-check isolado. O Production Contract está ativo para uso pessoal/controlado.

A D-043 adiciona uma fronteira operacional sem mudar a topologia da D-042: `.dev-dashboard/.env.check.local` pertence somente a check/testes, enquanto `.dev-dashboard/.env.production.local` pertence somente a migration/verify locais de produção. O provider não recebe nenhum desses arquivos. O `prod:check` pode iniciar o PostgreSQL declarado no Compose apenas quando o endpoint configurado é o bind local canônico na porta `5433`; indisponibilidade remota ou em outro endpoint não autoriza efeitos locais automáticos.

Isso **não substitui** a D-011: produto público, multi-tenancy, uso por terceiros e monetização continuam bloqueados pelo Regulatory Gate da #50.

## Como alterar uma decisão

1. não apagar o histórico;
2. registrar nova decisão e motivo;
3. quando arquitetural, criar/superseder ADR;
4. atualizar documentos e tarefas afetados;
5. adicionar migração/version bump quando houver impacto de dados/metodologia;
6. quando uma decisão anterior for refinada sem novo ADR, deixar a evolução explícita neste índice e no contrato canônico correspondente.
