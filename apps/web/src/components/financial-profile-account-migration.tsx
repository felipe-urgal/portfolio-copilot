"use client";

import { useCallback, useEffect, useState } from "react";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { useFinancialSession } from "./financial-session";
import styles from "./financial-profile-account-migration.module.css";
import {
  canonicalFinancialProfileSnapshot,
  compareFinancialProfiles,
  type FinancialProfileDifferenceKey,
} from "@/lib/financial-profile-account-migration";

const DIFFERENCE_LABELS: Record<FinancialProfileDifferenceKey, string> = {
  profileIdentity: "Identidade interna do perfil",
  referenceCurrency: "Moeda de referência",
  riskTolerance: "Tolerância a risco",
  horizon: "Horizonte financeiro",
  emergencyReserveTarget: "Meta de reserva de emergência",
  goals: "Objetivos financeiros",
};

type AccountLoadState =
  | Readonly<{ status: "idle" | "loading" }>
  | Readonly<{ status: "ready"; profile: FinancialProfileSnapshot | null }>
  | Readonly<{ status: "error" }>;

type FinancialProfileAccountMigrationProps = Readonly<{
  initialAccountProfile?: FinancialProfileSnapshot | null;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function profileFromPayload(payload: unknown): FinancialProfileSnapshot | null {
  if (!isRecord(payload) || !("profile" in payload)) {
    throw new Error("Invalid account profile response.");
  }

  if (payload.profile === null) return null;
  return canonicalFinancialProfileSnapshot(payload.profile as FinancialProfileSnapshot);
}

export function FinancialProfileAccountMigration({
  initialAccountProfile,
}: FinancialProfileAccountMigrationProps = {}) {
  const { financialProfile, persistenceStatus, removePersistedFinancialProfile } =
    useFinancialSession();
  const hasPersistedLocalProfile = financialProfile !== null && persistenceStatus === "persisted";
  const [accountState, setAccountState] = useState<AccountLoadState>(() =>
    initialAccountProfile === undefined
      ? { status: "idle" }
      : {
          status: "ready",
          profile:
            initialAccountProfile === null
              ? null
              : canonicalFinancialProfileSnapshot(initialAccountProfile),
        },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadAccountProfile = useCallback(async () => {
    setAccountState({ status: "loading" });
    setStatusMessage(null);

    try {
      const response = await fetch("/api/financial-profile", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload: unknown = await response.json();

      if (!response.ok) throw new Error("Account profile request failed.");
      setAccountState({ status: "ready", profile: profileFromPayload(payload) });
    } catch {
      setAccountState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    if (!hasPersistedLocalProfile || initialAccountProfile !== undefined) return;

    let active = true;
    queueMicrotask(() => {
      if (active) void loadAccountProfile();
    });

    return () => {
      active = false;
    };
  }, [hasPersistedLocalProfile, initialAccountProfile, loadAccountProfile]);

  if (!hasPersistedLocalProfile || financialProfile === null) return null;

  const accountProfile = accountState.status === "ready" ? accountState.profile : null;
  const comparison =
    accountState.status === "ready"
      ? compareFinancialProfiles(financialProfile, accountProfile)
      : null;

  async function migrateLocalProfile(replace: boolean) {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/financial-profile", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ snapshot: financialProfile, replace }),
      });
      const payload: unknown = await response.json();

      if (response.status === 409 && isRecord(payload) && "accountProfile" in payload) {
        const latestAccountProfile =
          payload.accountProfile === null
            ? null
            : canonicalFinancialProfileSnapshot(
                payload.accountProfile as FinancialProfileSnapshot,
              );
        setAccountState({ status: "ready", profile: latestAccountProfile });
        setStatusMessage(
          "O perfil da conta mudou. Revise o conflito atualizado antes de substituir qualquer dado.",
        );
        return;
      }

      if (!response.ok) throw new Error("Financial profile migration failed.");

      const migratedProfile = profileFromPayload(payload);
      if (migratedProfile === null) throw new Error("Missing migrated account profile.");

      setAccountState({ status: "ready", profile: migratedProfile });
      setStatusMessage(
        "Perfil associado à conta. A cópia local foi preservada e só será removida por uma ação separada.",
      );
    } catch {
      setStatusMessage(
        "Não foi possível salvar o perfil na conta. Nenhuma cópia local foi removida.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function keepLocalOnly() {
    setStatusMessage(
      "Perfil mantido somente neste dispositivo. Nenhuma alteração foi enviada para a conta.",
    );
  }

  function discardLocalProfile() {
    const removed = removePersistedFinancialProfile();
    if (!removed) {
      setStatusMessage("Não foi possível remover a cópia local deste dispositivo.");
    }
  }

  return (
    <section className={styles.surface} aria-labelledby="account-migration-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Perfil da conta</span>
          <h2 id="account-migration-title">Associar perfil local à conta</h2>
          <p>
            O perfil salvo neste dispositivo não é enviado automaticamente. A conta só recebe dados
            depois de uma ação explícita abaixo.
          </p>
        </div>
        <span className={styles.badge}>Migração opt-in</span>
      </div>

      {accountState.status === "idle" || accountState.status === "loading" ? (
        <div className={styles.body} aria-live="polite">
          <strong>Verificando o perfil da conta…</strong>
          <p>Esta leitura não envia o perfil salvo no dispositivo.</p>
        </div>
      ) : accountState.status === "error" ? (
        <div className={styles.body}>
          <strong>Não foi possível consultar o perfil da conta.</strong>
          <p>O perfil local continua intacto e nenhum dado financeiro foi enviado.</p>
          <button className={styles.secondaryAction} type="button" onClick={loadAccountProfile}>
            Tentar novamente
          </button>
        </div>
      ) : comparison?.relation === "local-only" ? (
        <div className={styles.body}>
          <strong>A conta ainda não possui um perfil financeiro.</strong>
          <p>
            Você pode copiar o snapshot validado deste dispositivo para a conta ou continuar somente
            com a cópia local.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.primaryAction}
              type="button"
              disabled={isSaving}
              onClick={() => void migrateLocalProfile(false)}
            >
              {isSaving ? "Salvando…" : "Salvar perfil local na conta"}
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={isSaving}
              onClick={keepLocalOnly}
            >
              Manter somente local
            </button>
          </div>
        </div>
      ) : comparison?.relation === "aligned" ? (
        <div className={styles.body}>
          <strong>Perfil local e perfil da conta estão alinhados.</strong>
          <p>Nenhuma gravação adicional é necessária. As duas cópias permanecem independentes.</p>
        </div>
      ) : comparison?.relation === "conflict" ? (
        <div className={styles.body}>
          <strong>Existe um conflito entre o dispositivo e a conta.</strong>
          <p>
            Nada será substituído automaticamente. Revise quais partes diferem e escolha
            explicitamente qual ação deseja executar.
          </p>
          <ul className={styles.differences} aria-label="Diferenças entre perfil local e da conta">
            {comparison.differences.map((difference) => (
              <li key={difference}>{DIFFERENCE_LABELS[difference]}</li>
            ))}
          </ul>
          <div className={styles.actions}>
            <button
              className={styles.primaryAction}
              type="button"
              disabled={isSaving}
              onClick={() => void migrateLocalProfile(true)}
            >
              {isSaving ? "Substituindo…" : "Substituir perfil da conta pelo local"}
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              disabled={isSaving}
              onClick={keepLocalOnly}
            >
              Manter somente local
            </button>
          </div>
        </div>
      ) : null}

      {statusMessage === null ? null : (
        <p className={styles.statusMessage} role="status">
          {statusMessage}
        </p>
      )}

      <div className={styles.localFooter}>
        <div>
          <strong>Cópia deste dispositivo</strong>
          <p>
            Remover a cópia local é uma ação separada: não altera o perfil já salvo na conta e não
            encerra sua sessão.
          </p>
        </div>
        <button
          className={styles.destructiveAction}
          type="button"
          disabled={isSaving}
          onClick={discardLocalProfile}
        >
          Remover cópia local
        </button>
      </div>
    </section>
  );
}
