# R1 — Assistant-First App Specification

## Status

**APROVADO PARA IMPLEMENTAÇÃO EM R2/R3 APÓS MERGE DA #73**

Issue: #73  
Iniciativa: #69  
Direção visual canônica: `docs/design/PROTOTYPE-3-DIRECTION.md`  
Audit de origem: `docs/design/FRONTEND-AUDIT.md`

Este documento transforma o **Protótipo 3 — Assistant-First Workspace** em uma especificação de arquitetura da informação, composição, estados e comportamento responsivo para o app inteiro.

O R1 não implementa componentes nem escolhe valores finais de tokens. Ele define contratos de produto suficientes para que R2 e R3 sejam executados sem decisões visuais ad hoc por feature.

---

## 1. Objetivo da experiência

O Portfolio Copilot deve responder visualmente a três perguntas, nesta ordem:

1. **Qual é a minha situação?**
2. **O que merece atenção agora?**
3. **Qual é a próxima ação segura e explicável?**

A interface não deve parecer:

- painel de administração;
- terminal técnico;
- coleção genérica de cards;
- chat com recursos financeiros ao redor;
- corretora ou tela de execução de ordens.

A interface deve parecer um **workspace financeiro confiável, contemporâneo e orientado a decisão**, em que o Copiloto complementa o produto sem substituir navegação, regras determinísticas ou fontes de verdade.

---

## 2. Princípios de arquitetura da informação

### 2.1 Uma tarefa principal por contexto

Cada superfície possui uma intenção dominante:

- `Dashboard`: entender situação e próximos passos;
- `Carteira`: consultar e manter fatos da carteira;
- `Onboarding`: declarar e revisar contexto financeiro;
- `Auth`: entrar, sair ou recuperar sessão;
- `Copiloto`: explicar contexto disponível e orientar navegação/decisão sem executar regras financeiras.

Informação operacional, provenance, segurança e detalhes técnicos continuam acessíveis, mas não disputam a primeira ordem visual.

### 2.2 Navegação representa capacidades reais

O Protótipo 3 mostra uma taxonomia futura mais ampla. A implementação deve respeitar essa direção sem criar rotas vazias.

Itens podem entrar na navegação somente quando houver uma superfície funcional real. A taxonomia alvo é:

```text
Principal
  Dashboard
  Carteira

Análise — entra progressivamente conforme features reais existirem
  Ativos
  Teses
  Eventos
  Relatórios

Configuração
  Onboarding / Perfil financeiro
  Configurações

Utilities
  Saúde / diagnóstico, quando necessário
```

Enquanto uma capacidade não possuir superfície real, ela não aparece como item desabilitado apenas para completar o mockup.

### 2.3 Contexto técnico usa progressive disclosure

Itens como:

- sessão local vs. persistida;
- provenance;
- timestamps `asOf` e `retrievedAt`;
- reason codes;
- IDs canônicos;
- health de providers;
- metodologia/versionamento;

aparecem como segunda ou terceira ordem, acessíveis por detalhe, disclosure, tooltip quando apropriado ou área de auditoria.

O estado principal deve ser descrito em linguagem de produto.

---

## 3. App shell canônico

### 3.1 Desktop

O desktop preserva a arquitetura visual fundamental do Protótipo 3:

```text
┌───────────────┬───────────────────────────────────────┬──────────────────┐
│ Sidebar       │ Main workspace                        │ Context rail     │
│               │                                       │ / Copiloto       │
│ Brand         │ Page context                          │ quando existir   │
│ Primary nav   │ Primary task                          │ capacidade real  │
│ Secondary nav │ Supporting information                │                  │
│               │                                       │                  │
│ Account       │                                       │                  │
└───────────────┴───────────────────────────────────────┴──────────────────┘
```

Regras:

- sidebar persistente em desktop amplo;
- marca no topo da sidebar;
- item ativo inequívoco;
- conta/sessão no rodapé da sidebar;
- conteúdo principal é dominante;
- context rail é opcional e nunca reduz o conteúdo principal abaixo de uma largura funcional;
- `skip-to-content` permanece obrigatório;
- utilities não entram no mesmo peso visual da navegação financeira.

### 3.2 Laptop compacto

Quando a largura não comportar três regiões confortavelmente:

- sidebar pode reduzir largura e densidade;
- labels nunca somem se isso comprometer descoberta da navegação;
- context rail deixa de ser persistente antes de comprimir o workspace principal;
- Copiloto/contexto abre como painel temporário à direita.

### 3.3 Tablet

- sem sidebar persistente larga;
- header compacto com brand, título/contexto e gatilho de navegação;
- navegação abre em drawer;
- conteúdo usa uma coluna principal ou duas colunas apenas quando os cards permanecerem legíveis;
- Copiloto abre como drawer/sheet e não ocupa largura permanente.

### 3.4 Mobile

```text
┌────────────────────────┐
│ Header compacto        │
├────────────────────────┤
│ Page context           │
│                        │
│ Primary content        │
│                        │
│ Supporting sections    │
│                        │
├────────────────────────┤
│ optional task actions  │
└────────────────────────┘
```

Regras:

- uma coluna;
- navegação em drawer;
- ações críticas permanecem próximas da tarefa, não em floating chrome permanente sem necessidade;
- tabelas financeiras devem migrar para padrões responsivos de row/card/detail, nunca exigir zoom lateral como solução principal;
- Copiloto abre como bottom sheet ou tela contextual;
- nenhuma informação essencial depende de hover;
- touch targets devem ser tratados como requisito de design system em R2.

---

## 4. Grid, container e densidade

R1 define comportamento; R2 define tokens exatos.

### 4.1 Tipos de página

**Analytical workspace** — Dashboard e visão geral da Carteira:

- maior largura útil;
- múltiplas regiões apenas em desktop;
- escaneabilidade de números e estados;
- whitespace organiza a hierarquia antes de borders/cards.

**Guided flow** — Onboarding e formulários materiais:

- largura de leitura/controlada;
- uma decisão principal por bloco;
- progresso sempre visível sem competir com conteúdo;
- erros próximos aos campos + resumo quando necessário.

**Focused auth** — Sign-in/sign-out/re-entry:

- sem sidebar;
- composição centralizada ou split discreto;
- um CTA primário;
- explicações de privacidade/segurança em segunda ordem.

### 4.2 Density model

- `calm`: auth e confirmações;
- `guided`: onboarding e edição;
- `analytical`: dashboard;
- `operational`: carteira, ledger e manutenção de ativos.

A densidade muda pela natureza da tarefa, não por cada feature inventar spacing e typography próprios.

---

## 5. Direção visual sistematizada

### 5.1 Cor

- base clara e neutra;
- texto escuro de alto contraste;
- indigo/violeta como accent restrito;
- feedback positivo/negativo/alerta possui semântica própria;
- cor nunca é o único mecanismo para transmitir estado financeiro;
- gradients não são necessários para identidade do sistema.

### 5.2 Tipografia

- sans-serif contemporânea e legível;
- escala tipográfica pequena e explícita;
- números financeiros recebem hierarchy própria;
- body operacional não deve ficar pequeno demais por tentativa de aumentar densidade;
- pesos arbitrários por feature deixam de existir em R2.

### 5.3 Superfícies

Usar superfície/card quando existe uma unidade real:

- KPI;
- composição da carteira;
- tese/evento;
- conjunto de ações relacionadas;
- painel do Copiloto;
- formulário material.

Não criar card para cada parágrafo, aviso ou seção apenas para marcar separação.

### 5.4 Iconografia

R2 deve escolher uma única família de ícones outline/contemporânea.

Regras:

- ícones servem descoberta e semântica;
- nenhuma mistura de estilos filled/outline aleatória;
- significado não depende só do ícone;
- ícone decorativo usa tratamento acessível apropriado.

---

## 6. Sign-in / Sign-out / Re-entry

### 6.1 Sign-in

Tarefa única: **entrar com GitHub**.

Composição:

```text
Brand

Entre para continuar
Descrição curta do produto/sessão

[ Entrar com GitHub ]

Privacidade e segurança
  disclosure secundário

Erro de autenticação, quando existir
```

Remover da primeira hierarquia:

- CTA de `/health`;
- explicação longa de cookies/tokens;
- detalhes de armazenamento local repetidos;
- badges decorativos de “segurança”.

Preservar em segunda ordem:

- informação de que o Portfolio Copilot não recebe a senha do GitHub;
- separação entre autenticação e perfil financeiro local;
- erro seguro, sem vazamento de detalhe sensível.

### 6.2 Sign-out

- contexto claro da conta ativa;
- ação de sair inequívoca;
- retorno/cancelamento simples;
- sem dramatizar a operação com alertas visuais excessivos;
- explicar efeitos somente quando realmente relevantes.

### 6.3 Sessão expirada / re-entry

- explicar que a sessão precisa ser renovada;
- preservar callback seguro;
- permitir reentrada sem parecer erro financeiro;
- nunca expor token, cookie ou detalhe interno.

---

## 7. Onboarding

O onboarding mantém a lógica de domínio existente, mas passa a usar o shell e a linguagem canônicos.

### 7.1 Estrutura desktop

```text
AppShell
  └─ Main
      ├─ PageHeader: Perfil financeiro
      ├─ Step progress
      └─ Guided form surface
          ├─ pergunta/decisão atual
          ├─ ajuda contextual curta
          ├─ controles
          ├─ validation
          └─ Back / Continue
```

O rail vertical atual deixa de ser uma segunda arquitetura de navegação do produto. O progresso pode permanecer lateral apenas em desktop se estiver visualmente subordinado ao `AppShell`; caso contrário, usar stepper horizontal/compacto.

### 7.2 Etapas

A ordem funcional atual deve ser preservada salvo finding de domínio específico. R5 pode ajustar micro-agrupamentos, mas não deve mudar significado dos dados.

Padrões:

- choices com rótulo e descrição curta;
- segmented controls somente para escolhas realmente compactas;
- metas editáveis como unidades claras, sem cards dentro de cards;
- review final apresenta snapshot legível antes de confirmação;
- estado salvo/persistido aparece de forma discreta.

### 7.3 Mobile

- stepper compacto;
- uma pergunta dominante por viewport quando possível;
- botões de continuar/voltar com touch target adequado;
- goals e choices empilham sem diminuir texto;
- nenhum rail sticky ocupa largura lateral.

---

## 8. Dashboard

O Protótipo 3 continua sendo a referência visual direta, mas o conteúdo precisa obedecer aos dados reais.

### 8.1 Ordem de informação

1. contexto/greeting curto;
2. KPIs **somente quando calculáveis**;
3. panorama da carteira;
4. situação que requer atenção;
5. teses/eventos/próximos passos quando houver dados reais;
6. Copiloto/context rail quando a capacidade existir.

### 8.2 Métricas ausentes

Não criar KPI com `R$ 0`, `--` ou número ilustrativo para preencher layout.

Quando não houver fonte suficiente:

- omitir a métrica se ela não é essencial;
- ou apresentar estado semanticamente explícito de `não calculável`, com ação possível quando houver;
- não transformar a ausência em um card dominante repetitivo.

### 8.3 Panorama central

A região principal pode apresentar, conforme disponibilidade real:

- composição por classe;
- posição/valor agregado;
- target vs. atual;
- gaps;
- contribuição planejada;
- evolução histórica apenas quando snapshots históricos confiáveis existirem.

### 8.4 Contexto e próximos passos

O dashboard deve transformar estado em ação:

- completar perfil;
- criar carteira;
- registrar transações;
- revisar aporte;
- revisar tese stale;
- entender bloqueio de concentração/dado insuficiente.

Reason codes determinísticos podem alimentar copy, mas não aparecem como códigos técnicos na primeira ordem.

---

## 9. Carteira

A Carteira deixa de ser um workspace único com todas as tarefas simultâneas e passa a usar **progressive disclosure por tarefa**.

### 9.1 Arquitetura interna

```text
Carteira
  Overview
  Ativos e posições
  Transações
  Aporte
  Configuração
```

Essa estrutura pode ser implementada inicialmente como navegação local/tabs/sections dentro de `/portfolio`; rotas adicionais só surgem se houver benefício real de URL/estado e sem quebrar ownership atual.

### 9.2 Overview

Prioriza:

- identidade/nome/moeda da carteira;
- estado da alocação;
- posições resumidas;
- target vs. atual quando calculável;
- avisos relevantes de missing/stale/concentração;
- CTA contextual para a próxima tarefa.

IDs técnicos e provenance ficam em detalhe.

### 9.3 Ativos e posições

- catálogo e posição não parecem a mesma coisa;
- quantidade, classe e contexto financeiro têm hierarchy explícita;
- asset identity canônica permanece preservada nos detalhes;
- estado `sem posição` é diferente de `ativo não encontrado` e de `dado de preço ausente`.

### 9.4 Transações

- ledger continua sendo fonte de fatos;
- criar transação e consultar histórico não disputam o mesmo peso;
- tipo, data, quantidade, preço/valor e ativo precisam ser escaneáveis;
- erro de validação nunca vira fato parcial silencioso.

### 9.5 Aporte

O pipeline existente deve ser exposto como jornada inteligível:

```text
Contexto / baseline
  -> política
  -> concentração
  -> custos/restrições
  -> recomendação determinística
  -> explicação
  -> execução/conclusão registrada
```

A interface não deve sugerir que o sistema executa ordem em corretora. “Execução” aqui significa conclusão/registro do plano conforme contrato existente.

### 9.6 Configuração

Agrupa opções menos frequentes e detalhes técnicos da carteira, sem ocupar o overview principal.

---

## 10. Copiloto / Context rail

### 10.1 Papel

O Copiloto é uma camada de **explicação, síntese e orientação**, não fonte de verdade financeira.

Ele pode:

- explicar estado calculado;
- resumir fatos estruturados;
- apontar o que está stale/missing;
- navegar para a tarefa relevante;
- resumir tese/eventos com fonte;
- responder perguntas sobre contexto autorizado.

Ele não pode:

- recalcular números críticos fora dos engines;
- mudar regra financeira;
- criar fato a partir de texto não validado;
- executar ordens;
- transformar output de LLM em source of truth.

### 10.2 Presença por viewport

**Desktop amplo:** context rail à direita quando houver capacidade real.  
**Laptop/tablet:** painel temporário/drawer.  
**Mobile:** bottom sheet ou tela contextual.

### 10.3 Ausência da feature #45

Até a UI funcional da #45 existir:

- o shell não deve exibir chat falso;
- R6 pode reservar arquitetura para o rail sem preencher com conteúdo de IA inventado;
- conteúdo determinístico de contexto pode usar uma região equivalente somente se claramente não for apresentado como conversa de IA.

---

## 11. Estados transversais

### Loading

- usar skeleton somente onde a estrutura já é conhecida;
- spinner isolado apenas para ações pequenas;
- loading não remove contexto da página inteira sem necessidade.

### Empty

Empty state descreve:

1. o que ainda não existe;
2. por que isso importa;
3. qual ação real pode resolver.

### Missing data

Diferenciar:

- dado não coletado;
- dado indisponível;
- dado não aplicável;
- dado não calculável por dependência ausente.

### Stale

- stale é estado de confiança, não erro genérico;
- mostrar data/contexto suficiente;
- impedir ou degradar ação quando regra de domínio exigir.

### Error

- mensagem próxima à tarefa;
- recuperação possível explícita;
- detalhes técnicos ficam em logs/diagnóstico, não no texto principal.

### Success

- feedback confirma o fato concluído;
- evitar toast como única confirmação para mudanças materiais;
- quando a mudança altera estado persistido, a nova informação deve aparecer no próprio contexto.

### Disabled

- disabled precisa ter motivo quando não for óbvio;
- não usar disabled para esconder uma feature futura.

---

## 12. Padrões de conteúdo

### Linguagem

Preferir:

- “Perfil financeiro incompleto” em vez de status interno;
- “Dados de preço desatualizados” em vez de enum técnica;
- “Não foi possível calcular” em vez de valor fictício;
- “Limite de concentração atingido” antes do reason code correspondente.

### Técnica/auditoria

A UI pode oferecer “Ver detalhes” para:

- provenance;
- metodologia;
- reason codes;
- timestamps;
- identificadores;
- origem de eventos/notícias;
- versão da tese.

Auditoria continua completa; apenas muda de hierarquia.

---

## 13. Accessibility desde o conceito

Requisitos que R2/R3 devem transformar em implementação:

- WCAG 2.2 AA;
- landmarks corretos;
- skip link;
- navegação keyboard-only completa;
- focus-visible consistente;
- ordem de foco segue ordem visual/lógica;
- drawers/sheets fazem focus management;
- estado não depende somente de cor;
- targets de toque adequados;
- labels e accessible names explícitos;
- charts possuem equivalente textual/tabular quando necessários;
- reduced motion respeitado globalmente;
- atualização assíncrona relevante anunciada sem excesso de live regions.

---

## 14. Responsive behavior matrix

| Elemento | Desktop amplo | Laptop | Tablet | Mobile |
| --- | --- | --- | --- | --- |
| Sidebar | persistente | persistente/compacta | drawer | drawer |
| Account/session | rodapé sidebar | rodapé sidebar | drawer/account menu | account menu |
| Context rail | persistente opcional | drawer opcional | drawer | bottom sheet/tela |
| KPI row | 3–4 colunas se houver dados | 2–4 | 2 | 1–2 conforme conteúdo |
| Portfolio overview | multi-coluna | 2 colunas | 1–2 | 1 |
| Onboarding | main + progress | main + progress | main | main |
| Tables | tabela | tabela adaptada | tabela/rows | rows/details |
| Forms | largura controlada | largura controlada | 1 coluna | 1 coluna |

Breakpoints exatos pertencem a R2/R3; o comportamento acima é canônico.

---

## 15. Padrões que R2 deve entregar

A partir desta especificação, #74 precisa fornecer no mínimo:

- semantic tokens de cor, tipografia, spacing, radius, elevation, focus e motion;
- `Container`, `Stack`, `Cluster`, `Grid`;
- `PageHeader`;
- `Button`/`LinkButton`;
- família de fields/input/select/help/error;
- choice/segmented patterns quando realmente necessários;
- `Surface` controlada;
- `Status`/`Badge` restritos;
- `Alert`;
- `EmptyState`;
- loading/skeleton;
- financial value/metric presentation;
- icon wrapper;
- responsive composition helpers suficientes para R3–R7.

O design system não deve virar framework genérico interno.

---

## 16. Mapeamento do frontend atual para a nova arquitetura

| Atual | Direção R1 |
| --- | --- |
| `ProductShell` topbar | AppShell com sidebar desktop e drawer mobile |
| onboarding com shell próprio | onboarding dentro do AppShell canônico |
| auth card técnico | focused auth com um CTA principal |
| dashboard centrado em limitações | panorama + ações, sem inventar dados |
| portfolio workspace monolítico | overview + tarefas progressivas |
| session/persistence banners repetidos | account/session pattern + disclosure contextual |
| pills/status locais | semantic status pattern restrito |
| form controls por feature | primitives canônicas |
| health na navegação principal/login | utility operacional secundária |

---

## 17. Desvios explícitos do Protótipo 3

São desvios necessários e aprovados:

1. **Não exibir rotas futuras vazias.** A sidebar cresce somente com capacidades reais.
2. **Não exibir métricas ilustrativas.** KPIs e gráficos dependem de fontes/cálculos verdadeiros.
3. **Não exibir Copiloto falso antes da #45.** A arquitetura reserva o rail, mas não simula inteligência inexistente.
4. **Auth não usa sidebar.** Antes da sessão, a jornada é focused auth na mesma linguagem visual.
5. **Mobile não replica sidebar comprimida.** Usa drawer/sheet por ergonomia.
6. **Informação de auditoria fica em segunda ordem.** Continua disponível e completa.

Esses desvios preservam a intenção do Protótipo 3 em vez de reproduzir literalmente conteúdo ilustrativo.

---

## 18. Gate de fidelidade para PRs visuais

Cada PR R3–R9 deve responder no corpo do PR:

- quais padrões do Protótipo 3/R1 foram aplicados;
- quais estados desktop/mobile foram validados;
- quais dados reais alimentam a superfície;
- quais dados do protótipo não foram reproduzidos por falta de fonte real;
- se houve desvio material;
- como keyboard/focus/responsive foram validados;
- screenshot/browser QA quando a fase exigir.

---

## 19. Critérios de aceite do R1

R1 está completo quando este documento estiver mergeado e:

- navigation model estiver definido sem rotas falsas;
- shell desktop/tablet/mobile estiver especificado;
- auth, onboarding, dashboard e portfolio tiverem conceitos completos;
- Copiloto tiver papel e comportamento responsivo definidos;
- loading/empty/error/success/missing/stale estiverem definidos;
- progressive disclosure de informação técnica estiver decidido;
- accessibility entrar como contrato desde R2;
- R2 conseguir criar tokens/primitives sem reabrir decisões de arquitetura de produto;
- R3 conseguir construir o shell sem redesenhar a navegação novamente.

Próximo gate: **#74 — R2 design tokens e primitives canônicas**.
