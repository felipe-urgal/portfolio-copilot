"use client";

import { useState, type FormEvent } from "react";

import {
  type AssetClassCode,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";

import { ReasonCodeList } from "@/components/reason-code-list";
import {
  Button,
  Disclosure,
  Field,
  FieldError,
  HelpText,
  Label,
  Status,
  TextInput,
} from "@/components/ui";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { type ContributionCostSnapshot } from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { assetClassLabel, type LocalAssetSnapshot } from "./local-asset-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import { ContributionRecommendationExplanationSection } from "./contribution-recommendation-explanation-section";
import { explainContributionRecommendationReasonCodes } from "./contribution-recommendation-explanation";
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

function statusLabel(
  status: ContributionRecommendationSnapshot["decisions"][number]["status"],
): string {
  if (status === "EXECUTABLE") return "Executável";
  if (status === "NOT_SELECTED_BY_POLICY") return "Fora da política";
  if (status === "BLOCKED_CONCENTRATION_LIMIT") return "Bloqueado: concentração";
  if (status === "BLOCKED_INELIGIBLE") return "Bloqueado: inelegível";
  return "Bloqueado: custos conhecidos";
}

function statusTone(
  status: ContributionRecommendationSnapshot["decisions"][number]["status"],
): "neutral" | "success" | "danger" {
  if (status === "EXECUTABLE") return "success";
  if (status === "NOT_SELECTED_BY_POLICY") return "neutral";
  return "danger";
}

function reasonCountLabel(count: number): string {
  if (count === 0) return "Sem motivo adicional";
  if (count === 1) return "1 motivo";
  return `${count} motivos`;
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
        <Status tone={recommendation === null ? "neutral" : "success"}>
          {recommendation === null ? "Gerar" : "Consolidado"}
        </Status>
      </div>

      <form className={recommendationStyles.form} noValidate onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="contribution-methodology-version">Versão da metodologia</Label>
          <TextInput
            id="contribution-methodology-version"
            type="text"
            autoComplete="off"
            value={draft.methodologyVersion}
            invalid={errors.methodologyVersion !== undefined}
            aria-describedby={
              errors.methodologyVersion
                ? "contribution-methodology-version-error"
                : "contribution-methodology-version-help"
            }
            onChange={(event) => updateMethodologyVersion(event.target.value)}
          />
          <HelpText id="contribution-methodology-version-help">
            Identificador local explícito, por exemplo `local-mvp-v1`. Não é gerado nem normalizado
            automaticamente.
          </HelpText>
          {errors.methodologyVersion ? (
            <FieldError id="contribution-methodology-version-error">
              {errors.methodologyVersion}
            </FieldError>
          ) : null}
        </Field>

        <Button type="submit">Gerar snapshot consolidado</Button>
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

          <Disclosure summary="Reconciliação das sobras por etapa" summaryAside="5 etapas">
            <dl className={recommendationStyles.remainders}>
              <div>
                <dt>Após allocator</dt>
                <dd>
                  {moneyLabel(recommendation.currency, recommendation.cashRemainder.afterAllocator)}
                </dd>
              </div>
              <div>
                <dt>Após política</dt>
                <dd>
                  {moneyLabel(recommendation.currency, recommendation.cashRemainder.afterPolicy)}
                </dd>
              </div>
              <div>
                <dt>Após concentração</dt>
                <dd>
                  {moneyLabel(
                    recommendation.currency,
                    recommendation.cashRemainder.afterConcentration,
                  )}
                </dd>
              </div>
              <div>
                <dt>Após execução</dt>
                <dd>
                  {moneyLabel(recommendation.currency, recommendation.cashRemainder.afterExecution)}
                </dd>
              </div>
              <div>
                <dt>Após custos</dt>
                <dd>
                  {moneyLabel(recommendation.currency, recommendation.cashRemainder.afterCosts)}
                </dd>
              </div>
            </dl>
          </Disclosure>

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
                  <th scope="col">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {recommendation.decisions.map((decision) => {
                  const asset = decision.assetId === null ? null : assetsById.get(decision.assetId);
                  const classLabel = assetClassLabel(decision.assetClass as AssetClassCode);
                  const reasons = explainContributionRecommendationReasonCodes(decision.reasonCodes);

                  return (
                    <tr key={decision.assetClass}>
                      <th scope="row">{classLabel}</th>
                      <td>
                        {decision.assetId === null
                          ? "Sem destino"
                          : (asset?.name ?? "Ativo não disponível nesta sessão")}
                      </td>
                      <td>
                        {moneyLabel(recommendation.currency, decision.baselineAllocatedAmount)}
                      </td>
                      <td>{moneyLabel(recommendation.currency, decision.policyAllocatedAmount)}</td>
                      <td>
                        {moneyLabel(recommendation.currency, decision.concentrationAllocatedAmount)}
                      </td>
                      <td className={styles.policyAmount}>
                        {moneyLabel(recommendation.currency, decision.investableAmount)}
                      </td>
                      <td>
                        <Status tone={statusTone(decision.status)}>
                          {statusLabel(decision.status)}
                        </Status>
                      </td>
                      <td>
                        <Disclosure summary="Motivos" summaryAside={reasonCountLabel(reasons.length)}>
                          <ReasonCodeList
                            reasons={reasons}
                            ariaLabel={`Motivos estruturados de ${classLabel}`}
                            emptyMessage="Nenhum reason code adicional para esta decisão; nenhuma causa extra é inferida."
                          />
                        </Disclosure>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ContributionRecommendationExplanationSection
            recommendation={recommendation}
            assets={assets}
          />

          <p className={recommendationStyles.note}>
            Reconciliação do domínio. Aporte:{" "}
            {moneyLabel(recommendation.currency, recommendation.contribution)}; investível:{" "}
            {moneyLabel(recommendation.currency, recommendation.totalInvestableAmount)}; custo
            conhecido consumido:{" "}
            {moneyLabel(recommendation.currency, recommendation.totalConsumedKnownCost)}; sobra:{" "}
            {moneyLabel(recommendation.currency, recommendation.unallocatedContribution)}. As sobras
            acima são cumulativas, não incrementais.
          </p>
        </div>
      ) : null}
    </section>
  );
}
