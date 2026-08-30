"use client";

import Link from "next/link";
import { useReducer, useRef, type Dispatch, type FormEvent } from "react";

import {
  FINANCIAL_GOAL_TYPES,
  FINANCIAL_HORIZON_CODES,
  Money,
  RISK_TOLERANCE_CODES,
  type FinancialGoalSnapshot,
  type FinancialGoalTypeCode,
  type FinancialHorizonCode,
  type FinancialProfileSnapshot,
  type MoneySnapshot,
  type RiskToleranceCode,
} from "@portfolio-copilot/domain";

import {
  useFinancialSession,
  type FinancialProfilePersistenceStatus,
} from "@/components/financial-session";

import styles from "./financial-onboarding-flow.module.css";
import {
  ONBOARDING_STEPS,
  createInitialOnboardingState,
  onboardingReducer,
  validateOnboardingStep,
  type FieldErrors,
  type GoalDraft,
  type OnboardingAction,
  type OnboardingDraft,
  type OnboardingStep,
} from "./onboarding-form";

const STEP_COPY: Record<
  OnboardingStep,
  Readonly<{ label: string; summary: string; title: string; description: string }>
> = {
  profile: {
    label: "Perfil",
    summary: "Moeda, risco e horizonte",
    title: "Defina seu contexto financeiro",
    description: "Comece pela moeda, tolerância a risco e horizonte que você declara hoje.",
  },
  reserve: {
    label: "Reserva",
    summary: "Meta opcional",
    title: "Configure sua meta de reserva",
    description: "Você pode definir a meta agora ou deixar esse ponto pendente para depois.",
  },
  goals: {
    label: "Objetivos",
    summary: "Metas financeiras",
    title: "Registre seus objetivos financeiros",
    description: "Adicione quantos objetivos fizerem sentido ou siga sem nenhum nesta versão.",
  },
  review: {
    label: "Revisão",
    summary: "Snapshot validado",
    title: "Revise seu perfil financeiro",
    description:
      "Este resumo foi construído e validado pelo domínio. Nada é enviado a um servidor nesta etapa.",
  },
};

const RISK_LABELS: Record<RiskToleranceCode, Readonly<{ title: string; description: string }>> = {
  LOW: {
    title: "Baixa",
    description: "Prefiro menor exposição a variações e perdas.",
  },
  MEDIUM: {
    title: "Média",
    description: "Aceito alguma variação para buscar melhores resultados.",
  },
  HIGH: {
    title: "Alta",
    description: "Aceito variações maiores no caminho dos meus objetivos.",
  },
};

const HORIZON_LABELS: Record<FinancialHorizonCode, string> = {
  SHORT: "Curto prazo",
  MEDIUM: "Médio prazo",
  LONG: "Longo prazo",
};

const GOAL_LABELS: Record<FinancialGoalTypeCode, string> = {
  NET_WORTH: "Patrimônio",
  PASSIVE_INCOME_MONTHLY: "Renda passiva mensal",
  RETIREMENT: "Aposentadoria",
  DATED_PURPOSE: "Objetivo com data",
};

type OnboardingDispatch = Dispatch<OnboardingAction>;

function createBrowserId(): string {
  return globalThis.crypto.randomUUID();
}

function firstErrorMessage(errors: FieldErrors): string | null {
  return Object.values(errors)[0] ?? null;
}

function describedBy(
  helpId: string | null,
  errorId: string,
  hasError: boolean,
): string | undefined {
  const ids = [helpId, hasError ? errorId : null].filter((id): id is string => id !== null);
  return ids.length === 0 ? undefined : ids.join(" ");
}

function focusFirstInvalidField(): void {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
  });
}

function formatMoney(snapshot: MoneySnapshot): string {
  const decimal = Money.fromSnapshot(snapshot).toDecimalString().replace(".", ",");
  return `${snapshot.currency} ${decimal}`;
}

function formatDate(value: string | null): string {
  if (value === null) return "Sem data definida";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function FieldError({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return (
    <p className={styles.fieldError} id={id}>
      {message}
    </p>
  );
}

function ProfileStep({
  draft,
  errors,
  dispatch,
}: Readonly<{ draft: OnboardingDraft; errors: FieldErrors; dispatch: OnboardingDispatch }>) {
  const currencyError = errors["profile.referenceCurrency"];
  const riskError = errors["profile.riskTolerance"];
  const horizonError = errors["profile.horizon"];

  return (
    <div className={styles.stepBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="reference-currency">
          Moeda de referência
        </label>
        <input
          className={styles.textInput}
          id="reference-currency"
          name="referenceCurrency"
          value={draft.referenceCurrency}
          maxLength={3}
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={currencyError !== undefined}
          aria-describedby={describedBy(
            "currency-help",
            "currency-error",
            currencyError !== undefined,
          )}
          onChange={(event) =>
            dispatch({
              type: "update-profile",
              field: "referenceCurrency",
              value: event.target.value.toUpperCase(),
            })
          }
        />
        <p className={styles.helpText} id="currency-help">
          Use o código de três letras da moeda que servirá como referência, como BRL.
        </p>
        <FieldError id="currency-error" message={currencyError} />
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={describedBy("risk-help", "risk-error", riskError !== undefined)}
      >
        <legend className={styles.legend}>Tolerância a risco</legend>
        <p className={styles.helpText} id="risk-help">
          Esta é uma preferência declarada e não substitui uma avaliação regulatória de perfil.
        </p>
        <div className={styles.choiceGrid}>
          {RISK_TOLERANCE_CODES.map((risk, index) => {
            const content = RISK_LABELS[risk];
            const checked = draft.riskTolerance === risk;

            return (
              <label
                className={checked ? styles.choiceSelected : styles.choice}
                data-onboarding-choice
                key={risk}
              >
                <input
                  className={styles.visuallyHiddenControl}
                  type="radio"
                  name="riskTolerance"
                  value={risk}
                  checked={checked}
                  data-invalid={index === 0 && riskError !== undefined ? "true" : undefined}
                  onChange={() =>
                    dispatch({ type: "update-profile", field: "riskTolerance", value: risk })
                  }
                />
                <span className={styles.choiceMarker} aria-hidden="true" />
                <strong>{content.title}</strong>
                <span>{content.description}</span>
              </label>
            );
          })}
        </div>
        <FieldError id="risk-error" message={riskError} />
      </fieldset>

      <fieldset
        className={styles.fieldset}
        aria-describedby={describedBy("horizon-help", "horizon-error", horizonError !== undefined)}
      >
        <legend className={styles.legend}>Horizonte financeiro</legend>
        <p className={styles.helpText} id="horizon-help">
          Escolha a categoria que melhor representa seu horizonte, sem converter automaticamente
          para anos.
        </p>
        <div className={styles.segmentedChoices}>
          {FINANCIAL_HORIZON_CODES.map((horizon, index) => (
            <label
              className={draft.horizon === horizon ? styles.segmentSelected : styles.segment}
              data-onboarding-segment
              key={horizon}
            >
              <input
                className={styles.visuallyHiddenControl}
                type="radio"
                name="horizon"
                value={horizon}
                checked={draft.horizon === horizon}
                data-invalid={index === 0 && horizonError !== undefined ? "true" : undefined}
                onChange={() =>
                  dispatch({ type: "update-profile", field: "horizon", value: horizon })
                }
              />
              {HORIZON_LABELS[horizon]}
            </label>
          ))}
        </div>
        <FieldError id="horizon-error" message={horizonError} />
      </fieldset>
    </div>
  );
}

function ReserveStep({
  draft,
  errors,
  dispatch,
}: Readonly<{ draft: OnboardingDraft; errors: FieldErrors; dispatch: OnboardingDispatch }>) {
  const reserveError = errors["reserve.target"];

  return (
    <div className={styles.stepBody}>
      <div className={styles.reserveChoice}>
        <div>
          <strong>Definir uma meta agora</strong>
          <p>Essa informação representa a meta desejada, não o saldo que você possui hoje.</p>
        </div>
        <label className={styles.switchLabel}>
          <input
            type="checkbox"
            checked={draft.reserveEnabled}
            aria-label="Definir meta de reserva de emergência"
            onChange={(event) =>
              dispatch({ type: "toggle-reserve", enabled: event.target.checked })
            }
          />
          <span aria-hidden="true" />
        </label>
      </div>

      {draft.reserveEnabled ? (
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reserve-target">
            Meta da reserva em {draft.referenceCurrency}
          </label>
          <input
            className={styles.textInput}
            id="reserve-target"
            name="reserveTarget"
            inputMode="decimal"
            autoComplete="off"
            placeholder="10000,00"
            value={draft.reserveTarget}
            aria-invalid={reserveError !== undefined}
            aria-describedby={describedBy(
              "reserve-help",
              "reserve-error",
              reserveError !== undefined,
            )}
            onChange={(event) => dispatch({ type: "update-reserve", value: event.target.value })}
          />
          <p className={styles.helpText} id="reserve-help">
            O valor permanece como texto na interface e só vira Money durante a validação.
          </p>
          <FieldError id="reserve-error" message={reserveError} />
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Meta pendente</strong>
          <p>Você poderá completar esse dado em uma etapa futura do produto.</p>
        </div>
      )}
    </div>
  );
}

function GoalEditor({
  goal,
  index,
  errors,
  dispatch,
}: Readonly<{
  goal: GoalDraft;
  index: number;
  errors: FieldErrors;
  dispatch: OnboardingDispatch;
}>) {
  const prefix = `goals.${goal.clientId}`;
  const typeError = errors[`${prefix}.type`];
  const amountError = errors[`${prefix}.targetAmount`];
  const dateError = errors[`${prefix}.targetDate`];
  const dateRequiredByDomain = goal.type === "DATED_PURPOSE";

  return (
    <section className={styles.goalEditor} aria-labelledby={`${goal.clientId}-title`}>
      <div className={styles.goalHeader}>
        <div>
          <span className={styles.goalNumber}>Objetivo {index + 1}</span>
          <h3 id={`${goal.clientId}-title`}>
            {goal.type === "" ? "Novo objetivo" : GOAL_LABELS[goal.type]}
          </h3>
        </div>
        <button
          className={styles.textButton}
          type="button"
          onClick={() => dispatch({ type: "remove-goal", clientId: goal.clientId })}
        >
          Remover
        </button>
      </div>

      <div className={styles.goalGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`${goal.clientId}-type`}>
            Tipo
          </label>
          <select
            className={styles.selectInput}
            id={`${goal.clientId}-type`}
            value={goal.type}
            aria-invalid={typeError !== undefined}
            aria-describedby={typeError === undefined ? undefined : `${goal.clientId}-type-error`}
            onChange={(event) =>
              dispatch({
                type: "update-goal",
                clientId: goal.clientId,
                patch: { type: event.target.value as FinancialGoalTypeCode | "" },
              })
            }
          >
            <option value="">Selecione</option>
            {FINANCIAL_GOAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {GOAL_LABELS[type]}
              </option>
            ))}
          </select>
          <FieldError id={`${goal.clientId}-type-error`} message={typeError} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`${goal.clientId}-amount`}>
            {goal.type === "PASSIVE_INCOME_MONTHLY" ? "Valor mensal-alvo" : "Valor-alvo"}
          </label>
          <input
            className={styles.textInput}
            id={`${goal.clientId}-amount`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="50000,00"
            value={goal.targetAmount}
            aria-invalid={amountError !== undefined}
            aria-describedby={
              amountError === undefined ? undefined : `${goal.clientId}-amount-error`
            }
            onChange={(event) =>
              dispatch({
                type: "update-goal",
                clientId: goal.clientId,
                patch: { targetAmount: event.target.value },
              })
            }
          />
          <FieldError id={`${goal.clientId}-amount-error`} message={amountError} />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`${goal.clientId}-date`}>
            Data-alvo {dateRequiredByDomain ? "(obrigatória)" : "(opcional)"}
          </label>
          <input
            className={styles.textInput}
            id={`${goal.clientId}-date`}
            type="date"
            value={goal.targetDate}
            aria-required={dateRequiredByDomain}
            aria-invalid={dateError !== undefined}
            aria-describedby={dateError === undefined ? undefined : `${goal.clientId}-date-error`}
            onChange={(event) =>
              dispatch({
                type: "update-goal",
                clientId: goal.clientId,
                patch: { targetDate: event.target.value },
              })
            }
          />
          <FieldError id={`${goal.clientId}-date-error`} message={dateError} />
        </div>
      </div>
    </section>
  );
}

function GoalsStep({
  draft,
  errors,
  nextGoalId,
  dispatch,
}: Readonly<{
  draft: OnboardingDraft;
  errors: FieldErrors;
  nextGoalId: () => string;
  dispatch: OnboardingDispatch;
}>) {
  return (
    <div className={styles.stepBody}>
      {draft.goals.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>Nenhum objetivo adicionado</strong>
          <p>O domínio permite seguir sem objetivos; você pode adicioná-los quando quiser.</p>
        </div>
      ) : (
        <div className={styles.goalList}>
          {draft.goals.map((goal, index) => (
            <GoalEditor
              key={goal.clientId}
              goal={goal}
              index={index}
              errors={errors}
              dispatch={dispatch}
            />
          ))}
        </div>
      )}

      <button
        className={styles.secondaryButton}
        type="button"
        onClick={() => dispatch({ type: "add-goal", clientId: nextGoalId() })}
      >
        Adicionar objetivo
      </button>
    </div>
  );
}

function GoalReview({ goal }: Readonly<{ goal: FinancialGoalSnapshot }>) {
  return (
    <div className={styles.reviewRow}>
      <div>
        <strong>{GOAL_LABELS[goal.type]}</strong>
        <span>{formatDate(goal.targetDate)}</span>
      </div>
      <strong>{formatMoney(goal.targetAmount)}</strong>
    </div>
  );
}

function ReviewStep({
  snapshot,
  persistenceStatus,
  onPersist,
  onRemovePersisted,
  onEdit,
  onReset,
}: Readonly<{
  snapshot: FinancialProfileSnapshot;
  persistenceStatus: FinancialProfilePersistenceStatus;
  onPersist: () => boolean;
  onRemovePersisted: () => boolean;
  onEdit: () => void;
  onReset: () => void;
}>) {
  const isPersisted = persistenceStatus === "persisted";
  const storageUnavailable = persistenceStatus === "unavailable";

  return (
    <div className={styles.stepBody}>
      <div className={styles.reviewGrid}>
        <div className={styles.reviewItem}>
          <span>Moeda de referência</span>
          <strong>{snapshot.referenceCurrency}</strong>
        </div>
        <div className={styles.reviewItem}>
          <span>Tolerância a risco</span>
          <strong>{RISK_LABELS[snapshot.riskTolerance].title}</strong>
        </div>
        <div className={styles.reviewItem}>
          <span>Horizonte</span>
          <strong>{HORIZON_LABELS[snapshot.horizon]}</strong>
        </div>
        <div className={styles.reviewItem}>
          <span>Meta de reserva</span>
          <strong>
            {snapshot.emergencyReserveTarget === null
              ? "Pendente"
              : formatMoney(snapshot.emergencyReserveTarget)}
          </strong>
        </div>
      </div>

      <section className={styles.reviewSection} aria-labelledby="review-goals-title">
        <div className={styles.reviewSectionHeader}>
          <h3 id="review-goals-title">Objetivos</h3>
          <span>{snapshot.goals.length}</span>
        </div>
        {snapshot.goals.length === 0 ? (
          <p className={styles.mutedText}>Nenhum objetivo registrado.</p>
        ) : (
          <div className={styles.reviewRows}>
            {snapshot.goals.map((goal) => (
              <GoalReview key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>

      <div className={styles.reviewNotice} role="status">
        <strong>
          {isPersisted
            ? "Perfil salvo neste dispositivo."
            : "Perfil validado e compartilhado nesta sessão."}
        </strong>
        <span>
          {isPersisted
            ? "Recarregar pode restaurar este perfil neste navegador. Nada é sincronizado com conta, servidor ou outro dispositivo."
            : storageUnavailable
              ? "O armazenamento local não está disponível. O perfil continua utilizável nesta sessão e você pode tentar salvá-lo novamente."
              : "Por padrão, o perfil fica somente em memória. Salve neste dispositivo apenas se quiser restaurá-lo após recarregar."}
        </span>
      </div>

      <div className={styles.reviewActions}>
        <button className={styles.secondaryButton} type="button" onClick={onEdit}>
          Editar dados
        </button>
        {isPersisted ? (
          <button className={styles.secondaryButton} type="button" onClick={onRemovePersisted}>
            Remover deste dispositivo
          </button>
        ) : (
          <button className={styles.primaryButton} type="button" onClick={onPersist}>
            {storageUnavailable ? "Tentar salvar neste dispositivo" : "Salvar neste dispositivo"}
          </button>
        )}
        <button className={styles.textButton} type="button" onClick={onReset}>
          {isPersisted ? "Recomeçar e apagar perfil" : "Recomeçar"}
        </button>
      </div>
    </div>
  );
}

export function FinancialOnboardingFlow() {
  const {
    persistenceStatus,
    publishFinancialProfile,
    persistFinancialProfile,
    removePersistedFinancialProfile,
    clearFinancialProfile,
  } = useFinancialSession();
  const [state, dispatch] = useReducer(onboardingReducer, undefined, createInitialOnboardingState);
  const nextGoalSequence = useRef(1);
  const activeIndex = ONBOARDING_STEPS.indexOf(state.step);
  const activeCopy = STEP_COPY[state.step];
  const errorMessage = firstErrorMessage(state.errors);

  function nextGoalId(): string {
    const id = `goal-${nextGoalSequence.current}`;
    nextGoalSequence.current += 1;
    return id;
  }

  function goBack(): void {
    if (state.step === "reserve") dispatch({ type: "go-to-step", step: "profile" });
    if (state.step === "goals") dispatch({ type: "go-to-step", step: "reserve" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (state.step === "review") return;

    const result = validateOnboardingStep(state.step, state.draft, createBrowserId);

    if (!result.ok) {
      dispatch({ type: "validation-failed", errors: result.errors });
      focusFirstInvalidField();
      return;
    }

    if (state.step === "profile") {
      dispatch({ type: "go-to-step", step: "reserve" });
      return;
    }

    if (state.step === "reserve") {
      dispatch({ type: "go-to-step", step: "goals" });
      return;
    }

    if (result.snapshot === null) return;

    publishFinancialProfile(result.snapshot);
    dispatch({ type: "review-ready", snapshot: result.snapshot });
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.progressPanel} aria-label="Progresso do onboarding">
        <ol className={styles.progressList}>
          {ONBOARDING_STEPS.map((step, index) => {
            const copy = STEP_COPY[step];
            const isCurrent = step === state.step;
            const isCompleted = index < activeIndex;

            return (
              <li
                className={isCurrent ? styles.progressCurrent : styles.progressItem}
                key={step}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className={isCompleted ? styles.progressDone : styles.progressNumber}>
                  {isCompleted ? "✓" : index + 1}
                </span>
                <span>
                  <strong>{copy.label}</strong>
                  <small>{copy.summary}</small>
                </span>
              </li>
            );
          })}
        </ol>

        <div className={styles.persistenceNote}>
          <strong>Persistência sob seu controle</strong>
          <p>
            Por padrão, o perfil fica só nesta sessão. Na revisão, você decide se quer salvá-lo neste
            dispositivo para restaurá-lo após recarregar.
          </p>
        </div>
      </aside>

      <div className={styles.mainContent}>
        <section className={styles.formSurface} aria-labelledby="onboarding-title">
          <div className={styles.formHeader}>
            <span className={styles.stepCounter}>
              Etapa {activeIndex + 1} de {ONBOARDING_STEPS.length}
            </span>
            <h1 id="onboarding-title">{activeCopy.title}</h1>
            <p>{activeCopy.description}</p>
          </div>

          {state.step === "review" && state.snapshot !== null ? (
            <ReviewStep
              snapshot={state.snapshot}
              persistenceStatus={persistenceStatus}
              onPersist={persistFinancialProfile}
              onRemovePersisted={removePersistedFinancialProfile}
              onEdit={() => dispatch({ type: "go-to-step", step: "profile" })}
              onReset={() => {
                nextGoalSequence.current = 1;
                clearFinancialProfile();
                dispatch({ type: "reset" });
              }}
            />
          ) : (
            <form className={styles.form} noValidate onSubmit={handleSubmit}>
              {errorMessage === null ? null : (
                <div className={styles.errorSummary} role="alert" tabIndex={-1}>
                  <strong>Revise os campos destacados.</strong>
                  <span>{errorMessage}</span>
                </div>
              )}

              {state.step === "profile" ? (
                <ProfileStep draft={state.draft} errors={state.errors} dispatch={dispatch} />
              ) : null}
              {state.step === "reserve" ? (
                <ReserveStep draft={state.draft} errors={state.errors} dispatch={dispatch} />
              ) : null}
              {state.step === "goals" ? (
                <GoalsStep
                  draft={state.draft}
                  errors={state.errors}
                  nextGoalId={nextGoalId}
                  dispatch={dispatch}
                />
              ) : null}

              <div className={styles.formActions}>
                {state.step === "profile" ? (
                  <Link className={styles.backLink} href="/dashboard">
                    Voltar ao dashboard
                  </Link>
                ) : (
                  <button className={styles.backButton} type="button" onClick={goBack}>
                    Voltar
                  </button>
                )}
                <button className={styles.primaryButton} type="submit">
                  {state.step === "goals" ? "Revisar perfil" : "Continuar"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
