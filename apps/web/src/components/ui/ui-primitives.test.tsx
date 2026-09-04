import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Alert,
  Button,
  ChoiceCard,
  Disclosure,
  EmptyState,
  Field,
  FieldError,
  HelpText,
  Icon,
  Label,
  LinkButton,
  LoadingState,
  Metric,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Skeleton,
  Status,
  TextInput,
} from "./index";

const TOKENS = readFileSync(new URL("../../styles/tokens.css", import.meta.url), "utf8");
const BUTTON_SOURCE = readFileSync(new URL("./button.tsx", import.meta.url), "utf8");
const UI_CSS = readFileSync(new URL("./ui.module.css", import.meta.url), "utf8");

describe("canonical UI primitives", () => {
  it("keeps loading actions disabled without replacing their accessible label", () => {
    const html = renderToStaticMarkup(
      <Button loading aria-busy={false}>
        Salvar perfil
      </Button>,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain("Salvar perfil");
  });

  it("keeps small buttons visually compact without shrinking the canonical touch target", () => {
    const button = renderToStaticMarkup(<Button size="sm">Ação compacta</Button>);
    const link = renderToStaticMarkup(
      <LinkButton href="/dashboard" size="sm">
        Link compacto
      </LinkButton>,
    );

    expect(button).toContain("Ação compacta");
    expect(link).toContain("Link compacto");
    expect(BUTTON_SOURCE).toContain("sm: classNames(styles.buttonSm, styles.buttonMd)");
    expect(UI_CSS).toMatch(/\.buttonSm\s*\{[\s\S]*?font-size: var\(--font-size-xs\);/);
    expect(UI_CSS).toMatch(/\.buttonMd\s*\{\s*min-height: var\(--control-height-md\);\s*\}/);
    expect(TOKENS).toContain("--control-height-md: 2.75rem;");
  });

  it("renders a disabled LinkButton as non-navigable content without losing its accessible label", () => {
    const html = renderToStaticMarkup(
      <LinkButton href="/dashboard" disabled aria-label="Dashboard indisponível">
        Abrir dashboard
      </LinkButton>,
    );

    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Dashboard indisponível"');
    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain("<a");
  });

  it("preserves canonical help descriptions alongside validation feedback", () => {
    const inputHtml = renderToStaticMarkup(
      <Field>
        <Label htmlFor="monthly-contribution" required>
          Aporte mensal
        </Label>
        <TextInput
          id="monthly-contribution"
          name="monthlyContribution"
          required
          invalid
          aria-describedby="monthly-contribution-error"
        />
        <HelpText id="monthly-contribution-help">Informe o valor disponível.</HelpText>
        <FieldError id="monthly-contribution-error">Valor inválido.</FieldError>
      </Field>,
    );

    const selectHtml = renderToStaticMarkup(
      <Field>
        <Label htmlFor="reference-currency">Moeda de referência</Label>
        <Select id="reference-currency" invalid aria-describedby="reference-currency-error">
          <option value="BRL">BRL</option>
        </Select>
        <HelpText id="reference-currency-help">Use a moeda da carteira.</HelpText>
        <FieldError id="reference-currency-error">Moeda inválida.</FieldError>
      </Field>,
    );

    expect(inputHtml).toContain('for="monthly-contribution"');
    expect(inputHtml).toContain('aria-invalid="true"');
    expect(inputHtml).toContain(
      'aria-describedby="monthly-contribution-help monthly-contribution-error"',
    );
    expect(inputHtml).toContain('role="alert"');
    expect(selectHtml).toContain(
      'aria-describedby="reference-currency-help reference-currency-error"',
    );
  });

  it("does not guess help associations when a Field has multiple controls", () => {
    const html = renderToStaticMarkup(
      <Field>
        <TextInput id="lower-bound" aria-describedby="lower-error" />
        <TextInput id="upper-bound" aria-describedby="upper-error" />
        <HelpText id="range-help">Informe os dois limites.</HelpText>
      </Field>,
    );

    expect(html).toContain('id="lower-bound"');
    expect(html).toContain('id="upper-bound"');
    expect(html.match(/aria-describedby="lower-error"/gu)).toHaveLength(1);
    expect(html.match(/aria-describedby="upper-error"/gu)).toHaveLength(1);
    expect(html).not.toContain('aria-describedby="range-help lower-error"');
    expect(html).not.toContain('aria-describedby="range-help upper-error"');
  });

  it("uses native controls for choice cards and segmented options", () => {
    const html = renderToStaticMarkup(
      <div>
        <ChoiceCard
          name="risk"
          value="balanced"
          defaultChecked
          title="Equilibrado"
          description="Aceita oscilações com disciplina."
        />
        <SegmentedControl legend="Horizonte">
          <SegmentedControlOption name="horizon" value="medium" defaultChecked>
            Médio prazo
          </SegmentedControlOption>
          <SegmentedControlOption name="horizon" value="long">
            Longo prazo
          </SegmentedControlOption>
        </SegmentedControl>
      </div>,
    );

    expect(html).toContain('type="radio"');
    expect(html).toContain('name="risk"');
    expect(html).toContain("Horizonte");
    expect(html).toContain("Médio prazo");
  });

  it("avoids implicit empty-state headings and supports explicit section levels", () => {
    const nested = renderToStaticMarkup(
      <EmptyState title="Sem itens" description="Cadastre o primeiro item." />,
    );
    const topLevel = renderToStaticMarkup(
      <EmptyState
        headingLevel={2}
        title="Perfil não configurado"
        description="Configure o perfil para continuar."
      />,
    );
    const deepSection = renderToStaticMarkup(
      <EmptyState
        headingLevel={4}
        title="Baseline pendente"
        description="Calcule o baseline para continuar."
      />,
    );

    expect(nested).toContain("<p");
    expect(nested).toContain(">Sem itens</p>");
    expect(nested).not.toContain("<h2");
    expect(nested).not.toContain("<h3");
    expect(topLevel).toContain(">Perfil não configurado</h2>");
    expect(deepSection).toContain(">Baseline pendente</h4>");
  });

  it("keeps progressive disclosure native and preserves optional summary context", () => {
    const html = renderToStaticMarkup(
      <Disclosure
        summary="Detalhes auditáveis"
        summaryAside={<Status tone="warning">Stale</Status>}
        open
      >
        <p>Provenance e reason codes.</p>
      </Disclosure>,
    );

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Detalhes auditáveis");
    expect(html).toContain("Stale");
    expect(html).toContain("Provenance e reason codes.");
    expect(html).toContain('open=""');
  });

  it("keeps financial values and feedback explicit in markup", () => {
    const html = renderToStaticMarkup(
      <div>
        <Metric
          label="Disponível para aporte"
          value="R$ 1.250,00"
          detail="Após custos conhecidos"
        />
        <Status tone="warning">Dados desatualizados</Status>
        <Alert tone="danger" title="Não foi possível calcular">
          Atualize os dados necessários antes de continuar.
        </Alert>
      </div>,
    );

    expect(html).toContain("R$ 1.250,00");
    expect(html).toContain("Dados desatualizados");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Não foi possível calcular");
  });

  it("keeps loading and skeleton semantics explicit", () => {
    const loading = renderToStaticMarkup(<LoadingState data-state="loading" />);
    const skeleton = renderToStaticMarkup(<Skeleton data-state="placeholder" />);

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(skeleton).toContain('aria-hidden="true"');
  });

  it("separates decorative and labelled icon semantics", () => {
    const decorative = renderToStaticMarkup(
      <Icon>
        <svg viewBox="0 0 24 24">
          <path d="M4 12h16" />
        </svg>
      </Icon>,
    );
    const labelled = renderToStaticMarkup(
      <Icon label="Informação">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
        </svg>
      </Icon>,
    );

    expect(decorative).toContain('aria-hidden="true"');
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="Informação"');
  });
});

describe("canonical design tokens", () => {
  it("defines the semantic contracts required by R2", () => {
    for (const token of [
      "--color-canvas",
      "--color-surface",
      "--color-text-primary",
      "--color-accent",
      "--color-success",
      "--color-warning",
      "--color-danger",
      "--focus-ring-width",
      "--layout-content-wide",
      "--motion-duration-standard",
    ]) {
      expect(TOKENS).toContain(token);
    }
  });

  it("keeps focus and muted text on the reviewed accessible baseline", () => {
    expect(TOKENS).toContain("--color-focus-ring: #4f46e5;");
    expect(TOKENS).toContain("--color-text-muted: #6b7280;");
  });

  it("has a reduced-motion contract at the token boundary", () => {
    expect(TOKENS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(TOKENS).toContain("--motion-duration-standard: 1ms");
  });
});
