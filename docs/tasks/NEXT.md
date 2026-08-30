# Próxima Atividade — UX/UI R6: implementar dashboard baseado no Protótipo 3

**Status:** READY após merge da #77 / PR #88

## Issue canônica

- #78 — `UX/UI R6: implementar dashboard baseado no Protótipo 3`
- iniciativa guarda-chuva: #69

## Fundação concluída

O R6 parte das principais estruturas do produto já padronizadas:

- #72 — R0 audit do frontend anterior;
- #73 — R1 arquitetura da informação + direção do Protótipo 3;
- #74 — R2 design tokens e primitives canônicas;
- #75 — R3 AppShell/sidebar/navegação responsiva;
- #76 — R4 focused auth e sessão;
- #77 — R5 onboarding guiado sobre primitives R2;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`.

O Dashboard é a superfície mais diretamente representada pelo Protótipo 3, mas a implementação deve usar somente fatos realmente disponíveis no sistema. A aparência do mockup é referência de hierarchy/composição, não autorização para inventar patrimônio, retorno, market data, teses, eventos ou recomendações.

## Objetivo do R6

Transformar `/dashboard` em um workspace financeiro reconhecível como a direção aprovada: panorama primeiro, atenção/próxima ação depois e informação técnica somente em segunda ordem.

## Escopo

### Contexto inicial

- greeting/contexto curto quando houver fonte real;
- estado do onboarding/perfil financeiro;
- próxima ação segura e concreta;
- nenhuma limitação técnica do MVP como título dominante da página.

### KPIs

- compactos e somente para métricas calculáveis a partir de fontes reais;
- ausência de dado não vira `R$ 0`, número ilustrativo ou placeholder enganoso;
- quando necessário, usar estado explícito de `não calculável` com ação possível;
- primitives `Metric` / `FinancialValue` quando compatíveis.

### Panorama da carteira

- principal bloco analítico da página quando houver carteira/dados;
- composição, posição agregada, target vs. atual e gaps somente quando derivados de fontes existentes;
- estados vazios orientam criação/configuração em vez de preencher layout com dados fictícios;
- provenance/IDs/reason codes ficam em detalhe e não na primeira hierarquia.

### Atenção e próximos passos

- completar perfil;
- criar/configurar carteira;
- registrar transações;
- revisar aporte quando houver baseline real;
- stale/missing data quando realmente detectado;
- teses/eventos somente quando capacidades reais já existirem e houver dado disponível.

### Copiloto/context rail

- respeitar a arquitetura Assistant-First do R1;
- não inventar a UI funcional da #45;
- context rail pode existir somente como composição neutra útil ou para capacidade real já entregue;
- nenhuma resposta falsa, sugestão gerada ou CTA que simule inteligência inexistente.

### Estados e responsive

- desktop/tablet/mobile;
- empty/loading/error/stale quando aplicável;
- layout central permanece dominante quando context rail deixa de caber;
- nenhuma informação essencial depende de hover;
- usar tokens/primitives R2 e AppShell R3.

## Regras

- não inventar market data, patrimônio, retorno, score ou recomendação;
- não usar números do Protótipo 3 como seed funcional;
- não criar rota/capability fictícia para completar a composição;
- não reabrir AppShell, auth ou onboarding;
- não iniciar redesign completo da Carteira (#79);
- não implementar a #45 como efeito colateral;
- preservar ownership e fontes de verdade atuais;
- qualquer agente de IA deve cumprir `AGENTS.md`, inclusive auto code review fullstack sênior completo antes do merge.

## Gate

R7 (#79) só começa quando:

- Dashboard priorizar panorama/contexto/próxima ação em vez de limitações técnicas;
- todos os números visíveis tiverem fonte real e determinística;
- ausência de dados estiver representada honestamente;
- layout estiver alinhado ao Protótipo 3 sem capabilities falsas;
- desktop/mobile estiverem definidos no código;
- `pnpm check` estiver verde;
- CI do head final estiver verde;
- auto code review fullstack sênior estiver concluído, com findings corrigidos e nenhum finding aberto;
- docs/issues estiverem reconciliados conforme `docs/DOCUMENTATION-MAP.md`.

## Sequência

```text
#72 R0 audit ✓
  -> #73 R1 app spec ✓
  -> #74 R2 design system ✓
  -> #75 R3 AppShell/sidebar ✓
  -> #76 R4 auth ✓
  -> #77 R5 onboarding ✓
  -> #78 R6 dashboard
  -> #79 R7 carteira
  -> #80 R8 estados transversais
  -> #81 R9 accessibility/responsive/fidelity QA
  -> R10 fechamento da #69
```

## Referências canônicas

- `AGENTS.md`;
- `docs/DOCUMENTATION-MAP.md`;
- `docs/design/PROTOTYPE-3-DIRECTION.md`;
- `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`;
- `docs/design/DESIGN-SYSTEM.md`;
- `docs/design/APP-SHELL.md`;
- `docs/design/AUTH-SESSION.md`;
- `docs/design/ONBOARDING.md`;
- `docs/UX-UI-REDESIGN-ROADMAP.md`;
- `docs/ROADMAP.md`.

A #45 continua sem UI funcional temporária durante o redesign. Qualquer futura superfície de Copiloto deve nascer sobre os contratos visuais fechados e sobre dados estruturados reais.
