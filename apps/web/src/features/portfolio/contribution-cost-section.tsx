"use client";

import { useState, type FormEvent } from "react";

import { Money, type MoneySnapshot } from "@portfolio-copilot/domain";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import {
  createContributionCostSnapshot,
  createInitialContributionCostDraft,
  type ContributionCostDraft,
  type ContributionCostFieldErrors,
  type ContributionCostSnapshot,
} from "./contribution-cost-form";
import costStyles from "./contribution-cost-section.module.css";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { type LocalAssetSnapshot } from "./local-asset-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionCostSectionProps = Readonly<{
  baseline: ContributionBaselineSnapshot;
  execution: ContributionExecutionSnapshot;
  assets: readonly LocalAssetSnapshot[];
  initialCost?: ContributionCostSnapshot | null;
}>;

function moneyLabel(snapshot: MoneySnapshot): string {
  const money = Money.fromSnapshot(snapshot);
  return `${money.currency.toString()} ${money.toDecimalString()}`;
}

function costStatusLabel(status: "EXECUTABLE" | "BLOCKED_KNOWN_COSTS"): string {
  return status === "EXECUTABLE" ? "Executável" : "Bloqueado: custos conhecidos";
}

function ErrorText({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;
  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}

export function ContributionCostSection({
  baseline,
  execution,
  assets,
  initialCost = null,
}: ContributionCostSectionProps) {
  const [draft, setDraft] = useState<ContributionCostDraft>(() =>
    createInitialContributionCostDraft(execution),
  );
  const [errors, setErrors] = useState<ContributionCostFieldErrors>({});
  const [cost, setCost] = useState<ContributionCostSnapshot | null>(initialCost);

  const assetsById = new Map(assets.map((asset) => [asset.id, asset] as const));
  const executableById = new Map(
    execution.destinations
      .filter(
        (destination) =>
          destination.status === "EXECUTABLE" && destination.executionAllocatedAmount !== null,
      )
      .map((destination) => [destination.assetId, destination] as const),
  );

  function updateRow(
    assetId: string,
    field: "transactionCost" | "estimatedTaxImpact",
    value: string,
  ): void {
    setDraft((current) => ({
      rows: current.rows.map((row) => (row.assetId === assetId ? { ...row, [field]: value } : row)),
    }));
    setErrors({});
    setCost(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionCostSnapshot(draft, baseline, execution);

    if (!result.ok) {
      setErrors(result.errors);
      setCost(null);
      return;
    }

    setCost(result.snapshot);
    setErrors({});
  }

  return (
    <section className={costStyles.costSection} aria-labelledby="contribution-cost-title">
      <div className={costStyles.costHeading}>
        <div>
          <h5 id="contribution-cost-title">Custos conhecidos</h5>
          <p>
            Informe somente custos transacionais e impacto tributário monetário já conhecidos. Campo
            vazio significa custo conhecido zero; nenhuma tarifa ou regra fiscal é descoberta aqui.
          </p>
        </div>
        <span className={styles.status}>{cost === null ? "Configurar" : "Aplicado"}</span>
      </div>

      {draft.rows.length === 0 ? (
        <div className={costStyles.costEmpty}>
          <strong>Nenhum destino executável para custos</strong>
          <p>
            Os bloqueios anteriores já estão refletidos na sobra e não recebem custos hipotéticos.
          </p>
        </div>
      ) : (
        <form className={costStyles.costForm} noValidate onSubmit={handleSubmit}>
          <div className={costStyles.costRows}>
            {draft.rows.map((row) => {
              const destination = executableById.get(row.assetId);
              const asset = assetsById.get(row.assetId);
              const rowErrors = errors.rows?.[row.assetId];
              const transactionId = `cost-transaction-${row.assetId}`;
              const taxId = `cost-tax-${row.assetId}`;

              return (
                <div className={costStyles.costRow} key={row.assetId}>
                  <div className={costStyles.costDestination}>
                    <strong>{asset?.name ?? "Ativo não disponível nesta sessão"}</strong>
                    <span>
                      Orçamento bruto:{" "}
                      {destination?.executionAllocatedAmount
                        ? moneyLabel(destination.executionAllocatedAmount)
                        : "—"}
                    </span>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor={transactionId}>Custo transacional conhecido</label>
                    <input
                      id={transactionId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.transactionCost}
                      aria-invalid={rowErrors?.transactionCost !== undefined}
                      aria-describedby={
                        rowErrors?.transactionCost
                          ? `${transactionId}-error`
                          : `${transactionId}-help`
                      }
                      onChange={(event) =>
                        updateRow(row.assetId, "transactionCost", event.target.value)
                      }
                    />
                    <p className={styles.helpText} id={`${transactionId}-help`}>
                      Valor informado em {baseline.contribution.currency}; vazio representa zero.
                    </p>
                    <ErrorText id={`${transactionId}-error`} message={rowErrors?.transactionCost} />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor={taxId}>Impacto tributário reservado</label>
                    <input
                      id={taxId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.estimatedTaxImpact}
                      aria-invalid={rowErrors?.estimatedTaxImpact !== undefined}
                      aria-describedby={
                        rowErrors?.estimatedTaxImpact ? `${taxId}-error` : `${taxId}-help`
                      }
                      onChange={(event) =>
                        updateRow(row.assetId, "estimatedTaxImpact", event.target.value)
                      }
                    />
                    <p className={styles.helpText} id={`${taxId}-help`}>
                      Reserva monetária informada por você; não é imposto calculado pelo domínio.
                    </p>
                    <ErrorText id={`${taxId}-error`} message={rowErrors?.estimatedTaxImpact} />
                  </div>
                </div>
              );
            })}
          </div>

          {errors.form ? (
            <p className={styles.formError} role="alert">
              {errors.form}
            </p>
          ) : null}

          <button className={styles.primaryAction} type="submit">
            Aplicar custos conhecidos
          </button>
        </form>
      )}

      {cost !== null ? (
        <div className={costStyles.costResult}>
          <dl className={costStyles.costSummary}>
            <div>
              <dt>Sobra antes dos custos</dt>
              <dd>{moneyLabel(execution.unallocatedContribution)}</dd>
            </div>
            <div>
              <dt>Sobra após custos</dt>
              <dd>{moneyLabel(cost.unallocatedContribution)}</dd>
            </div>
          </dl>

          <div className={styles.tableScroller}>
            <table className={styles.resultTable}>
              <thead>
                <tr>
                  <th scope="col">Destino</th>
                  <th scope="col">Orçamento bruto</th>
                  <th scope="col">Custo transacional</th>
                  <th scope="col">Reserva tributária</th>
                  <th scope="col">Custo conhecido total</th>
                  <th scope="col">Investível</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cost.destinations.map((destination) => {
                  const asset = assetsById.get(destination.assetId);
                  return (
                    <tr key={destination.assetId}>
                      <th scope="row">{asset?.name ?? "Ativo não disponível nesta sessão"}</th>
                      <td>{moneyLabel(destination.grossAllocatedAmount)}</td>
                      <td>{moneyLabel(destination.transactionCost)}</td>
                      <td>{moneyLabel(destination.estimatedTaxImpact)}</td>
                      <td>{moneyLabel(destination.totalKnownCost)}</td>
                      <td className={styles.policyAmount}>
                        {moneyLabel(destination.investableAmount)}
                      </td>
                      <td>
                        <span className={costStyles.costState} data-status={destination.status}>
                          {costStatusLabel(destination.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className={costStyles.costFootnote}>
            Se custos conhecidos alcançam ou superam o orçamento bruto, o destino é bloqueado e o
            orçamento inteiro volta para a sobra. Nenhum custo hipotético é debitado e nada é
            redistribuído automaticamente.
          </p>
        </div>
      ) : null}
    </section>
  );
}
