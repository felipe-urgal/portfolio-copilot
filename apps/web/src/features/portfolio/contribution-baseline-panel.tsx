"use client";

import { useState, type FormEvent } from "react";

import { Money, type MoneySnapshot, type PortfolioSnapshot } from "@portfolio-copilot/domain";

import {
  Alert,
  Button,
  EmptyState,
  Field,
  FieldError,
  HelpText,
  Label,
  Status,
  Surface,
  TextInput,
} from "@/components/ui";

import {
  createContributionBaselineSnapshot,
  createInitialContributionBaselineDraft,
  type ContributionBaselineDraft,
  type ContributionBaselineFieldErrors,
  type ContributionBaselineSnapshot,
  type ContributionClassDraft,
} from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { ContributionConcentrationSection } from "./contribution-concentration-section";
import {
  createContributionPolicySnapshot,
  createInitialContributionPolicyDraft,
  type ContributionPolicyAllocationStatus,
  type ContributionPolicyDraft,
  type ContributionPolicyFieldErrors,
  type ContributionPolicySnapshot,
} from "./contribution-policy-form";
import { assetClassLabel, type LocalAssetSnapshot } from "./local-asset-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionBaselinePanelProps = Readonly<{
  portfolio: PortfolioSnapshot;
  assets?: readonly LocalAssetSnapshot[];
  initialBaseline?: ContributionBaselineSnapshot | null;
  initialPolicy?: ContributionPolicySnapshot | null;
  initialConcentration?: ContributionConcentrationSnapshot | null;
}>;

type ContributionRowField = "targetWeight" | "currentValue";
type PolicyField = keyof ContributionPolicyDraft;

function moneyLabel(snapshot: MoneySnapshot): string {
  const money = Money.fromSnapshot(snapshot);
  return `${money.currency.toString()} ${money.toDecimalString()}`;
}

function policyStatusLabel(status: ContributionPolicyAllocationStatus | undefined): string {
  if (status === "KEPT") return "Mantida";
  if (status === "REMOVED") return "Removida pela política";
  if (status === "NO_BASELINE") return "Sem baseline";
  return "Não aplicada";
}

function policyStatusTone(
  status: ContributionPolicyAllocationStatus | undefined,
): "neutral" | "success" | "warning" {
  if (status === "KEPT") return "success";
  if (status === "REMOVED") return "warning";
  return "neutral";
}

function contributionStatusLabel(
  baseline: ContributionBaselineSnapshot | null,
  policy: ContributionPolicySnapshot | null,
): string {
  if (baseline === null) return "Base manual";
  if (policy === null) return "Baseline validado";
  return "Política aplicada";
}

function contributionStatusTone(
  baseline: ContributionBaselineSnapshot | null,
  policy: ContributionPolicySnapshot | null,
): "neutral" | "info" | "success" {
  if (baseline === null) return "neutral";
  if (policy === null) return "info";
  return "success";
}

function ErrorMessage({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;
  return <FieldError id={id}>{message}</FieldError>;
}

export function ContributionBaselinePanel({
  portfolio,
  assets = [],
  initialBaseline = null,
  initialPolicy = null,
  initialConcentration = null,
}: ContributionBaselinePanelProps) {
  const [draft, setDraft] = useState<ContributionBaselineDraft>(
    createInitialContributionBaselineDraft,
  );
  const [errors, setErrors] = useState<ContributionBaselineFieldErrors>({});
  const [baseline, setBaseline] = useState<ContributionBaselineSnapshot | null>(initialBaseline);
  const [policyDraft, setPolicyDraft] = useState<ContributionPolicyDraft>(
    createInitialContributionPolicyDraft,
  );
  const [policyErrors, setPolicyErrors] = useState<ContributionPolicyFieldErrors>({});
  const [policy, setPolicy] = useState<ContributionPolicySnapshot | null>(initialPolicy);

  const statusLabel = contributionStatusLabel(baseline, policy);
  const policyByClass = new Map(
    policy?.allocations.map((allocation) => [allocation.assetClass, allocation] as const) ?? [],
  );

  function invalidateBaseline(): void {
    setErrors({});
    setBaseline(null);
    setPolicyDraft(createInitialContributionPolicyDraft());
    setPolicyErrors({});
    setPolicy(null);
  }

  function updateField(field: "portfolioValue" | "contribution", value: string): void {
    setDraft((current) => ({ ...current, [field]: value }));
    invalidateBaseline();
  }

  function updateRow(
    assetClass: ContributionClassDraft["assetClass"],
    field: ContributionRowField,
    value: string,
  ): void {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.assetClass === assetClass ? { ...row, [field]: value } : row,
      ),
    }));
    invalidateBaseline();
  }

  function updatePolicyField(field: PolicyField, value: string): void {
    setPolicyDraft((current) => ({ ...current, [field]: value }));
    setPolicyErrors({});
    setPolicy(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionBaselineSnapshot(draft, portfolio);

    if (!result.ok) {
      setErrors(result.errors);
      setBaseline(null);
      setPolicy(null);
      return;
    }

    setBaseline(result.snapshot);
    setErrors({});
    setPolicyDraft(createInitialContributionPolicyDraft());
    setPolicyErrors({});
    setPolicy(null);
  }

  function handlePolicySubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (baseline === null) return;

    const result = createContributionPolicySnapshot(policyDraft, baseline);

    if (!result.ok) {
      setPolicyErrors(result.errors);
      setPolicy(null);
      return;
    }

    setPolicy(result.snapshot);
    setPolicyErrors({});
  }

  return (
    <section aria-labelledby="contribution-baseline-title">
      <Surface padding="lg" className={styles.surface}>
        <div className={styles.heading}>
          <div>
            <h2 id="contribution-baseline-title">Baseline do aporte</h2>
            <p>
              Valide a base monetária, aplique política e concentração e só então configure destinos
              locais de execução. Nenhuma etapa converte quantidades do ledger em valor de mercado.
            </p>
          </div>
          <Status tone={contributionStatusTone(baseline, policy)}>{statusLabel}</Status>
        </div>

        <div className={styles.layout}>
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <Alert tone="warning" title="Base monetária manual">
              Estes valores são declarados por você e não representam cotação, valuation ou
              patrimônio derivado de Market Data. TargetAllocation, base, política, concentração,
              destinos e resultados existem apenas nesta sessão.
            </Alert>

            <div className={styles.fieldRow}>
              <Field>
                <Label htmlFor="contribution-portfolio-value">Total da base manual</Label>
                <TextInput
                  id="contribution-portfolio-value"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft.portfolioValue}
                  invalid={errors.portfolioValue !== undefined}
                  aria-describedby={
                    errors.portfolioValue
                      ? "contribution-portfolio-value-error"
                      : "contribution-portfolio-value-help"
                  }
                  onChange={(event) => updateField("portfolioValue", event.target.value)}
                />
                <HelpText id="contribution-portfolio-value-help">
                  Precisa reconciliar com a soma dos valores atuais por classe em{" "}
                  {portfolio.referenceCurrency}.
                </HelpText>
                <ErrorMessage
                  id="contribution-portfolio-value-error"
                  message={errors.portfolioValue}
                />
              </Field>

              <Field>
                <Label htmlFor="contribution-amount">Novo aporte</Label>
                <TextInput
                  id="contribution-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft.contribution}
                  invalid={errors.contribution !== undefined}
                  aria-describedby={
                    errors.contribution ? "contribution-amount-error" : "contribution-amount-help"
                  }
                  onChange={(event) => updateField("contribution", event.target.value)}
                />
                <HelpText id="contribution-amount-help">
                  Valor em {portfolio.referenceCurrency}; zero é válido para inspecionar o baseline
                  atual.
                </HelpText>
                <ErrorMessage id="contribution-amount-error" message={errors.contribution} />
              </Field>
            </div>

            <div className={styles.matrixHeading}>
              <div>
                <h3>Alvo e valores atuais</h3>
                <p>
                  Peso vazio deixa a classe fora do alvo. Valor atual vazio não cria bucket
                  monetário.
                </p>
              </div>
            </div>

            <div className={styles.tableScroller}>
              <table className={styles.inputTable}>
                <thead>
                  <tr>
                    <th scope="col">Classe econômica</th>
                    <th scope="col">Peso-alvo (%)</th>
                    <th scope="col">Valor atual declarado</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.rows.map((row) => {
                    const label = assetClassLabel(row.assetClass);
                    const targetId = `contribution-target-${row.assetClass.toLowerCase()}`;
                    const currentId = `contribution-current-${row.assetClass.toLowerCase()}`;

                    return (
                      <tr key={row.assetClass}>
                        <th scope="row">{label}</th>
                        <td>
                          <Label className={styles.visuallyHidden} htmlFor={targetId}>
                            Peso-alvo de {label}
                          </Label>
                          <TextInput
                            id={targetId}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={row.targetWeight}
                            invalid={errors.targetAllocation !== undefined}
                            aria-describedby={
                              errors.targetAllocation ? "target-allocation-error" : undefined
                            }
                            onChange={(event) =>
                              updateRow(row.assetClass, "targetWeight", event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <Label className={styles.visuallyHidden} htmlFor={currentId}>
                            Valor atual declarado de {label}
                          </Label>
                          <TextInput
                            id={currentId}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={row.currentValue}
                            invalid={errors.currentValues !== undefined}
                            aria-describedby={errors.currentValues ? "current-values-error" : undefined}
                            onChange={(event) =>
                              updateRow(row.assetClass, "currentValue", event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ErrorMessage id="target-allocation-error" message={errors.targetAllocation} />
            <ErrorMessage id="current-values-error" message={errors.currentValues} />
            {errors.form ? <FieldError>{errors.form}</FieldError> : null}

            <Button type="submit">Calcular baseline do aporte</Button>
          </form>

          <div className={styles.result} aria-live="polite">
            <div className={styles.resultHeading}>
              <h3>Baseline, política, concentração e execução</h3>
              <p>
                O allocator define o baseline econômico; política, concentração e execução refinam
                esse plano validado sem reescrever sua necessidade pós-aporte.
              </p>
            </div>

            {baseline === null ? (
              <EmptyState
                title="Baseline ainda não calculado"
                description="A política só fica disponível depois que TargetAllocation, base atual e aporte formam um ContributionPlan válido."
              />
            ) : (
              <>
                <dl className={styles.summary}>
                  <div>
                    <dt>Base atual</dt>
                    <dd>{moneyLabel(baseline.portfolioValue)}</dd>
                  </div>
                  <div>
                    <dt>Aporte</dt>
                    <dd>{moneyLabel(baseline.contribution)}</dd>
                  </div>
                  <div>
                    <dt>Após aporte</dt>
                    <dd>{moneyLabel(baseline.postContributionValue)}</dd>
                  </div>
                  <div>
                    <dt>Sobra no baseline</dt>
                    <dd>{moneyLabel(baseline.unallocatedContribution)}</dd>
                  </div>
                </dl>

                <section className={styles.policySection} aria-labelledby="contribution-policy-title">
                  <div className={styles.policyHeading}>
                    <h4 id="contribution-policy-title">Política operacional</h4>
                    <p>
                      Defina o mínimo monetário significativo e quantas classes podem receber o
                      aporte. A seleção e a redistribuição permanecem no domínio.
                    </p>
                  </div>

                  <form className={styles.policyForm} noValidate onSubmit={handlePolicySubmit}>
                    <div className={styles.fieldRow}>
                      <Field>
                        <Label htmlFor="minimum-meaningful-contribution">Mínimo significativo</Label>
                        <TextInput
                          id="minimum-meaningful-contribution"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={policyDraft.minimumMeaningfulContribution}
                          invalid={policyErrors.minimumMeaningfulContribution !== undefined}
                          aria-describedby={
                            policyErrors.minimumMeaningfulContribution
                              ? "minimum-meaningful-contribution-error"
                              : "minimum-meaningful-contribution-help"
                          }
                          onChange={(event) =>
                            updatePolicyField("minimumMeaningfulContribution", event.target.value)
                          }
                        />
                        <HelpText id="minimum-meaningful-contribution-help">
                          Valor em {portfolio.referenceCurrency}; zero desativa o corte por mínimo.
                        </HelpText>
                        <ErrorMessage
                          id="minimum-meaningful-contribution-error"
                          message={policyErrors.minimumMeaningfulContribution}
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="max-contribution-destinations">Limite de destinos</Label>
                        <TextInput
                          id="max-contribution-destinations"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={policyDraft.maxDestinationsPerContribution}
                          invalid={policyErrors.maxDestinationsPerContribution !== undefined}
                          aria-describedby={
                            policyErrors.maxDestinationsPerContribution
                              ? "max-contribution-destinations-error"
                              : "max-contribution-destinations-help"
                          }
                          onChange={(event) =>
                            updatePolicyField("maxDestinationsPerContribution", event.target.value)
                          }
                        />
                        <HelpText id="max-contribution-destinations-help">
                          Inteiro positivo; o domínio prioriza classes por necessidade pós-aporte.
                        </HelpText>
                        <ErrorMessage
                          id="max-contribution-destinations-error"
                          message={policyErrors.maxDestinationsPerContribution}
                        />
                      </Field>
                    </div>

                    {policyErrors.form ? <FieldError>{policyErrors.form}</FieldError> : null}
                    <Button type="submit">Aplicar política ao baseline</Button>
                  </form>

                  {policy !== null ? (
                    <dl className={styles.policySummary}>
                      <div>
                        <dt>Mínimo aplicado</dt>
                        <dd>{moneyLabel(policy.minimumMeaningfulContribution)}</dd>
                      </div>
                      <div>
                        <dt>Máximo de destinos</dt>
                        <dd>{policy.maxDestinationsPerContribution}</dd>
                      </div>
                      <div>
                        <dt>Sobra após política</dt>
                        <dd>{moneyLabel(policy.unallocatedContribution)}</dd>
                      </div>
                    </dl>
                  ) : null}
                </section>

                <div className={styles.tableScroller}>
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        <th scope="col">Classe</th>
                        <th scope="col">Alvo</th>
                        <th scope="col">Atual</th>
                        <th scope="col">Necessidade</th>
                        <th scope="col">Baseline</th>
                        <th scope="col">Após política</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baseline.allocations.map((allocation) => {
                        const policyAllocation = policyByClass.get(allocation.assetClass);

                        return (
                          <tr key={allocation.assetClass}>
                            <th scope="row">{assetClassLabel(allocation.assetClass)}</th>
                            <td>{allocation.targetWeightPercent}%</td>
                            <td>{moneyLabel(allocation.currentValue)}</td>
                            <td>{moneyLabel(allocation.postContributionNeed)}</td>
                            <td className={styles.baselineAmount}>
                              {moneyLabel(allocation.allocatedAmount)}
                            </td>
                            <td className={styles.policyAmount}>
                              {policyAllocation === undefined
                                ? "—"
                                : moneyLabel(policyAllocation.policyAllocatedAmount)}
                            </td>
                            <td>
                              <Status tone={policyStatusTone(policyAllocation?.status)}>
                                {policyStatusLabel(policyAllocation?.status)}
                              </Status>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {policy !== null ? (
                  <ContributionConcentrationSection
                    baseline={baseline}
                    policy={policy}
                    assets={assets}
                    initialConcentration={initialConcentration}
                  />
                ) : null}

                <div className={styles.resultFootnotes}>
                  <p className={styles.resultFootnote}>
                    “Removida pela política” significa que o domínio zerou a alocação final daquela
                    classe. A UI não atribui uma causa isolada entre mínimo e limite porque o contrato
                    atual não expõe reason code específico.
                  </p>
                  <p className={styles.resultFootnote}>
                    Concentração pode apenas sinalizar soft limit ou bloquear novo valor no hard
                    limit. Execução recebe somente o valor pós-concentração e nenhuma etapa calcula
                    quantidade de compra ou usa preço de mercado.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </Surface>
    </section>
  );
}
