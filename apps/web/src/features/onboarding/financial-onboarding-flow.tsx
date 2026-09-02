"use client";

import { useEffect, useReducer, useRef, type Dispatch, type FormEvent } from "react";

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
import {
  Alert,
  Button,
  ChoiceCard,
  Cluster,
  Disclosure,
  EmptyState,
  Field,
  FieldError,
  Grid,
  HelpText,
  Label,
  LinkButton,
  PageHeader,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Stack,
  Status,
  Surface,
  TextInput,
} from "@/components/ui";

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
    description: "Confira o snapshot validado antes de decidir se quer salvá-lo neste dispositivo.",
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

function FieldValidationError({
  id,
  message,
}: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return <FieldError id={id}>{message}</FieldError>;
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
    <Stack className={styles.stepBody} space="xl">
      <Field>
        <Label htmlFor="reference-currency" required>
          Moeda de referência
        </Label>
        <TextInput
          id="reference-currency"
          name="referenceCurrency"
          required
          value={draft.referenceCurrency}
          maxLength={3}
          autoCapitalize="characters"
          autoComplete="off"
          invalid={currencyError !== undefined}
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
        <HelpText id="currency-help">
          Use o código de três letras da moeda que servirá como referência, como BRL.
        </HelpText>
        <FieldValidationError id="currency-error" message={currencyError} />
      </Field>

      <fieldset
        className={styles.choiceFieldset}
        aria-describedby={describedBy("risk-help", "risk-error", riskError !== undefined)}
      >
        <legend className={styles.groupLegend}>Tolerância a risco (obrigatório)</legend>
        <HelpText id="risk-help">
          Esta é uma preferência declarada e não substitui uma avaliação regulatória de perfil.
        </HelpText>
        <Grid minimum="sm" space="sm" className={styles.riskGrid}>
          {RISK_TOLERANCE_CODES.map((risk, index) => {
            const content = RISK_LABELS[risk];

            return (
              <ChoiceCard
                key={risk}
                name="riskTolerance"
                required
                value={risk}
                checked={draft.riskTolerance === risk}
                title={content.title}
                description={content.description}
                data-invalid={index === 0 && riskError !== undefined ? "true" : undefined}
                onChange={() =>
                  dispatch({ type: "update-profile", field: "riskTolerance", value: risk })
                }
              />
            );
          })}
        </Grid>
        <FieldValidationError id="risk-error" message={riskError} />
      </fieldset>

      <div className={styles.choiceGroup}>
        <SegmentedControl
          legend="Horizonte financeiro (obrigatório)"
          aria-describedby={describedBy(
            "horizon-help",
            "horizon-error",
            horizonError !== undefined,
          )}
        >
          {FINANCIAL_HORIZON_CODES.map((horizon, index) => (
            <SegmentedControlOption
              key={horizon}
              name="horizon"
              required
              value={horizon}
              checked={draft.horizon === horizon}
              data-invalid={index === 0 && horizonError !== undefined ? "true" : undefined}
              onChange={() =>
                dispatch({ type: "update-profile", field: "horizon", value: horizon })
              }
            >
              {HORIZON_LABELS[horizon]}
            </SegmentedControlOption>
          ))}
        </SegmentedControl>
        <HelpText id="horizon-help">
          Escolha a categoria que melhor representa seu horizonte, sem converter automaticamente
          para anos.
        </HelpText>
        <FieldValidationError id="horizon-error" message={horizonError} />
      </div>
    </Stack>
  );
}

function ReserveStep({
  draft,
  errors,
  dispatch,
}: Readonly<{ draft: OnboardingDraft; errors: FieldErrors; dispatch: OnboardingDispatch }>) {
  const reserveError = errors["reserve.target"];

  return (
    <Stack className={styles.stepBody} space="xl">
      <ChoiceCard
        type="checkbox"
        checked={draft.reserveEnabled}
        title="Definir uma meta de reserva"
        description="Representa a meta desejada, não o saldo que você possui hoje. Você pode deixar esse dado para depois."
        onChange={(event) => dispatch({ type: "toggle-reserve", enabled: event.target.checked })}
      />

      {draft.reserveEnabled ? (
        <Field>
          <Label htmlFor="reserve-target" required>
            Meta da reserva em {draft.referenceCurrency}
          </Label>
          <TextInput
            id="reserve-target"
            name="reserveTarget"
            required
            inputMode="decimal"
            autoComplete="off"
            placeholder="10000,00"
            value={draft.reserveTarget}
            invalid={reserveError !== undefined}
            aria-describedby={describedBy(
              "reserve-help",
              "reserve-error",
              reserveError !== undefined,
            )}
            onChange={(event) => dispatch({ type: "update-reserve", value: event.target.value })}
          />
          <HelpText id="reserve-help">
            O valor só é convertido em Money quando a etapa é validada.
          </HelpText>
          <FieldValidationError id="reserve-error" message={reserveError} />
        </Field>
      ) : null}
    </Stack>
  );
}

function GoalEditor({
  goal,
  index,
  errors,
  dispatch,
  headingRef,
  onRemove,
}: Readonly<{
  goal: GoalDraft;
  index: number;
  errors: FieldErrors;
  dispatch: OnboardingDispatch;
  headingRef: (node: HTMLHeadingElement | null) => void;
  onRemove: () => void;
}>) {
  const prefix = `goals.${goal.clientId}`;
  const typeError = errors[`${prefix}.type`];
  const amountError = errors[`${prefix}.targetAmount`];
  const dateError = errors[`${prefix}.targetDate`];
  const dateRequiredByDomain = goal.type === "DATED_PURPOSE";

  return (
    <section className={styles.goalEditor} aria-labelledby={`${goal.clientId}-title`}>
      <Stack space="lg">
        <div className={styles.goalHeader}>
          <div>
            <span className={styles.goalNumber}>Objetivo {index + 1}</span>
            <h3 id={`${goal.clientId}-title`} ref={headingRef} tabIndex={-1}>
              {goal.type === "" ? "Novo objetivo" : GOAL_LABELS[goal.type]}
            </h3>
          </div>
          <Button variant="ghost" size="sm" type="button" onClick={onRemove}>
            Remover
          </Button>
        </div>

        <Grid minimum="md" space="md">
          <Field>
            <Label htmlFor={`${goal.clientId}-type`} required>
              Tipo
            </Label>
            <Select
              id={`${goal.clientId}-type`}
              required
              value={goal.type}
              invalid={typeError !== undefined}
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
            </Select>
            <FieldValidationError id={`${goal.clientId}-type-error`} message={typeError} />
          </Field>

          <Field>
            <Label htmlFor={`${goal.clientId}-amount`} required>
              {goal.type === "PASSIVE_INCOME_MONTHLY" ? "Valor mensal-alvo" : "Valor-alvo"}
            </Label>
            <TextInput
              id={`${goal.clientId}-amount`}
              required
              inputMode="decimal"
              autoComplete="off"
              placeholder="50000,00"
              value={goal.targetAmount}
              invalid={amountError !== undefined}
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
            <FieldValidationError id={`${goal.clientId}-amount-error`} message={amountError} />
          </Field>

          <Field>
            <Label htmlFor={`${goal.clientId}-date`} required={dateRequiredByDomain}>
              Data-alvo {dateRequiredByDomain ? "" : "(opcional)"}
            </Label>
            <TextInput
              id={`${goal.clientId}-date`}
              type="date"
              value={goal.targetDate}
              required={dateRequiredByDomain}
              invalid={dateError !== undefined}
              aria-describedby={dateError === undefined ? undefined : `${goal.clientId}-date-error`}
              onChange={(event) =>
                dispatch({
                  type: "update-goal",
                  clientId: goal.clientId,
                  patch: { targetDate: event.target.value },
                })
              }
            />
            <FieldValidationError id={`${goal.clientId}-date-error`} message={dateError} />
          </Field>
        </Grid>
      </Stack>
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
  const goalHeadingRefs = useRef<Record<string, HTMLHeadingElement | null>>({});
  const addGoalButtonRef = useRef<HTMLButtonElement>(null);
  const pendingGoalFocusRef = useRef<string | "add-button" | null>(null);

  useEffect(() => {
    const target = pendingGoalFocusRef.current;
    if (target === null) return;

    if (target === "add-button") {
      addGoalButtonRef.current?.focus();
    } else {
      goalHeadingRefs.current[target]?.focus();
    }
    pendingGoalFocusRef.current = null;
  }, [draft.goals]);

  function addGoal(): void {
    const clientId = nextGoalId();
    pendingGoalFocusRef.current = clientId;
    dispatch({ type: "add-goal", clientId });
  }

  function removeGoal(clientId: string, index: number): void {
    pendingGoalFocusRef.current =
      draft.goals[index + 1]?.clientId ?? draft.goals[index - 1]?.clientId ?? "add-button";
    dispatch({ type: "remove-goal", clientId });
  }

  return (
    <Stack className={styles.stepBody} space="lg">
      {draft.goals.length === 0 ? (
        <EmptyState
          title="Nenhum objetivo adicionado"
          description="Objetivos são opcionais nesta versão. Adicione um agora ou siga direto para a revisão."
          action={
            <Button ref={addGoalButtonRef} type="button" variant="secondary" onClick={addGoal}>
              Adicionar objetivo
            </Button>
          }
        />
      ) : (
        <>
          <Stack space="md">
            {draft.goals.map((goal, index) => (
              <GoalEditor
                key={goal.clientId}
                goal={goal}
                index={index}
                errors={errors}
                dispatch={dispatch}
                headingRef={(node) => {
                  goalHeadingRefs.current[goal.clientId] = node;
                }}
                onRemove={() => removeGoal(goal.clientId, index)}
              />
            ))}
          </Stack>
          <div>
            <Button ref={addGoalButtonRef} type="button" variant="secondary" onClick={addGoal}>
              Adicionar outro objetivo
            </Button>
          </div>
        </>
      )}
    </Stack>
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
  const persistenceMessage = isPersisted
    ? "Recarregar pode restaurar este perfil neste navegador. Nada é sincronizado automaticamente com conta, servidor ou outro dispositivo."
    : storageUnavailable
      ? "O armazenamento local não está disponível. O perfil continua utilizável nesta sessão e você pode tentar salvar novamente."
      : "O perfil está validado nesta sessão. Salve neste dispositivo somente se quiser restaurá-lo após recarregar.";

  return (
    <Stack className={styles.stepBody} space="xl">
      <Grid minimum="sm" space="sm" className={styles.reviewGrid}>
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
      </Grid>

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

      <div className={styles.persistenceState}>
        <Status tone={isPersisted ? "success" : storageUnavailable ? "warning" : "neutral"}>
          {isPersisted
            ? "Salvo neste dispositivo"
            : storageUnavailable
              ? "Armazenamento indisponível"
              : "Somente nesta sessão"}
        </Status>
        <p>{persistenceMessage}</p>
      </div>

      <Cluster className={styles.reviewActions} space="sm">
        <Button variant="secondary" type="button" onClick={onEdit}>
          Editar dados
        </Button>
        {isPersisted ? (
          <Button variant="secondary" type="button" onClick={() => void onRemovePersisted()}>
            Remover deste dispositivo
          </Button>
        ) : (
          <Button type="button" onClick={() => void onPersist()}>
            {storageUnavailable ? "Tentar salvar neste dispositivo" : "Salvar neste dispositivo"}
          </Button>
        )}
        <Button variant="ghost" type="button" onClick={onReset}>
          {isPersisted ? "Recomeçar e apagar perfil" : "Recomeçar"}
        </Button>
      </Cluster>
    </Stack>
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
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(state.step);
  const activeIndex = ONBOARDING_STEPS.indexOf(state.step);
  const activeCopy = STEP_COPY[state.step];
  const errorMessage = firstErrorMessage(state.errors);

  useEffect(() => {
    if (previousStepRef.current === state.step) return;

    previousStepRef.current = state.step;
    stepHeadingRef.current?.focus();
  }, [state.step]);

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
    <div className={styles.flow}>
      <PageHeader
        title="Perfil financeiro"
        description="Defina seu contexto financeiro em quatro etapas curtas. Você pode revisar tudo antes de salvar no dispositivo."
      />

      <section className={styles.progress} aria-label="Progresso do onboarding">
        <div className={styles.progressMeta}>
          <strong>
            Etapa {activeIndex + 1} de {ONBOARDING_STEPS.length}
          </strong>
          <span>{activeCopy.label}</span>
        </div>
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
                data-completed={isCompleted ? "true" : undefined}
              >
                <span className={styles.progressNumber} aria-hidden="true">
                  {isCompleted ? "✓" : index + 1}
                </span>
                <span className={styles.progressCopy}>
                  <strong>{copy.label}</strong>
                  <small>{copy.summary}</small>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <Surface tone="default" padding="md" className={styles.stepSurface}>
        <Stack space="xl">
          <div className={styles.stepHeading}>
            <h2 id="onboarding-step-title" ref={stepHeadingRef} tabIndex={-1}>
              {activeCopy.title}
            </h2>
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
              <Stack space="xl">
                {errorMessage === null ? null : (
                  <Alert tone="danger" title="Revise os campos destacados.">
                    {errorMessage}
                  </Alert>
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

                <Cluster className={styles.formActions} space="sm" justify="between">
                  {state.step === "profile" ? (
                    <LinkButton href="/dashboard" variant="ghost">
                      Voltar ao dashboard
                    </LinkButton>
                  ) : (
                    <Button variant="secondary" type="button" onClick={goBack}>
                      Voltar
                    </Button>
                  )}
                  <Button type="submit">
                    {state.step === "goals" ? "Revisar perfil" : "Continuar"}
                  </Button>
                </Cluster>
              </Stack>
            </form>
          )}
        </Stack>
      </Surface>

      <Disclosure className={styles.persistenceDisclosure} summary="Como este perfil é salvo?">
        <p>
          Por padrão, o perfil fica somente nesta sessão. Na revisão, você decide se quer salvá-lo
          neste dispositivo para restaurá-lo após recarregar. Nada é sincronizado automaticamente
          com sua conta ou outro dispositivo.
        </p>
      </Disclosure>
    </div>
  );
}
