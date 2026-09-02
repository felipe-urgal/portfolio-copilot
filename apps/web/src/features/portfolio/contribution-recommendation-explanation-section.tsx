import {
  type AssetClassCode,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";

import { ReasonCodeList } from "@/components/reason-code-list";
import { Disclosure, Status } from "@/components/ui";

import { assetClassLabel, type LocalAssetSnapshot } from "./local-asset-form";
import { createContributionRecommendationExplanation } from "./contribution-recommendation-explanation";
import styles from "./contribution-recommendation-explanation.module.css";

type ContributionRecommendationExplanationSectionProps = Readonly<{
  recommendation: ContributionRecommendationSnapshot;
  assets: readonly LocalAssetSnapshot[];
}>;

function moneyLabel(currency: string, value: string): string {
  return `${currency} ${value}`;
}

function statusTone(
  status: ContributionRecommendationSnapshot["decisions"][number]["status"],
): "neutral" | "success" | "danger" {
  if (status === "EXECUTABLE") return "success";
  if (status === "NOT_SELECTED_BY_POLICY") return "neutral";
  return "danger";
}

export function ContributionRecommendationExplanationSection({
  recommendation,
  assets,
}: ContributionRecommendationExplanationSectionProps) {
  const explanation = createContributionRecommendationExplanation(recommendation);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset] as const));

  return (
    <Disclosure summary="Como ler este aporte" className={styles.section}>
      <div className={styles.body}>
        <div className={styles.heading}>
          <div>
            <h6>Explicação determinística</h6>
            <p>
              Estados vêm apenas de <code>status</code> e causas vêm apenas de{" "}
              <code>reasonCodes</code>, na mesma ordem entregue pelo domínio.
            </p>
          </div>
          <p className={styles.methodology}>Metodologia: {explanation.methodologyVersion}</p>
        </div>

        <p className={styles.reconciliation}>
          Fatos do snapshot — aporte: {moneyLabel(explanation.currency, explanation.contribution)};
          investível: {moneyLabel(explanation.currency, explanation.totalInvestableAmount)}; custo
          conhecido consumido:{" "}
          {moneyLabel(explanation.currency, explanation.totalConsumedKnownCost)}; sobra final:{" "}
          {moneyLabel(explanation.currency, explanation.unallocatedContribution)}. Nenhum valor é
          recalculado nesta leitura.
        </p>

        <ol className={styles.decisions}>
          {explanation.decisions.map((decision) => {
            const asset = decision.assetId === null ? null : assetsById.get(decision.assetId);
            const classLabel = assetClassLabel(decision.assetClass as AssetClassCode);

            return (
              <li className={styles.decision} key={decision.assetClass}>
                <div className={styles.decisionHeader}>
                  <div className={styles.identity}>
                    <strong>{classLabel}</strong>
                    <span>
                      {decision.assetId === null
                        ? "Sem destino local"
                        : (asset?.name ?? "Ativo não disponível nesta sessão")}
                    </span>
                  </div>
                  <Status tone={statusTone(decision.status)}>{decision.statusLabel}</Status>
                </div>

                <p className={styles.statusDescription}>{decision.statusDescription}</p>

                <dl className={styles.context}>
                  <div>
                    <dt>Baseline</dt>
                    <dd>{moneyLabel(explanation.currency, decision.baselineAllocatedAmount)}</dd>
                  </div>
                  <div>
                    <dt>Após política</dt>
                    <dd>{moneyLabel(explanation.currency, decision.policyAllocatedAmount)}</dd>
                  </div>
                  <div>
                    <dt>Após concentração</dt>
                    <dd>
                      {moneyLabel(explanation.currency, decision.concentrationAllocatedAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt>Investível</dt>
                    <dd>{moneyLabel(explanation.currency, decision.investableAmount)}</dd>
                  </div>
                  <div>
                    <dt>Custo conhecido</dt>
                    <dd>{moneyLabel(explanation.currency, decision.totalKnownCost)}</dd>
                  </div>
                  <div>
                    <dt>Custo consumido</dt>
                    <dd>{moneyLabel(explanation.currency, decision.consumedKnownCost)}</dd>
                  </div>
                </dl>

                <ReasonCodeList
                  reasons={decision.reasons}
                  ariaLabel={`Motivos estruturados de ${classLabel}`}
                  emptyMessage="Sem reason code adicional para esta decisão; nenhuma causa extra é inferida."
                />
              </li>
            );
          })}
        </ol>

        <p className={styles.note}>
          Esta é uma explicação dos estados produzidos pelo pipeline local. Não representa ordem de
          compra ou venda, garantia, previsão ou seleção automática de ativo.
        </p>
      </div>
    </Disclosure>
  );
}
