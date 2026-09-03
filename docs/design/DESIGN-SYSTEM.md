# Design System — tokens e primitives canônicas

## Status

**R2 — FUNDAÇÃO CANÔNICA**  
Issue: #74  
Iniciativa: #69  
Arquitetura de produto: `docs/design/R1-ASSISTANT-FIRST-APP-SPEC.md`

Este documento define a fundação visual reutilizável de `apps/web`. Ele não é um framework interno e não substitui componentes de domínio. Seu objetivo é impedir que cada feature recrie cor, spacing, foco, botão, input, feedback, loading e composição básica.

## 1. Ownership

A fundação está em:

```text
apps/web/src/styles/tokens.css
apps/web/src/components/ui/
```

Imports de consumo usam:

```ts
import { Button, Container, Field, TextInput } from "@/components/ui";
```

`globals.css` importa os semantic tokens e estabelece o baseline global de tipografia, canvas e `focus-visible`.

## 2. Regra central

Novas superfícies não devem criar valores fundamentais locais quando já existir um semantic token ou primitive correspondente.

Isso inclui principalmente:

- cor de canvas/surface/text/border/accent;
- feedback success/warning/danger/info;
- focus ring;
- spacing estrutural;
- radius e elevation;
- duração/easing de motion;
- content width/gutter;
- button/input/select;
- status, alert, empty e loading;
- apresentação tipográfica de valores financeiros.

CSS Modules continuam permitidos para composição específica de feature, anatomy própria e casos de domínio que não sejam primitive compartilhada.

## 3. Tokens

### 3.1 Typography

Família base:

```text
--font-family-sans
--font-family-mono
```

Escala:

```text
--font-size-xs
--font-size-sm
--font-size-md
--font-size-lg
--font-size-xl
--font-size-2xl
--font-size-3xl
--font-size-4xl
```

Também são canônicos:

- `--line-height-*`;
- `--font-weight-*`;
- `--letter-spacing-*`.

Não criar `font-size: 13px`, `font-weight: 720` ou tracking local em componente novo apenas para obter uma variação visual pequena. Primeiro verificar se a hierarchy existente resolve o caso.

### 3.2 Spacing

A escala canônica é:

```text
--space-0
--space-1
--space-2
--space-3
--space-4
--space-5
--space-6
--space-8
--space-10
--space-12
--space-16
--space-20
```

`Stack`, `Cluster` e `Grid` expõem nomes semânticos (`xs`, `sm`, `md`, `lg`, etc.) mapeados para essa escala. Features não precisam conhecer os valores físicos para compor páginas.

### 3.3 Layout

```text
--layout-gutter
--layout-content-narrow
--layout-content
--layout-content-wide
--layout-grid-sm
--layout-grid-md
--layout-grid-lg
--layout-grid-xl
```

Uso esperado:

- `narrow`: auth, formulários guiados e leitura controlada;
- `content`: páginas de conteúdo intermediário;
- `wide`: workspaces analíticos, dashboard e carteira.

Breakpoints de shell pertencem a R3. R2 fornece apenas contratos de conteúdo e composição responsiva básica.

### 3.4 Geometry

```text
--radius-xs ... --radius-xl
--radius-full
--control-height-sm/md/lg
--touch-target-min
--icon-size-sm/md/lg
```

O target mínimo adotado para controles principais é `2.75rem`/44px. WCAG 2.2 AA não exige 44px para todo alvo, mas esse valor é a base ergonômica do produto financeiro e reduz inconsistência entre mouse e touch.

### 3.5 Semantic colors

Não existe uma palette pública de “indigo-500”, “gray-300” etc. Components novos consomem intenção:

```text
--color-canvas
--color-surface
--color-surface-subtle
--color-surface-strong
--color-text-primary
--color-text-secondary
--color-text-muted
--color-border-subtle
--color-border-strong
--color-accent
--color-accent-hover
--color-accent-active
--color-accent-soft
```

Feedback:

```text
--color-info*
--color-success*
--color-warning*
--color-danger*
```

Cor é complementar. `success`, `warning`, `danger` e `stale` continuam precisando de texto/semântica; nunca comunicar estado financeiro apenas por cor.

### 3.6 Focus

```text
--color-focus-ring
--focus-ring-width
--focus-ring-offset
```

O baseline global usa `:focus-visible`. Primitives de controle reforçam o mesmo contrato quando precisam combinar border + outline.

Não remover outline sem substituição equivalente.

### 3.7 Elevation

```text
--shadow-sm
--shadow-md
--shadow-lg
```

Elevation é restrita. `Surface` usa `sm` ou `md` conforme a variante; features não devem adicionar sombras decorativas em cada card.

### 3.8 Motion

```text
--motion-duration-fast
--motion-duration-standard
--motion-duration-slow
--motion-easing-standard
--motion-easing-emphasized
```

`prefers-reduced-motion: reduce` reduz as durações no boundary dos tokens. Animations contínuas de `Spinner` e `Skeleton` também são desativadas explicitamente.

Motion deve explicar estado, não decorar o produto.

### 3.9 Layering

```text
--z-base
--z-sticky
--z-overlay
--z-modal
--z-toast
```

Esses níveis existem para evitar números arbitrários quando R3 introduzir drawer/sidebar/context rail. Não criar novos níveis sem necessidade arquitetural concreta.

## 4. Primitives

### `Container`

Controla gutter e largura máxima.

```tsx
<Container size="wide">...</Container>
```

Variantes: `narrow | content | wide`.

### `Stack`

Composição vertical com spacing canônico.

```tsx
<Stack space="lg">...</Stack>
```

### `Cluster`

Composição horizontal com wrap, alignment e justification.

```tsx
<Cluster align="center" justify="between">...</Cluster>
```

### `Grid`

Grid fluido baseado em largura mínima sem breakpoints locais por feature.

```tsx
<Grid minimum="md" space="lg">...</Grid>
```

`minimum` não representa quantidade fixa de colunas. O browser distribui o conteúdo conforme a largura disponível.

### `PageHeader`

Header de página com `h1`, descrição opcional e ações.

Não oferece eyebrow/badge por padrão. Essa restrição preserva a hierarchy do R1 e evita labels decorativos acima de todo título.

### `Button`

Variantes:

```text
primary
secondary
ghost
danger
```

Tamanhos:

```text
sm
md
lg
```

`loading`:

- preserva o label visível/acessível;
- define `aria-busy`;
- desabilita a ação;
- não troca o texto por “carregando”, evitando perda de contexto e layout shift.

### `LinkButton`

Tem a mesma família visual de `Button`, mas navega via Next.js `Link`.

Quando `disabled`, renderiza conteúdo não navegável em vez de um `<a href>` aparentemente desabilitado.

### `Field`, `Label`, `HelpText`, `FieldError`

São primitives de composição e feedback de formulário.

IDs permanecem explícitos no consumidor:

```tsx
<Field>
  <Label htmlFor="amount" required>
    Aporte
  </Label>
  <TextInput
    id="amount"
    required
    invalid={hasError}
    aria-describedby="amount-help amount-error"
  />
  <HelpText id="amount-help">Valor disponível para o aporte.</HelpText>
  {hasError ? <FieldError id="amount-error">Informe um valor válido.</FieldError> : null}
</Field>
```

A fundação não usa Context/hook para ligar IDs implicitamente. Isso mantém o componente simples, SSR-friendly e auditável no markup.

### `TextInput` / `Select`

Centralizam:

- border;
- background;
- typography;
- hover;
- focus-visible;
- disabled;
- invalid/error.

`invalid` define `aria-invalid=true`. `required`, `aria-describedby`, `name`, autocomplete e demais semantics continuam sendo responsabilidade da feature porque dependem do campo real.

### `ChoiceCard`

Existe porque o onboarding atual e o R1 usam escolhas com título/descrição. A aparência é customizada, mas o controle continua sendo `<input type="radio|checkbox">` nativo e focusable.

### `SegmentedControl` / `SegmentedControlOption`

Existe para escolhas mutuamente exclusivas realmente compactas. Internamente continua sendo fieldset + legend + radios nativos.

Não usar segmented control para navegação, tabs ou listas longas.

### `Surface`

Unidade de superfície intencional, não autorização para transformar cada seção em card.

Tones:

```text
default
subtle
elevated
```

Padding:

```text
none
sm
md
lg
```

Antes de usar `Surface`, verificar se whitespace + heading já resolvem a separação.

### `Status`

Semântica de estado. Tones:

```text
neutral
info
success
warning
danger
```

Possui marcador visual além do texto, mas o texto continua obrigatório para significado.

### `Badge`

Metadata/taxonomia curta. Tones restritos a `neutral | accent` para evitar usar badge como substituto de feedback semântico.

### `Alert`

Feedback contextual com título obrigatório.

- `danger` usa `role=alert` por padrão;
- `info`, `success` e `warning` usam `role=status` por padrão;
- o consumidor pode sobrescrever `role` quando a semântica do fluxo exigir.

### `EmptyState`

Contrato:

1. título: o que não existe;
2. descrição: por que importa / contexto;
3. ação opcional: ação real disponível;
4. ícone opcional.

Como empty states normalmente vivem dentro de uma região já titulada, o título usa `h3` por padrão. Quando o próprio empty state inicia a primeira subseção diretamente abaixo do `h1` da página, o consumidor deve declarar `headingLevel={2}`. O nível altera somente a semântica do heading; classe, hierarchy visual e spacing permanecem iguais.

Não usar `headingLevel` para obter tamanho visual diferente e não usar empty state para feature futura inexistente.

### `LoadingState`

Loading textual com `role=status`, `aria-live=polite` e spinner decorativo.

### `Skeleton`

Variantes:

```text
text
block
circle
```

Skeleton é `aria-hidden`. Se o usuário precisa saber que algo está carregando, fornecer também um status acessível no contexto apropriado.

### `FinancialValue`

Somente apresentação de número **já formatado/calculado**.

Ele fornece:

- números tabulares;
- hierarchy de tamanho;
- tones `default | positive | negative | muted`.

Ele não:

- calcula dinheiro;
- converte moeda;
- arredonda;
- infere sinal;
- decide se um valor é positivo/negativo.

Essas decisões continuam em domínio/application/formatters confiáveis.

### `Metric`

Composição de `label + FinancialValue + detail`.

Não usar para preencher layout com KPI inexistente. R1 continua prevalecendo: uma métrica só aparece quando existe fonte/cálculo real.

### `Icon`

Normaliza sizing, alinhamento e accessibility de SVGs.

Contrato:

- sem `label`: decorativo, `aria-hidden`;
- com `label`: wrapper recebe `role=img` e `aria-label`;
- SVG filho é sempre retirado separadamente da árvore acessível para evitar anúncio duplicado.

#### Família de ícones

A referência canônica é **Lucide, estilo outline**. R2 não adiciona `lucide-react` porque nenhuma tela está sendo migrada e não existe necessidade concreta de glyph em produção neste PR. A primeira fase que consumir ícones deve usar glyphs Lucide de forma consistente; não misturar famílias.

A dependência só deve ser adicionada se o consumo real justificar, com lockfile e supply-chain review normais do repositório.

## 5. Estados por primitive

| Primitive | hover | focus | active | selected | disabled | loading | error/success |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Button | ✓ | ✓ | ✓ | n/a | ✓ | ✓ | via variant/context |
| LinkButton | ✓ | ✓ | ✓ | n/a | ✓ | n/a | via context |
| TextInput/Select | ✓ | ✓ | n/a | n/a | ✓ | n/a | invalid ✓ |
| ChoiceCard | ✓ | ✓ | n/a | ✓ | ✓ | n/a | via field feedback |
| SegmentedControlOption | ✓ | ✓ | n/a | ✓ | ✓ | n/a | via field feedback |
| Status | n/a | n/a | n/a | n/a | n/a | n/a | tones ✓ |
| Alert | n/a | n/a | n/a | n/a | n/a | n/a | tones ✓ |
| Skeleton | n/a | n/a | n/a | n/a | n/a | ✓ | n/a |

## 6. Accessibility

R2 estabelece:

- `focus-visible` canônico;
- native inputs para choice/segmented;
- `fieldset` + `legend` no segmented control;
- `aria-invalid` explícito;
- error com role acessível;
- disabled real em `Button`;
- link disabled sem `href`;
- status de loading acessível;
- ícone decorativo fora da árvore acessível;
- icon label sem duplicidade;
- hierarquia de heading preservada em `EmptyState`, com `h3` subordinado por padrão e `h2` explícito quando a região exigir;
- touch target base de 44px;
- reduced motion;
- feedback que não depende somente de cor.

R9 continua responsável pelo audit WCAG 2.2 AA integrado de todas as jornadas.

## 7. Responsive

R2 não define o AppShell. Ele fornece:

- gutter fluido;
- content widths;
- grid auto-fit;
- wrap em `Cluster`;
- PageHeader que empilha em viewport estreito;
- segmented control que empilha no mobile;
- controls com largura segura.

Sidebar/drawer/context rail e breakpoints arquiteturais pertencem a #75.

## 8. O que não pertence ao design system

Não colocar em `components/ui`:

- cálculos financeiros;
- formatação monetária de domínio;
- fetch/server actions;
- ownership/auth;
- regras de portfolio;
- score/recommendation/thesis logic;
- estado de feature;
- componentes que só existem em uma única tela e não representam primitive;
- copy de negócio específica;
- reason-code mapping;
- dados de mock para “demonstrar” o design.

## 9. Migração

A migração é progressiva:

```text
R2 fundação
  -> R3 AppShell
  -> R4 auth
  -> R5 onboarding
  -> R6 dashboard
  -> R7 carteira
  -> R8 estados/componentes restantes
```

CSS Modules antigos não são reescritos em massa no R2. Eles deixam de ser autoridade visual à medida que cada superfície é migrada.

A partir do merge da #74:

- novos componentes fundamentais usam tokens/primitives;
- não criar novo botão/input/status/focus ring local;
- um gap real na fundação deve ser resolvido aqui ou documentado, não contornado com uma segunda implementação;
- componentes de domínio podem compor primitives e acrescentar apenas anatomy específica.

## 10. Exemplo de composição

```tsx
<Container size="wide">
  <Stack space="xl">
    <PageHeader
      title="Carteira"
      description="Acompanhe posições, alocação e próximos passos."
      actions={<Button>Registrar transação</Button>}
    />

    <Grid minimum="lg" space="lg">
      <Surface>
        <Metric label="Patrimônio" value="R$ 100.000,00" />
      </Surface>

      <Surface>
        <Status tone="warning">Dados de preço desatualizados</Status>
      </Surface>
    </Grid>
  </Stack>
</Container>
```

Os valores acima são **apenas exemplo de documentação**, não dados de runtime e não devem ser copiados para uma superfície produtiva.

## 11. Gate do R2

R2 pode ser considerado concluído quando:

- tokens estiverem carregados globalmente;
- primitives estiverem exportadas por `@/components/ui`;
- estados essenciais tiverem implementação compartilhada;
- tests validarem contracts semânticos;
- reduced motion estiver definido no boundary;
- documentação explicar ownership e anti-patterns;
- `pnpm check` estiver verde;
- auto code review não tiver finding aberto;
- #75 puder montar AppShell/sidebar sem criar styling fundamental paralelo.