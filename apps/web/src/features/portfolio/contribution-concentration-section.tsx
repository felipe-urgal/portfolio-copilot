"use client";

import { useState, type FormEvent } from "react";

import { Money, type AssetClassCode, type MoneySnapshot } from "@portfolio-copilot/domain";

import {
  Button,
  ChoiceCard,
  Field,
  FieldError,
  HelpText,
  Label,
  Status,
  TextInput,
} from "@/components/ui";

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
import { focusFirstInvalidField } from "./focus-invalid-field";
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

function statusTone(
  status: ContributionConcentrationStatus,
): "neutral" | "success" | "warning" | "danger" {
  if (status === "WITHIN_LIMITS") return "success";
  if (status === "SOFT_ALERT") return "warning";
  if (status === "HARD_LIMITED") return "danger";
  return "neutral";
}

function ErrorMessage({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;
  return <FieldError id={id}>{message}</FieldError>;
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
      focusFirstInvalidField(event.currentTarget);
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
        <Status tone={concentration === null ? "neutral" : "success"}>
          {concentration === null ? "Configurar" : "Validado"}
        </Status>
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
                  <ChoiceCard
                    type="checkbox"
                    title="Configurar limite nesta classe"
                    description="Ative somente quando existir uma restrição explícita."
                    checked={row.enabled}
                    onChange={(event) =>
                      updateRow(row.assetClass, { enabled: event.target.checked })
                    }
                  />

                  <div className={concentrationStyles.limitFields}>
                    <Field>
                      <Label htmlFor={softId} required={row.enabled}>
                        Limite de alerta (%)
                      </Label>
                      <TextInput
                        id={softId}
                        required={row.enabled}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={!row.enabled}
                        value={row.softMaxWeight}
                        invalid={
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
                      <HelpText id={`${softId}-help`}>
                        Alert-only. Não reduz valor sozinho.
                      </HelpText>
                      <ErrorMessage id={`${softId}-error`} message={rowErrors?.softMaxWeight} />
                    </Field>

                    <Field>
                      <Label htmlFor={hardId} required={row.enabled}>
                        Limite rígido (%)
                      </Label>
                      <TextInput
                        id={hardId}
                        required={row.enabled}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={!row.enabled}
                        value={row.hardMaxWeight}
                        invalid={
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
                      <HelpText id={`${hardId}-help`}>
                        Pode bloquear apenas o novo aporte desta classe.
                      </HelpText>
                      <ErrorMessage id={`${hardId}-error`} message={rowErrors?.hardMaxWeight} />
                    </Field>
                  </div>
                </div>

                <ErrorMessage id={rangeId} message={rowErrors?.range} />
              </fieldset>
            );
          })}
        </div>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}
        <Button type="submit">Aplicar limites de concentração</Button>
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
                      <Status tone={statusTone(allocation.status)}>
                        {statusLabel(allocation.status)}
                      </Status>
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
