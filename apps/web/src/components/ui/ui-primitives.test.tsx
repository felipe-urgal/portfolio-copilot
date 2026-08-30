import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Alert,
  Button,
  ChoiceCard,
  Field,
  FieldError,
  HelpText,
  Icon,
  Label,
  LinkButton,
  Metric,
  SegmentedControl,
  SegmentedControlOption,
  Status,
  TextInput,
} from "./index";

const TOKENS = readFileSync(new URL("../../styles/tokens.css", import.meta.url), "utf8");

describe("canonical UI primitives", () => {
  it("keeps loading actions disabled without replacing their accessible label", () => {
    const html = renderToStaticMarkup(<Button loading>Salvar perfil</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain("Salvar perfil");
  });

  it("renders a disabled LinkButton as non-navigable content", () => {
    const html = renderToStaticMarkup(
      <LinkButton href="/dashboard" disabled>
        Abrir dashboard
      </LinkButton>,
    );

    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain("<a");
  });

  it("provides canonical field semantics for help and validation", () => {
    const html = renderToStaticMarkup(
      <Field>
        <Label htmlFor="monthly-contribution" required>
          Aporte mensal
        </Label>
        <TextInput
          id="monthly-contribution"
          name="monthlyContribution"
          required
          invalid
          aria-describedby="monthly-contribution-help monthly-contribution-error"
        />
        <HelpText id="monthly-contribution-help">Informe o valor disponível.</HelpText>
        <FieldError id="monthly-contribution-error">Valor inválido.</FieldError>
      </Field>,
    );

    expect(html).toContain('for="monthly-contribution"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(
      'aria-describedby="monthly-contribution-help monthly-contribution-error"',
    );
    expect(html).toContain('role="alert"');
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

  it("keeps financial values and feedback explicit in markup", () => {
    const html = renderToStaticMarkup(
      <div>
        <Metric label="Disponível para aporte" value="R$ 1.250,00" detail="Após custos conhecidos" />
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

  it("has a reduced-motion contract at the token boundary", () => {
    expect(TOKENS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(TOKENS).toContain("--motion-duration-standard: 1ms");
  });
});
