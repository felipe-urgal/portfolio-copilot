"use client";

import { useState, type FormEvent } from "react";

import {
  type AssetClassCode,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { type ContributionCostSnapshot } from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { assetClassLabel, type LocalAssetSnapshot } from "./local-asset-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import {
  createContributionRecommendationSnapshot,
  createInitialContributionRecommendationDraft,
  type ContributionRecommendationDraft,
  type ContributionRecommendationFieldErrors,
} from "./contribution-recommendation-form";
import recommendationStyles from "./contribution-recommendation-section.module.css";
import styles from "./contribution-baseline-panel.module.css";

type ContributionRecommendationSectionProps = Readonly<{
  baseline: ContributionBaselineSnapshot;
  policy: ContributionPolicySnapshot;
  concentration: ContributionConcentrationSnapshot;
  execution: ContributionExecutionSnapshot;
  cost: ContributionCostSnapshot;
  assets: readonly LocalAssetSnapshot[];
  initialRecommendation?: ContributionRecommendationSnapshot | null;
  initialMethodologyVersion?: string;
}>;

function moneyLabel(currency: string, value: string): string {
  return `${currency} ${value}`;
}

function statusLabel(status: ContributionRecommendationSnapshot["decisions"][number]["status"]): string {
  if (status === "EXECUTABLE") return "Executável";
  if (status === "NOT_SELECTED_BY_POLICY") return "Fora da política";
  if (status === "BLOCKED_CONCENTRATION_LIMIT") return "Bloqueado: concentração";
  if (status === "BLOCKED_INELIGIBLE") return "Bloqueado: inelegível";
  return "Bloqueado: custos conhecidos";
}

export function ContributionRecommendationSection({
  baseline,
  policy,
  concentration,
  execution,
  cost,
  assets,
  initialRecommendation = null,
  initialMethodologyVersion = "",
}: ContributionRecommendationSectionProps) {
  const [draft, setDraft] = useState<ContributionRecommendationDraft>(() => ({
    ...createInitialContributionRecommendationDraft(),
    methodologyVersion: initialMethodologyVersion,
  }));
  const [errors, setErrors] = useState<ContributionRecommendationFieldErrors>({});
  const [recommendation, setRecommendation] = useState<ContributionRecommendationSnapshot | null>(
    initialRecommendation,
  );
  const assetsById = new Map(assets.map((asset) => [asset.id, asset] as const));

  function updateMethodologyVersion(value: string): void {
    setDraft({ methodologyVersion: value });
    setErrors({});
    setRecommendation(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionRecommendationSnapshot(
      draft,
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );

    if (!result.ok) {
      setErrors(result.errors);
      setRecommendation(null);
      return;
    }

    setRecommendation(result.snapshot);
    setErrors({});
  }

  return (
    <section
      className={recommendationStyles.section}
      aria-labelledby="contribution-recommendation-title"
    >
      <div className={recommendationStyles.heading}>
        <div>
          <h5 id="contribution-recommendation-title">Snapshot auditável</h5>
          <p>
            Consolide o pipeline completo com uma versão de metodologia explícita. Sobra, status e
            reason codes vêm diretamente do domínio; nenhuma regra é reconstruída nesta tela.
          </p>
        </div>
        <span className={styles.status}>{recommendation === null ? "Gerar" : "Consolidado"}</span>
      </div>

      <form className={recommendationStyles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="contribution-methodology-version">Versão da metodologia</label>
          <input
            id="contribution-methodology-version"
            type="text"
            autoComplete="off"
            value={draft.methodologyVersion}
            aria-invalid={errors.methodologyVersion !== undefined}
            aria-describedby={
              errors.methodologyVersion
                ? "contribution-methodology-version-error"
                : "contribution-methodology-version-help"
            }
            onChange={(event) => updateMethodologyVersion(event.target.value)}
          />
          <p className={styles.helpText} id="contribution-methodology-version-help">
            Identificador local explícito, por exemplo `local-mvp-v1`. Não é gerado nem normalizado
            automaticamente.
          </p>
          {errors.methodologyVersion ? (
            <p className={styles.fieldError} id="contribution-methodology-version-error" role="alert">
              {errors.methodologyVersion}
            </p>
          ) : null}
        </div>

        <button className={styles.primaryAction} type="submit">
          Gerar snapshot consolidado
        </button>
      </form>

      {recommendation !== null ? (
        <div className={recommendationStyles.result} aria-live="polite">
          <dl className={recommendationStyles.summary}>
            <div>
              <dt>Metodologia</dt>
              <dd>{recommendation.methodologyVersion}</dd>
            </div>
            <div>
              <dt>Total investível</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.totalInvestableAmount)}</dd>
            </div>
            <div>
              <dt>Custo conhecido consumido</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.totalConsumedKnownCost)}</dd>
            </div>
            <div>
              <dt>Sobra final</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.unallocatedContribution)}</dd>
            </div>
          </dl>

          <dl className={recommendationStyles.remainders}>
            <div>
              <dt>Após allocator</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.cashRemainder.afterAllocator)}</dd>
            </div>
            <div>
              <dt>Após política</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.cashRemainder.afterPolicy)}</dd>
            </div>
            <div>
              <dt>Após concentração</dt>
              <dd>
                {moneyLabel(recommendation.currency, recommendation.cashRemainder.afterConcentration)}
              </dd>
            </div>
            <div>
              <dt>Após execução</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.cashRemainder.afterExecution)}</dd>
            </div>
            <div>
              <dt>Após custos</dt>
              <dd>{moneyLabel(recommendation.currency, recommendation.cashRemainder.afterCosts)}</dd>
            </div>
          </dl>

          <div className={styles.tableScroller}>
            <table className={styles.resultTable}>
              <thead>
                <tr>
                  <th scope="col">Classe</th>
                  <th scope="col">Destino</th>
                  <th scope="col">Baseline</th>
                  <th scope="col">Política</th>
                  <th scope="col">Concentração</th>
                  <th scope="col">Investível</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Reason codes</th>
                </tr>
              </thead>
              <tbody>
                {recommendation.decisions.map((decision) => {
                  const asset = decision.assetId === null ? null : assetsById.get(decision.assetId);

                  return (
                    <tr key={decision.assetClass}>
                      <th scope="row">{assetClassLabel(decision.assetClass as AssetClassCode)}</th>
                      <td>
                        {decision.assetId === null
                          ? "Sem destino"
                          : (asset?.name ?? "Ativo não disponível nesta sessão")}
                      </td>
                      <td>{moneyLabel(recommendation.currency, decision.baselineAllocatedAmount)}</td>
                      <td>{moneyLabel(recommendation.currency, decision.policyAllocatedAmount)}</td>
                      <td>
                        {moneyLabel(recommendation.currency, decision.concentrationAllocatedAmount)}
                      </td>
                      <td className={styles.policyAmount}>
                        {moneyLabel(recommendation.currency, decision.investableAmount)}
                      </td>
                      <td>
                        <span
                          className={recommendationStyles.state}
                          data-status={decision.status}
                        >
                          {statusLabel(decision.status)}
                        </span>
                      </td>
                      <td>
                        {decision.reasonCodes.length === 0 ? (
                          <span className={recommendationStyles.emptyReason}>—</span>
                        ) : (
                          <div className={recommendationStyles.reasonList}>
                            {decision.reasonCodes.map((reasonCode) => (
                              <code key={reasonCode}>{reasonCode}</code>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className={recommendationStyles.note}>
            Reconciliação do domínio. Aporte:{" "}
            {moneyLabel(recommendation.currency, recommendation.contribution)}; investível:{" "}
            {moneyLabel(recommendation.currency, recommendation.totalInvestableAmount)}; custo conhecido
            consumido: {moneyLabel(recommendation.currency, recommendation.totalConsumedKnownCost)}; sobra:{" "}
            {moneyLabel(recommendation.currency, recommendation.unallocatedContribution)}. As sobras acima são
            cumulativas, não incrementais.
          </p>
        </div>
      ) : null}
    </section>
  );
}
