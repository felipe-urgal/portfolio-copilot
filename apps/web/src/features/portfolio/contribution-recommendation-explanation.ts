import { type ContributionRecommendationSnapshot } from "@portfolio-copilot/domain";

type ContributionRecommendationDecision = ContributionRecommendationSnapshot["decisions"][number];
type ContributionRecommendationReasonCode =
  ContributionRecommendationDecision["reasonCodes"][number];
type ContributionRecommendationStatus = ContributionRecommendationDecision["status"];

type ExplanationCopy = Readonly<{
  title: string;
  description: string;
}>;

export type ContributionRecommendationReasonExplanation = Readonly<{
  code: ContributionRecommendationReasonCode;
  title: string;
  description: string;
}>;

export type ContributionRecommendationDecisionExplanation = Readonly<{
  assetClass: string;
  assetId: string | null;
  status: ContributionRecommendationStatus;
  statusLabel: string;
  statusDescription: string;
  reasons: readonly ContributionRecommendationReasonExplanation[];
  baselineAllocatedAmount: string;
  policyAllocatedAmount: string;
  concentrationAllocatedAmount: string;
  investableAmount: string;
  totalKnownCost: string;
  consumedKnownCost: string;
}>;

export type ContributionRecommendationExplanation = Readonly<{
  methodologyVersion: string;
  currency: string;
  contribution: string;
  totalInvestableAmount: string;
  totalConsumedKnownCost: string;
  unallocatedContribution: string;
  decisions: readonly ContributionRecommendationDecisionExplanation[];
}>;

const REASON_EXPLANATIONS: Readonly<Record<ContributionRecommendationReasonCode, ExplanationCopy>> =
  Object.freeze({
    CONTRIBUTION_POLICY_ADJUSTED: Object.freeze({
      title: "Política ajustou o baseline",
      description:
        "A política operacional alterou o valor que veio do baseline para esta classe. Nenhuma causa adicional é inferida além deste reason code.",
    }),
    SOFT_CONCENTRATION_LIMIT_EXCEEDED: Object.freeze({
      title: "Alerta de concentração",
      description:
        "O limite suave de concentração foi excedido. Este motivo representa um alerta e, sozinho, não bloqueia o aporte.",
    }),
    HARD_CONCENTRATION_LIMIT_APPLIED: Object.freeze({
      title: "Limite rígido aplicado",
      description:
        "O limite rígido de concentração restringiu o novo aporte destinado a esta classe.",
    }),
    EXECUTION_DESTINATION_INELIGIBLE: Object.freeze({
      title: "Destino inelegível",
      description:
        "O destino local foi marcado como inelegível para esta execução e não segue para a etapa de custos.",
    }),
    KNOWN_COSTS_BLOCKED_DESTINATION: Object.freeze({
      title: "Bloqueio por custos conhecidos",
      description:
        "O domínio bloqueou o destino na etapa de custos conhecidos. O custo informado continua visível, mas o custo consumido permanece zero.",
    }),
  });

const STATUS_EXPLANATIONS: Readonly<Record<ContributionRecommendationStatus, ExplanationCopy>> =
  Object.freeze({
    EXECUTABLE: Object.freeze({
      title: "Executável",
      description:
        "A decisão terminou executável após as restrições do pipeline. O valor investível é um resultado do snapshot, não uma ordem de compra.",
    }),
    NOT_SELECTED_BY_POLICY: Object.freeze({
      title: "Fora da política",
      description: "A decisão terminou fora da seleção da política operacional.",
    }),
    BLOCKED_CONCENTRATION_LIMIT: Object.freeze({
      title: "Bloqueado por concentração",
      description: "A decisão terminou bloqueada pela camada de limite rígido de concentração.",
    }),
    BLOCKED_INELIGIBLE: Object.freeze({
      title: "Bloqueado por elegibilidade",
      description:
        "A decisão terminou bloqueada porque o destino de execução foi marcado como inelegível.",
    }),
    BLOCKED_KNOWN_COSTS: Object.freeze({
      title: "Bloqueado por custos conhecidos",
      description:
        "A decisão terminou bloqueada na camada de custos conhecidos; o snapshot preserva o custo informado e registra custo consumido igual a zero.",
    }),
  });

export function createContributionRecommendationExplanation(
  snapshot: ContributionRecommendationSnapshot,
): ContributionRecommendationExplanation {
  return Object.freeze({
    methodologyVersion: snapshot.methodologyVersion,
    currency: snapshot.currency,
    contribution: snapshot.contribution,
    totalInvestableAmount: snapshot.totalInvestableAmount,
    totalConsumedKnownCost: snapshot.totalConsumedKnownCost,
    unallocatedContribution: snapshot.unallocatedContribution,
    decisions: Object.freeze(
      snapshot.decisions.map((decision) => {
        const statusCopy = STATUS_EXPLANATIONS[decision.status];

        return Object.freeze({
          assetClass: decision.assetClass,
          assetId: decision.assetId,
          status: decision.status,
          statusLabel: statusCopy.title,
          statusDescription: statusCopy.description,
          reasons: Object.freeze(
            decision.reasonCodes.map((code) => {
              const reasonCopy = REASON_EXPLANATIONS[code];
              return Object.freeze({
                code,
                title: reasonCopy.title,
                description: reasonCopy.description,
              });
            }),
          ),
          baselineAllocatedAmount: decision.baselineAllocatedAmount,
          policyAllocatedAmount: decision.policyAllocatedAmount,
          concentrationAllocatedAmount: decision.concentrationAllocatedAmount,
          investableAmount: decision.investableAmount,
          totalKnownCost: decision.totalKnownCost,
          consumedKnownCost: decision.consumedKnownCost,
        });
      }),
    ),
  });
}
