"use client";

import {
  Money,
  type FinancialGoalSnapshot,
  type FinancialGoalTypeCode,
  type FinancialHorizonCode,
  type MoneySnapshot,
  type RiskToleranceCode,
} from "@portfolio-copilot/domain";

import { Button, EmptyState, LinkButton, Status, Surface } from "./ui";
import { useFinancialSession } from "./financial-session";
import styles from "./financial-profile-session-summary.module.css";

const RISK_LABELS: Record<RiskToleranceCode, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
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

function formatMoney(snapshot: MoneySnapshot): string {
  const decimal = Money.fromSnapshot(snapshot).toDecimalString().replace(".", ",");
  return `${snapshot.currency} ${decimal}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function GoalItem({ goal }: Readonly<{ goal: FinancialGoalSnapshot }>) {
  return (
    <li className={styles.goalItem}>
      <div>
        <strong>{GOAL_LABELS[goal.type]}</strong>
        {goal.targetDate === null ? null : <span>Até {formatDate(goal.targetDate)}</span>}
      </div>
      <span className={styles.goalAmount}>{formatMoney(goal.targetAmount)}</span>
    </li>
  );
}

export function FinancialProfileSessionSummary() {
  const { financialProfile, persistenceStatus, removePersistedFinancialProfile } =
    useFinancialSession();
  const isPersisted = financialProfile !== null && persistenceStatus === "persisted";

  return (
    <aside className={styles.context} aria-label="Perfil financeiro da sessão">
      <details className={styles.disclosure}>
        <summary>
          <span>Contexto financeiro da sessão</span>
          <Status tone={financialProfile === null ? "neutral" : "info"}>
            {financialProfile === null
              ? "Não configurado"
              : isPersisted
                ? "Salvo neste dispositivo"
                : "Somente nesta sessão"}
          </Status>
        </summary>

        <Surface tone="subtle" padding="lg" className={styles.surface}>
          <div className={styles.intro}>
            <p>
              {financialProfile === null
                ? "Nenhum contexto financeiro validado foi compartilhado nesta sessão."
                : isPersisted
                  ? "Contexto declarado no onboarding e salvo localmente neste navegador."
                  : "Contexto declarado no onboarding e compartilhado somente nesta sessão."}
            </p>
            {isPersisted ? (
              <Button variant="ghost" size="sm" onClick={removePersistedFinancialProfile}>
                Remover cópia local do perfil
              </Button>
            ) : null}
          </div>

          {financialProfile === null ? (
            <EmptyState
              title="Perfil financeiro não configurado"
              description="A Carteira não inventa moeda, risco, horizonte, reserva ou objetivos na ausência de um snapshot validado."
              action={
                <LinkButton href="/onboarding" variant="secondary" size="sm">
                  Configurar no onboarding
                </LinkButton>
              }
            />
          ) : (
            <div className={styles.content}>
              <dl className={styles.profileFacts}>
                <div>
                  <dt>Moeda</dt>
                  <dd>{financialProfile.referenceCurrency}</dd>
                </div>
                <div>
                  <dt>Risco</dt>
                  <dd>{RISK_LABELS[financialProfile.riskTolerance]}</dd>
                </div>
                <div>
                  <dt>Horizonte</dt>
                  <dd>{HORIZON_LABELS[financialProfile.horizon]}</dd>
                </div>
              </dl>

              <div className={styles.targetSection}>
                <div className={styles.targetHeading}>
                  <span>Meta de reserva de emergência</span>
                  <strong>
                    {financialProfile.emergencyReserveTarget === null
                      ? "Não definida"
                      : formatMoney(financialProfile.emergencyReserveTarget)}
                  </strong>
                </div>
                <p>Meta desejada declarada; não representa saldo atual nem percentual concluído.</p>
              </div>

              <div className={styles.goalsSection}>
                <div className={styles.goalsHeading}>
                  <span>Objetivos</span>
                  <strong>{financialProfile.goals.length}</strong>
                </div>
                {financialProfile.goals.length === 0 ? (
                  <p className={styles.noGoals}>
                    Nenhum objetivo registrado no perfil desta sessão.
                  </p>
                ) : (
                  <ul className={styles.goalList}>
                    {financialProfile.goals.map((goal) => (
                      <GoalItem key={goal.id} goal={goal} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <p className={styles.sessionNote}>
            {isPersisted
              ? "Salvo localmente neste navegador: recarregar pode restaurar este perfil. Não existe sincronização automática com conta ou outro dispositivo. A migração para a conta é uma ação separada no Dashboard."
              : persistenceStatus === "unavailable"
                ? "Armazenamento local indisponível: este perfil permanece somente na sessão atual."
                : "Somente em memória: este perfil ainda não está salvo neste dispositivo."}
          </p>
        </Surface>
      </details>
    </aside>
  );
}
