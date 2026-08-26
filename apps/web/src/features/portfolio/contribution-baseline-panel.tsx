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
import { assetClassLabel } from "./local-asset-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionBaselinePanelProps = Readonly<{
  portfolio: PortfolioSnapshot;
  initialBaseline?: ContributionBaselineSnapshot | null;
}>;

type ContributionRowField = "targetWeight" | "currentValue";

function moneyLabel(snapshot: MoneySnapshot): string {
  const money = Money.fromSnapshot(snapshot);
  return `${money.currency.toString()} ${money.toDecimalString()}`;
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
}: ContributionBaselinePanelProps) {
  const [draft, setDraft] = useState<ContributionBaselineDraft>(
    createInitialContributionBaselineDraft,
  );
  const [errors, setErrors] = useState<ContributionBaselineFieldErrors>({});
  const [baseline, setBaseline] = useState<ContributionBaselineSnapshot | null>(initialBaseline);

  function updateField(field: "portfolioValue" | "contribution", value: string): void {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors({});
    setBaseline(null);
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
    setErrors({});
    setBaseline(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionBaselineSnapshot(draft, portfolio);

    if (!result.ok) {
      setErrors(result.errors);
      setBaseline(null);
      return;
    }

    setBaseline(result.snapshot);
    setErrors({});
  }

  return (
    <section className={styles.surface} aria-labelledby="contribution-baseline-title">
      <div className={styles.heading}>
        <div>
          <h2 id="contribution-baseline-title">Baseline do aporte</h2>
          <p>
            Configure o alvo por classe e uma base monetária declarada manualmente. O cálculo não
            converte quantidades do ledger em valor de mercado.
          </p>
        </div>
        <span className={styles.status}>{baseline === null ? "Base manual" : "Calculado"}</span>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.manualNotice}>
            <strong>Base monetária manual</strong>
            <p>
              Estes valores são declarados por você e não representam cotação, valuation ou
              patrimônio derivado de Market Data.
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
                Precisa reconciliar com a soma dos valores atuais por classe em {portfolio.referenceCurrency}.
              </p>
              <ErrorText
                id="contribution-portfolio-value-error"
                message={errors.portfolioValue}
              />
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
                Valor em {portfolio.referenceCurrency}; zero é válido para inspecionar o baseline atual.
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
            <h3>Distribuição por AssetClass</h3>
            <p>O domínio calcula necessidade pós-aporte, baseline e sobra sem escolher um ativo.</p>
          </div>

          {baseline === null ? (
            <div className={styles.emptyResult}>
              <strong>Baseline ainda não calculado</strong>
              <p>
                Nenhum peso, valor atual, destino ou quantidade é inferido enquanto a base manual
                não for validada.
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
                  <dt>Sobra não alocada</dt>
                  <dd>{moneyLabel(baseline.unallocatedContribution)}</dd>
                </div>
              </dl>

              <div className={styles.tableScroller}>
                <table className={styles.resultTable}>
                  <thead>
                    <tr>
                      <th scope="col">Classe</th>
                      <th scope="col">Alvo</th>
                      <th scope="col">Atual</th>
                      <th scope="col">Necessidade pós-aporte</th>
                      <th scope="col">Baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseline.allocations.map((allocation) => (
                      <tr key={allocation.assetClass}>
                        <th scope="row">{assetClassLabel(allocation.assetClass)}</th>
                        <td>{allocation.targetWeightPercent}%</td>
                        <td>{moneyLabel(allocation.currentValue)}</td>
                        <td>{moneyLabel(allocation.postContributionNeed)}</td>
                        <td className={styles.baselineAmount}>
                          {moneyLabel(allocation.allocatedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className={styles.resultFootnote}>
                Baseline monetário por classe: não escolhe ativo, não calcula quantidade e não usa
                preço de mercado.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
