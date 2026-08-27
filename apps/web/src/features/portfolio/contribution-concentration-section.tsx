"use client";

import { useState, type FormEvent } from "react";

import { Money, type AssetClassCode, type MoneySnapshot } from "@portfolio-copilot/domain";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import {
  createContributionConcentrationSnapshot,
  createInitialContributionConcentrationDraft,
  type ContributionConcentrationDraft,
  type ContributionConcentrationFieldErrors,
  type ContributionConcentrationSnapshot,
  type ContributionConcentrationStatus,
} from "./contribution-concentration-form";
import concentrationStyles from "./contribution-concentration-section.module.css";
import { ContributionExecutionSection } from "./contribution-execution-section";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import { assetClassLabel, type LocalAssetSnapshot } from "./local-asset-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionConcentrationSectionProps = Readonly<{
  baseline: ContributionBaselineSnapshot;
  policy: ContributionPolicySnapshot;
  assets: readonly LocalAssetSnapshot[];
  initialConcentration?: ContributionConcentrationSnapshot | null;
}>;

function moneyLabel(snapshot: MoneySnapshot): string {
  const money = Money.fromSnapshot(snapshot);
  return `${money.currency.toString()} ${money.toDecimalString()}`;
}

function statusLabel(status: ContributionConcentrationStatus): string {
  if (status === "NO_LIMIT") return "Sem limite";
  if (status === "WITHIN_LIMITS") return "Dentro dos limites";
  if (status === "SOFT_ALERT") return "Alerta suave";
  return "Limite rígido aplicado";
}

function ErrorText({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}

export function ContributionConcentrationSection({
  baseline,
  policy,
  assets,
  initialConcentration = null,
}: ContributionConcentrationSectionProps) {
  const [draft, setDraft] = useState<ContributionConcentrationDraft>(() =>
    createInitialContributionConcentrationDraft(policy),
  );
  const [errors, setErrors] = useState<ContributionConcentrationFieldErrors>({});
  const [concentration, setConcentration] = useState<ContributionConcentrationSnapshot | null>(
    initialConcentration,
  );

  const policyByClass = new Map(
    policy.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
  );

  function updateRow(
    assetClass: AssetClassCode,
    patch: Partial<ContributionConcentrationDraft["rows"][number]>,
  ): void {
    setDraft((current) => ({
      rows: current.rows.map((row) => (row.assetClass === assetClass ? { ...row, ...patch } : row)),
    }));
    setErrors({});
    setConcentration(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionConcentrationSnapshot(draft, baseline, policy);

    if (!result.ok) {
      setErrors(result.errors);
      setConcentration(null);
      return;
    }

    setConcentration(result.snapshot);
    setErrors({});
  }

  return (
    <section
      className={concentrationStyles.section}
      aria-labelledby="contribution-concentration-title"
    >
      <div className={concentrationStyles.heading}>
        <div>
          <h4 id="contribution-concentration-title">Limites de concentração</h4>
          <p>
            Configure limites somente onde houver decisão explícita. Soft alerta; hard pode bloquear
            novo aporte, sem vender posição existente nem redistribuir o valor cortado.
          </p>
        </div>
        <span className={styles.status}>{concentration === null ? "Configurar" : "Validado"}</span>
      </div>

      <form className={concentrationStyles.form} noValidate onSubmit={handleSubmit}>
        <div className={concentrationStyles.rows}>
          {draft.rows.map((row) => {
            const rowErrors = errors.rows?.[row.assetClass];
            const classLabel = assetClassLabel(row.assetClass);
            const softId = `concentration-soft-${row.assetClass.toLowerCase()}`;
            const hardId = `concentration-hard-${row.assetClass.toLowerCase()}`;
            const rangeId = `concentration-range-${row.assetClass.toLowerCase()}`;
            const policyAllocation = policyByClass.get(row.assetClass);

            return (
              <fieldset className={concentrationStyles.row} key={row.assetClass}>
                <legend>{classLabel}</legend>
                <p className={concentrationStyles.rowHelp}>
                  Após política:{" "}
                  {policyAllocation ? moneyLabel(policyAllocation.policyAllocatedAmount) : "—"}
                </p>

                <div className={concentrationStyles.controls}>
                  <label className={concentrationStyles.toggle}>
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(event) =>
                        updateRow(row.assetClass, { enabled: event.target.checked })
                      }
                    />
                    <span>Configurar limite nesta classe</span>
                  </label>

                  <div className={concentrationStyles.limitFields}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor={softId}>Limite de alerta (%)</label>
                      <input
                        id={softId}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={!row.enabled}
                        value={row.softMaxWeight}
                        aria-invalid={
                          rowErrors?.softMaxWeight !== undefined || rowErrors?.range !== undefined
                        }
                        aria-describedby={
                          rowErrors?.softMaxWeight
                            ? `${softId}-error`
                            : rowErrors?.range
                              ? rangeId
                              : `${softId}-help`
                        }
                        onChange={(event) =>
                          updateRow(row.assetClass, { softMaxWeight: event.target.value })
                        }
                      />
                      <p className={styles.helpText} id={`${softId}-help`}>
                        Alert-only. Não reduz valor sozinho.
                      </p>
                      <ErrorText id={`${softId}-error`} message={rowErrors?.softMaxWeight} />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor={hardId}>Limite rígido (%)</label>
                      <input
                        id={hardId}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={!row.enabled}
                        value={row.hardMaxWeight}
                        aria-invalid={
                          rowErrors?.hardMaxWeight !== undefined || rowErrors?.range !== undefined
                        }
                        aria-describedby={
                          rowErrors?.hardMaxWeight
                            ? `${hardId}-error`
                            : rowErrors?.range
                              ? rangeId
                              : `${hardId}-help`
                        }
                        onChange={(event) =>
                          updateRow(row.assetClass, { hardMaxWeight: event.target.value })
                        }
                      />
                      <p className={styles.helpText} id={`${hardId}-help`}>
                        Pode bloquear apenas o novo aporte desta classe.
                      </p>
                      <ErrorText id={`${hardId}-error`} message={rowErrors?.hardMaxWeight} />
                    </div>
                  </div>
                </div>

                <ErrorText id={rangeId} message={rowErrors?.range} />
              </fieldset>
            );
          })}
        </div>

        {errors.form ? (
          <p className={styles.formError} role="alert">
            {errors.form}
          </p>
        ) : null}

        <button className={styles.primaryAction} type="submit">
          Aplicar limites de concentração
        </button>
      </form>

      {concentration !== null ? (
        <div className={concentrationStyles.result} aria-live="polite">
          <dl className={concentrationStyles.summary}>
            <div>
              <dt>Sobra após concentração</dt>
              <dd>{moneyLabel(concentration.unallocatedContribution)}</dd>
            </div>
            <div>
              <dt>Regra de redistribuição</dt>
              <dd>Nenhuma</dd>
            </div>
          </dl>

          <div className={styles.tableScroller}>
            <table className={styles.resultTable}>
              <thead>
                <tr>
                  <th scope="col">Classe</th>
                  <th scope="col">Após política</th>
                  <th scope="col">Após concentração</th>
                  <th scope="col">Soft</th>
                  <th scope="col">Hard</th>
                  <th scope="col">Bloqueado</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {concentration.allocations.map((allocation) => (
                  <tr key={allocation.assetClass}>
                    <th scope="row">{assetClassLabel(allocation.assetClass)}</th>
                    <td>{moneyLabel(allocation.policyAllocatedAmount)}</td>
                    <td className={styles.policyAmount}>
                      {moneyLabel(allocation.concentrationAllocatedAmount)}
                    </td>
                    <td>
                      {allocation.softMaxWeightPercent === null
                        ? "—"
                        : `${allocation.softMaxWeightPercent}%`}
                    </td>
                    <td>
                      {allocation.hardMaxWeightPercent === null
                        ? "—"
                        : `${allocation.hardMaxWeightPercent}%`}
                    </td>
                    <td className={concentrationStyles.blockedAmount}>
                      {moneyLabel(allocation.blockedAmount)}
                    </td>
                    <td>
                      <span className={concentrationStyles.state} data-status={allocation.status}>
                        {statusLabel(allocation.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={concentrationStyles.resultNote}>
            “Alerta suave” é somente sinal de atenção. “Limite rígido aplicado” move apenas o valor
            bloqueado para a sobra; esta etapa não vende, rebalanceia ou escolhe outro destino.
          </p>

          <ContributionExecutionSection
            baseline={baseline}
            policy={policy}
            concentration={concentration}
            assets={assets}
          />
        </div>
      ) : null}
    </section>
  );
}
