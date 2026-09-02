"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { useFinancialSession } from "./financial-session";
import styles from "./financial-profile-account-migration.module.css";
import { Alert, Badge, Button, Disclosure, LoadingState, Surface } from "./ui";
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

type MigrationFeedback = Readonly<{
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  description: string;
}>;

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
  const [feedback, setFeedback] = useState<MigrationFeedback | null>(null);
  const [localRemovalCompleted, setLocalRemovalCompleted] = useState(false);
  const removalHeadingRef = useRef<HTMLHeadingElement>(null);

  const loadAccountProfile = useCallback(async () => {
    setAccountState({ status: "loading" });
    setFeedback(null);

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

  if (financialProfile === null) return null;

  if (localRemovalCompleted) {
    return (
      <section className={styles.section} aria-labelledby="account-migration-title">
        <Surface padding="lg" className={styles.surface}>
          <div className={styles.header}>
            <div>
              <span className={styles.eyebrow}>Perfil local</span>
              <h2 id="account-migration-title" ref={removalHeadingRef} tabIndex={-1}>
                Cópia local removida
              </h2>
              <p>
                O perfil continua disponível nesta sessão, mas não será restaurado deste dispositivo
                após recarregar.
              </p>
            </div>
          </div>
          <Alert tone="success" title="Cópia local removida deste dispositivo.">
            <p>O perfil salvo na conta não foi alterado.</p>
          </Alert>
        </Surface>
      </section>
    );
  }

  if (!hasPersistedLocalProfile) return null;

  const accountProfile = accountState.status === "ready" ? accountState.profile : null;
  const comparison =
    accountState.status === "ready"
      ? compareFinancialProfiles(financialProfile, accountProfile)
      : null;

  async function migrateLocalProfile(replace: boolean) {
    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/financial-profile", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snapshot: financialProfile,
          replace,
          ...(replace && accountProfile !== null ? { accountProfile } : {}),
        }),
      });
      const payload: unknown = await response.json();

      if (response.status === 409 && isRecord(payload) && "accountProfile" in payload) {
        const latestAccountProfile =
          payload.accountProfile === null
            ? null
            : canonicalFinancialProfileSnapshot(payload.accountProfile as FinancialProfileSnapshot);
        setAccountState({ status: "ready", profile: latestAccountProfile });
        setFeedback({
          tone: "warning",
          title: "O perfil da conta mudou.",
          description: "Revise o conflito atualizado antes de substituir qualquer dado.",
        });
        return;
      }

      if (!response.ok) throw new Error("Financial profile migration failed.");

      const migratedProfile = profileFromPayload(payload);
      if (migratedProfile === null) throw new Error("Missing migrated account profile.");

      setAccountState({ status: "ready", profile: migratedProfile });
      setFeedback({
        tone: "success",
        title: "Perfil associado à conta.",
        description: "A cópia local foi preservada e só será removida por uma ação separada.",
      });
    } catch {
      setFeedback({
        tone: "danger",
        title: "Não foi possível salvar o perfil na conta.",
        description: "Nenhuma cópia local foi removida.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function keepLocalOnly() {
    setFeedback({
      tone: "info",
      title: "Perfil mantido somente neste dispositivo.",
      description: "Nenhuma alteração foi enviada para a conta.",
    });
  }

  function discardLocalProfile() {
    const removed = removePersistedFinancialProfile();
    if (!removed) {
      setFeedback({
        tone: "danger",
        title: "Não foi possível remover a cópia local deste dispositivo.",
        description: "O perfil salvo na conta não foi alterado.",
      });
      return;
    }

    setLocalRemovalCompleted(true);
    requestAnimationFrame(() => removalHeadingRef.current?.focus());
  }

  return (
    <section className={styles.section} aria-labelledby="account-migration-title">
      <Surface padding="lg" className={styles.surface}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Perfil da conta</span>
            <h2 id="account-migration-title">Associar perfil local à conta</h2>
            <p>
              O perfil salvo neste dispositivo não é enviado automaticamente. A conta só recebe
              dados depois de uma ação explícita abaixo.
            </p>
          </div>
          <Badge tone="accent">Migração opt-in</Badge>
        </div>

        <div className={styles.body}>
          {accountState.status === "idle" || accountState.status === "loading" ? (
            <div className={styles.stateBlock}>
              <LoadingState label="Verificando o perfil da conta…" />
              <p>Esta leitura não envia o perfil salvo no dispositivo.</p>
            </div>
          ) : accountState.status === "error" ? (
            <Alert tone="danger" title="Não foi possível consultar o perfil da conta.">
              <div className={styles.alertContent}>
                <p>O perfil local continua intacto e nenhum dado financeiro foi enviado.</p>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => void loadAccountProfile()}>
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </Alert>
          ) : comparison?.relation === "local-only" ? (
            <Alert tone="info" title="A conta ainda não possui um perfil financeiro.">
              <div className={styles.alertContent}>
                <p>
                  Você pode copiar o snapshot validado deste dispositivo para a conta ou continuar
                  somente com a cópia local.
                </p>
                <div className={styles.actions}>
                  <Button loading={isSaving} onClick={() => void migrateLocalProfile(false)}>
                    Salvar perfil local na conta
                  </Button>
                  <Button variant="secondary" disabled={isSaving} onClick={keepLocalOnly}>
                    Manter somente local
                  </Button>
                </div>
              </div>
            </Alert>
          ) : comparison?.relation === "aligned" ? (
            <Alert tone="success" title="Perfis alinhados">
              <p>
                Perfil local e perfil da conta estão alinhados. Nenhuma gravação adicional é
                necessária. As duas cópias permanecem independentes.
              </p>
            </Alert>
          ) : comparison?.relation === "conflict" ? (
            <div className={styles.stateBlock}>
              <Alert tone="warning" title="Existe um conflito entre o dispositivo e a conta.">
                <p>
                  Nada será substituído automaticamente. Revise quais partes diferem e escolha
                  explicitamente qual ação deseja executar.
                </p>
              </Alert>
              <Disclosure
                summary="Revisar diferenças"
                summaryAside={`${comparison.differences.length} ${
                  comparison.differences.length === 1 ? "diferença" : "diferenças"
                }`}
              >
                <ul
                  className={styles.differences}
                  aria-label="Diferenças entre perfil local e da conta"
                >
                  {comparison.differences.map((difference) => (
                    <li key={difference}>{DIFFERENCE_LABELS[difference]}</li>
                  ))}
                </ul>
              </Disclosure>
              <div className={styles.actions}>
                <Button loading={isSaving} onClick={() => void migrateLocalProfile(true)}>
                  Substituir perfil da conta pelo local
                </Button>
                <Button variant="secondary" disabled={isSaving} onClick={keepLocalOnly}>
                  Manter somente local
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {feedback === null ? null : (
          <Alert tone={feedback.tone} title={feedback.title}>
            <p>{feedback.description}</p>
          </Alert>
        )}

        <div className={styles.localFooter}>
          <div>
            <strong>Cópia deste dispositivo</strong>
            <p>
              Remover a cópia local é uma ação separada: não altera o perfil já salvo na conta e não
              encerra sua sessão.
            </p>
          </div>
          <Button variant="danger" disabled={isSaving} onClick={discardLocalProfile}>
            Remover cópia local
          </Button>
        </div>
      </Surface>
    </section>
  );
}
