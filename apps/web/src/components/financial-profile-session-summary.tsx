"use client";

import Link from "next/link";

import {
  Money,
  type FinancialGoalSnapshot,
  type FinancialGoalTypeCode,
  type FinancialHorizonCode,
  type MoneySnapshot,
  type RiskToleranceCode,
} from "@portfolio-copilot/domain";

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
  const { financialProfile, persistenceStatus } = useFinancialSession();
  const isPersisted = financialProfile !== null && persistenceStatus === "persisted";

  return (
    <aside className={styles.surface} aria-label="Perfil financeiro da sessão">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Perfil financeiro da sessão</span>
          <p>
            {financialProfile === null
              ? "Nenhum contexto financeiro validado foi compartilhado nesta sessão."
              : isPersisted
                ? "Contexto declarado no onboarding e salvo localmente neste navegador."
                : "Contexto declarado no onboarding e compartilhado somente nesta sessão."}
          </p>
        </div>
        <span className={financialProfile === null ? styles.emptyStatus : styles.activeStatus}>
          {financialProfile === null
            ? "Não configurado"
            : isPersisted
              ? "Salvo neste dispositivo"
              : "Somente nesta sessão"}
        </span>
      </div>

      {financialProfile === null ? (
        <div className={styles.emptyState}>
          <div>
            <strong>Configure seu perfil para contextualizar estas superfícies</strong>
            <p>
              Dashboard e Carteira não inventam moeda, risco, horizonte, reserva ou objetivos na
              ausência de um snapshot validado.
            </p>
          </div>
          <Link className={styles.action} href="/onboarding">
            Configurar no onboarding
          </Link>
        </div>
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
              <p className={styles.noGoals}>Nenhum objetivo registrado no perfil desta sessão.</p>
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
          ? "Salvo localmente neste navegador: recarregar pode restaurar este perfil. Não existe sincronização com conta, servidor ou outro dispositivo."
          : persistenceStatus === "unavailable"
            ? "Armazenamento local indisponível: este perfil permanece somente na sessão atual."
            : "Somente em memória: este perfil ainda não está salvo neste dispositivo."}
      </p>
    </aside>
  );
}
