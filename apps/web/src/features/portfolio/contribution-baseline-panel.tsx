"use client";

import { useState, type FormEvent } from "react";

import { Money, type MoneySnapshot, type PortfolioSnapshot } from "@portfolio-copilot/domain";

import {
  createContributionBaselineSnapshot,
  createInitialContributionBaselineDraft,
  type ContributionBaselineDraft,
  type ContributionBaselineFieldErrors,
  type ContributionBaselineSnapshot,
  type ContributionClassDraft,
} from "./contribution-baseline-form";
import {
  createContributionPolicySnapshot,
  createInitialContributionPolicyDraft,
  type ContributionPolicyAllocationStatus,
  type ContributionPolicyDraft,
  type ContributionPolicyFieldErrors,
  type ContributionPolicySnapshot,
} from "./contribution-policy-form";
import { assetClassLabel } from "./local-asset-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionBaselinePanelProps = Readonly<{
  portfolio: PortfolioSnapshot;
  initialBaseline?: ContributionBaselineSnapshot | null;
  initialPolicy?: ContributionPolicySnapshot | null;
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

function ErrorText({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}

export function ContributionBaselinePanel({
  portfolio,
  initialBaseline = null,
  initialPolicy = null,
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

  const statusLabel =
    policy !== null ? "Política aplicada" : baseline !== null ? "Baseline validado" : "Base manual";
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
    <section className={styles.surface} aria-labelledby="contribution-baseline-title">
      <div className={styles.heading}>
        <div>
          <h2 id="contribution-baseline-title">Baseline do aporte</h2>
          <p>
            Valide a base monetária e depois aplique a política de microaporte e limite de destinos.
            Nenhuma etapa converte quantidades do ledger em valor de mercado.
          </p>
        </div>
        <span className={styles.status}>{statusLabel}</span>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.manualNotice}>
            <strong>Base monetária manual</strong>
            <p>
              Estes valores são declarados por você e não representam cotação, valuation ou
              patrimônio derivado de Market Data. TargetAllocation, base, política e resultados
              existem apenas nesta sessão.
            </p>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="contribution-portfolio-value">Total da base manual</label>
              <input
                id="contribution-portfolio-value"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={draft.portfolioValue}
                aria-invalid={errors.portfolioValue !== undefined}
                aria-describedby={
                  errors.portfolioValue
                    ? "contribution-portfolio-value-error"
                    : "contribution-portfolio-value-help"
                }
                onChange={(event) => updateField("portfolioValue", event.target.value)}
              />
              <p className={styles.helpText} id="contribution-portfolio-value-help">
                Precisa reconciliar com a soma dos valores atuais por classe em{" "}
                {portfolio.referenceCurrency}.
              </p>
              <ErrorText id="contribution-portfolio-value-error" message={errors.portfolioValue} />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="contribution-amount">Novo aporte</label>
              <input
                id="contribution-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={draft.contribution}
                aria-invalid={errors.contribution !== undefined}
                aria-describedby={
                  errors.contribution ? "contribution-amount-error" : "contribution-amount-help"
                }
                onChange={(event) => updateField("contribution", event.target.value)}
              />
              <p className={styles.helpText} id="contribution-amount-help">
                Valor em {portfolio.referenceCurrency}; zero é válido para inspecionar o baseline
                atual.
              </p>
              <ErrorText id="contribution-amount-error" message={errors.contribution} />
            </div>
          </div>

          <div className={styles.matrixHeading}>
            <div>
              <h3>Alvo e valores atuais</h3>
              <p>
                Peso vazio deixa a classe fora do alvo. Valor atual vazio não cria bucket monetário.
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
                        <label className={styles.visuallyHidden} htmlFor={targetId}>
                          Peso-alvo de {label}
                        </label>
                        <input
                          id={targetId}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={row.targetWeight}
                          aria-invalid={errors.targetAllocation !== undefined}
                          aria-describedby={
                            errors.targetAllocation ? "target-allocation-error" : undefined
                          }
                          onChange={(event) =>
                            updateRow(row.assetClass, "targetWeight", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <label className={styles.visuallyHidden} htmlFor={currentId}>
                          Valor atual declarado de {label}
                        </label>
                        <input
                          id={currentId}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={row.currentValue}
                          aria-invalid={errors.currentValues !== undefined}
                          aria-describedby={
                            errors.currentValues ? "current-values-error" : undefined
                          }
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

          <ErrorText id="target-allocation-error" message={errors.targetAllocation} />
          <ErrorText id="current-values-error" message={errors.currentValues} />

          {errors.form ? (
            <p className={styles.formError} role="alert">
              {errors.form}
            </p>
          ) : null}

          <button className={styles.primaryAction} type="submit">
            Calcular baseline do aporte
          </button>
        </form>

        <div className={styles.result} aria-live="polite">
          <div className={styles.resultHeading}>
            <h3>Baseline x política</h3>
            <p>
              O allocator define o baseline econômico; a política só restringe destinos e
              microaportes sobre esse plano validado.
            </p>
          </div>

          {baseline === null ? (
            <div className={styles.emptyResult}>
              <strong>Baseline ainda não calculado</strong>
              <p>
                A política só fica disponível depois que TargetAllocation, base atual e aporte
                formam um ContributionPlan válido.
              </p>
            </div>
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
                    <div className={styles.fieldGroup}>
                      <label htmlFor="minimum-meaningful-contribution">
                        Mínimo significativo
                      </label>
                      <input
                        id="minimum-meaningful-contribution"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={policyDraft.minimumMeaningfulContribution}
                        aria-invalid={policyErrors.minimumMeaningfulContribution !== undefined}
                        aria-describedby={
                          policyErrors.minimumMeaningfulContribution
                            ? "minimum-meaningful-contribution-error"
                            : "minimum-meaningful-contribution-help"
                        }
                        onChange={(event) =>
                          updatePolicyField("minimumMeaningfulContribution", event.target.value)
                        }
                      />
                      <p className={styles.helpText} id="minimum-meaningful-contribution-help">
                        Valor em {portfolio.referenceCurrency}; zero desativa o corte por mínimo.
                      </p>
                      <ErrorText
                        id="minimum-meaningful-contribution-error"
                        message={policyErrors.minimumMeaningfulContribution}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="max-contribution-destinations">Limite de destinos</label>
                      <input
                        id="max-contribution-destinations"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={policyDraft.maxDestinationsPerContribution}
                        aria-invalid={policyErrors.maxDestinationsPerContribution !== undefined}
                        aria-describedby={
                          policyErrors.maxDestinationsPerContribution
                            ? "max-contribution-destinations-error"
                            : "max-contribution-destinations-help"
                        }
                        onChange={(event) =>
                          updatePolicyField("maxDestinationsPerContribution", event.target.value)
                        }
                      />
                      <p className={styles.helpText} id="max-contribution-destinations-help">
                        Inteiro positivo; o domínio prioriza classes por necessidade pós-aporte.
                      </p>
                      <ErrorText
                        id="max-contribution-destinations-error"
                        message={policyErrors.maxDestinationsPerContribution}
                      />
                    </div>
                  </div>

                  {policyErrors.form ? (
                    <p className={styles.formError} role="alert">
                      {policyErrors.form}
                    </p>
                  ) : null}

                  <button className={styles.primaryAction} type="submit">
                    Aplicar política ao baseline
                  </button>
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
                            <span
                              className={styles.policyState}
                              data-status={policyAllocation?.status ?? "NOT_APPLIED"}
                            >
                              {policyStatusLabel(policyAllocation?.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className={styles.resultFootnote}>
                “Removida pela política” significa que o domínio zerou a alocação final daquela
                classe. A UI não atribui uma causa isolada entre mínimo e limite porque o contrato
                atual não expõe reason code específico.
              </p>
              <p className={styles.resultFootnote}>
                Nenhuma etapa escolhe ativo, calcula quantidade ou usa preço de mercado.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
