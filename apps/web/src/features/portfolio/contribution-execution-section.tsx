"use client";

import { useState, type FormEvent } from "react";

import { Money, type AssetClassCode, type MoneySnapshot } from "@portfolio-copilot/domain";

import {
  Button,
  EmptyState,
  Field,
  FieldError,
  HelpText,
  Label,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Status,
  TextInput,
} from "@/components/ui";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { ContributionCostSection } from "./contribution-cost-section";
import {
  createContributionExecutionSnapshot,
  createInitialContributionExecutionDraft,
  type ContributionExecutionDraft,
  type ContributionExecutionFieldErrors,
  type ContributionExecutionSnapshot,
} from "./contribution-execution-form";
import executionStyles from "./contribution-execution-section.module.css";
import { assetClassLabel, instrumentTypeLabel, type LocalAssetSnapshot } from "./local-asset-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import styles from "./contribution-baseline-panel.module.css";

type ContributionExecutionSectionProps = Readonly<{
  baseline: ContributionBaselineSnapshot;
  policy: ContributionPolicySnapshot;
  concentration: ContributionConcentrationSnapshot;
  assets: readonly LocalAssetSnapshot[];
  initialExecution?: ContributionExecutionSnapshot | null;
}>;

function moneyLabel(snapshot: MoneySnapshot): string {
  const money = Money.fromSnapshot(snapshot);
  return `${money.currency.toString()} ${money.toDecimalString()}`;
}

function compactQuantity(value: string): string {
  const [whole = "0", fraction] = value.split(".");
  if (fraction === undefined) return value;
  const trimmedFraction = fraction.replace(/0+$/u, "");
  return trimmedFraction.length === 0 ? whole : `${whole}.${trimmedFraction}`;
}

function executionStatusLabel(status: "EXECUTABLE" | "BLOCKED_INELIGIBLE"): string {
  return status === "EXECUTABLE" ? "Executável" : "Bloqueado: inelegível";
}

function ErrorMessage({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;
  return <FieldError id={id}>{message}</FieldError>;
}

export function ContributionExecutionSection({
  baseline,
  policy,
  concentration,
  assets,
  initialExecution = null,
}: ContributionExecutionSectionProps) {
  const [draft, setDraft] = useState<ContributionExecutionDraft>(() =>
    createInitialContributionExecutionDraft(concentration),
  );
  const [errors, setErrors] = useState<ContributionExecutionFieldErrors>({});
  const [execution, setExecution] = useState<ContributionExecutionSnapshot | null>(
    initialExecution,
  );

  const concentrationByClass = new Map(
    concentration.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
  );
  const assetsById = new Map(assets.map((asset) => [asset.id, asset] as const));

  function updateDestination(
    assetClass: AssetClassCode,
    patch: Partial<ContributionExecutionDraft["destinations"][number]>,
  ): void {
    setDraft((current) => ({
      destinations: current.destinations.map((row) =>
        row.assetClass === assetClass ? { ...row, ...patch } : row,
      ),
    }));
    setErrors({});
    setExecution(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createContributionExecutionSnapshot(draft, baseline, concentration, assets);

    if (!result.ok) {
      setErrors(result.errors);
      setExecution(null);
      return;
    }

    setExecution(result.snapshot);
    setErrors({});
  }

  return (
    <section
      className={executionStyles.executionSection}
      aria-labelledby="contribution-execution-title"
    >
      <div className={executionStyles.executionHeading}>
        <div>
          <h4 id="contribution-execution-title">Restrições de execução</h4>
          <p>
            Escolha um Asset local por classe, declare elegibilidade e carregue a quantidade mínima
            negociável. Nenhum preço ou quantidade recomendada é calculado.
          </p>
        </div>
        <Status tone={execution === null ? "neutral" : "success"}>
          {execution === null ? "Configurar" : "Validado"}
        </Status>
      </div>

      <form className={executionStyles.executionForm} noValidate onSubmit={handleSubmit}>
        {draft.destinations.length === 0 ? (
          <EmptyState
            title="Nenhum destino necessário"
            description="Nenhuma classe possui alocação monetária positiva após a concentração."
          />
        ) : (
          <div className={executionStyles.executionRows}>
            {draft.destinations.map((row) => {
              const rowErrors = errors.destinations?.[row.assetClass];
              const candidates = assets.filter((asset) => asset.assetClass === row.assetClass);
              const concentrationAllocation = concentrationByClass.get(row.assetClass);
              const classLabel = assetClassLabel(row.assetClass);
              const assetSelectId = `execution-asset-${row.assetClass.toLowerCase()}`;
              const minimumId = `execution-minimum-${row.assetClass.toLowerCase()}`;
              const eligibilityErrorId = `execution-eligibility-${row.assetClass.toLowerCase()}-error`;

              return (
                <div className={executionStyles.executionRow} key={row.assetClass}>
                  <div className={executionStyles.executionRowHeading}>
                    <div>
                      <strong>{classLabel}</strong>
                      <span>
                        Após concentração:{" "}
                        {concentrationAllocation
                          ? moneyLabel(concentrationAllocation.concentrationAllocatedAmount)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <Field>
                    <Label htmlFor={assetSelectId}>Ativo local</Label>
                    <Select
                      id={assetSelectId}
                      value={row.assetId}
                      disabled={candidates.length === 0}
                      invalid={rowErrors?.assetId !== undefined}
                      aria-describedby={
                        rowErrors?.assetId ? `${assetSelectId}-error` : `${assetSelectId}-help`
                      }
                      onChange={(event) =>
                        updateDestination(row.assetClass, { assetId: event.target.value })
                      }
                    >
                      <option value="">Selecione um ativo</option>
                      {candidates.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} — {instrumentTypeLabel(asset.instrumentType)}
                        </option>
                      ))}
                    </Select>
                    <HelpText id={`${assetSelectId}-help`}>
                      {candidates.length === 0
                        ? `Cadastre um ativo local de ${classLabel} antes de validar esta etapa.`
                        : "O AssetId é resolvido internamente a partir desta seleção."}
                    </HelpText>
                    <ErrorMessage id={`${assetSelectId}-error`} message={rowErrors?.assetId} />
                  </Field>

                  <div>
                    <SegmentedControl
                      legend="Elegibilidade"
                      aria-describedby={
                        rowErrors?.isEligible !== undefined ? eligibilityErrorId : undefined
                      }
                    >
                      <SegmentedControlOption
                        name={`execution-eligibility-${row.assetClass}`}
                        checked={row.isEligible === true}
                        onChange={() => updateDestination(row.assetClass, { isEligible: true })}
                      >
                        Elegível
                      </SegmentedControlOption>
                      <SegmentedControlOption
                        name={`execution-eligibility-${row.assetClass}`}
                        checked={row.isEligible === false}
                        onChange={() => updateDestination(row.assetClass, { isEligible: false })}
                      >
                        Inelegível
                      </SegmentedControlOption>
                    </SegmentedControl>
                    <ErrorMessage id={eligibilityErrorId} message={rowErrors?.isEligible} />
                  </div>

                  <Field>
                    <Label htmlFor={minimumId}>Quantidade mínima negociável</Label>
                    <TextInput
                      id={minimumId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={row.minimumTradableQuantity}
                      invalid={rowErrors?.minimumTradableQuantity !== undefined}
                      aria-describedby={
                        rowErrors?.minimumTradableQuantity
                          ? `${minimumId}-error`
                          : `${minimumId}-help`
                      }
                      onChange={(event) =>
                        updateDestination(row.assetClass, {
                          minimumTradableQuantity: event.target.value,
                        })
                      }
                    />
                    <HelpText id={`${minimumId}-help`}>
                      Restrição operacional exata, até 12 casas. Não afirma que o valor alocado
                      consegue comprá-la.
                    </HelpText>
                    <ErrorMessage
                      id={`${minimumId}-error`}
                      message={rowErrors?.minimumTradableQuantity}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        )}

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}
        <Button type="submit">Validar restrições de execução</Button>
      </form>

      {execution !== null ? (
        <div className={executionStyles.executionResult} aria-live="polite">
          <dl className={executionStyles.executionSummary}>
            <div>
              <dt>Sobra após restrições</dt>
              <dd>{moneyLabel(execution.unallocatedContribution)}</dd>
            </div>
          </dl>

          {execution.destinations.length === 0 ? (
            <EmptyState
              title="Plano sem destinos"
              description="Nenhuma alocação positiva exige destino nesta configuração."
            />
          ) : (
            <div className={styles.tableScroller}>
              <table className={styles.resultTable}>
                <thead>
                  <tr>
                    <th scope="col">Classe</th>
                    <th scope="col">Após concentração</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Qtd. mínima</th>
                    <th scope="col">Após restrições</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {execution.destinations.map((destination) => {
                    const asset = assetsById.get(destination.assetId);
                    return (
                      <tr key={destination.assetClass}>
                        <th scope="row">{assetClassLabel(destination.assetClass)}</th>
                        <td>{moneyLabel(destination.concentrationAllocatedAmount)}</td>
                        <td>{asset?.name ?? "Ativo não disponível nesta sessão"}</td>
                        <td>{compactQuantity(destination.minimumTradableQuantity)} un.</td>
                        <td className={styles.policyAmount}>
                          {destination.executionAllocatedAmount === null
                            ? "—"
                            : moneyLabel(destination.executionAllocatedAmount)}
                        </td>
                        <td>
                          <Status tone={destination.status === "EXECUTABLE" ? "success" : "danger"}>
                            {executionStatusLabel(destination.status)}
                          </Status>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className={styles.resultFootnote}>
            A quantidade mínima é somente uma restrição do destino. Sem preço, esta etapa não
            converte o aporte em unidades e não executa ordem.
          </p>

          <ContributionCostSection
            baseline={baseline}
            policy={policy}
            concentration={concentration}
            execution={execution}
            assets={assets}
          />
        </div>
      ) : null}
    </section>
  );
}
