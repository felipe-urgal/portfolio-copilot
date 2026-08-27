import {
  type AssetClassCode,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";

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

export function ContributionRecommendationExplanationSection({
  recommendation,
  assets,
}: ContributionRecommendationExplanationSectionProps) {
  const explanation = createContributionRecommendationExplanation(recommendation);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset] as const));

  return (
    <section className={styles.section} aria-labelledby="contribution-explanation-title">
      <div className={styles.heading}>
        <div>
          <h6 id="contribution-explanation-title">Como ler este aporte</h6>
          <p>
            Leitura determinística do snapshot final. Estados vêm apenas de <code>status</code> e
            causas vêm apenas de <code>reasonCodes</code>, na mesma ordem entregue pelo domínio.
          </p>
        </div>
        <p className={styles.methodology}>Metodologia: {explanation.methodologyVersion}</p>
      </div>

      <p className={styles.reconciliation}>
        Fatos do snapshot — aporte: {moneyLabel(explanation.currency, explanation.contribution)};
        investível: {moneyLabel(explanation.currency, explanation.totalInvestableAmount)}; custo
        conhecido consumido: {moneyLabel(explanation.currency, explanation.totalConsumedKnownCost)};
        sobra final: {moneyLabel(explanation.currency, explanation.unallocatedContribution)}. Nenhum
        valor é recalculado nesta leitura.
      </p>

      <ol className={styles.decisions}>
        {explanation.decisions.map((decision) => {
          const asset = decision.assetId === null ? null : assetsById.get(decision.assetId);

          return (
            <li className={styles.decision} key={decision.assetClass}>
              <div className={styles.decisionHeader}>
                <div className={styles.identity}>
                  <strong>{assetClassLabel(decision.assetClass as AssetClassCode)}</strong>
                  <span>
                    {decision.assetId === null
                      ? "Sem destino local"
                      : (asset?.name ?? "Ativo não disponível nesta sessão")}
                  </span>
                </div>
                <span className={styles.state} data-status={decision.status}>
                  {decision.statusLabel}
                </span>
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
                  <dd>{moneyLabel(explanation.currency, decision.concentrationAllocatedAmount)}</dd>
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

              {decision.reasons.length === 0 ? (
                <p className={styles.noReason}>
                  Sem reason code adicional para esta decisão; nenhuma causa extra é inferida.
                </p>
              ) : (
                <ul className={styles.reasons} aria-label="Motivos estruturados">
                  {decision.reasons.map((reason) => (
                    <li className={styles.reason} key={reason.code}>
                      <div className={styles.reasonMeta}>
                        <strong>{reason.title}</strong>
                        <code>{reason.code}</code>
                      </div>
                      <p>{reason.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <p className={styles.note}>
        Esta é uma explicação dos estados produzidos pelo pipeline local. Não representa ordem de
        compra ou venda, garantia, previsão ou seleção automática de ativo.
      </p>
    </section>
  );
}
