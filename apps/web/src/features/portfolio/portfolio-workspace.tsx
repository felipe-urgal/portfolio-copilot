"use client";

import { useState, type FormEvent } from "react";

import type { PortfolioSnapshot } from "@portfolio-copilot/domain";

import {
  createInitialPortfolioDraft,
  createPortfolioSnapshot,
  type PortfolioDraft,
  type PortfolioFieldErrors,
} from "./portfolio-form";
import styles from "./portfolio-workspace.module.css";

function FieldError({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}

export function PortfolioWorkspace() {
  const [draft, setDraft] = useState<PortfolioDraft>(createInitialPortfolioDraft);
  const [errors, setErrors] = useState<PortfolioFieldErrors>({});
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);

  function updateDraft(field: keyof PortfolioDraft, value: string): void {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const result = createPortfolioSnapshot(draft, () => globalThis.crypto.randomUUID());

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSnapshot(result.snapshot);
    setErrors({});
  }

  function resetPortfolio(): void {
    setDraft(createInitialPortfolioDraft());
    setErrors({});
    setSnapshot(null);
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Carteira</h1>
          <p>
            Cadastre a identidade mínima da sua carteira sem antecipar posições, patrimônio ou
            preços que o produto ainda não conhece.
          </p>
        </div>
        <span className={styles.localState}>Estado local</span>
      </header>

      <section className={styles.persistenceNotice} aria-labelledby="portfolio-persistence-title">
        <div>
          <h2 id="portfolio-persistence-title">Nada é persistido nesta versão</h2>
          <p>
            A carteira existe somente nesta página enquanto ela estiver aberta. Recarregar a página
            remove o estado criado aqui.
          </p>
        </div>
      </section>

      {snapshot === null ? (
        <div className={styles.creationLayout}>
          <section className={styles.formSurface} aria-labelledby="portfolio-form-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="portfolio-form-title">Criar carteira</h2>
                <p>O domínio valida nome, identidade e moeda de referência antes da criação.</p>
              </div>
            </div>

            <form className={styles.form} noValidate onSubmit={handleSubmit}>
              <div className={styles.fieldGroup}>
                <label htmlFor="portfolio-name">Nome da carteira</label>
                <input
                  id="portfolio-name"
                  name="portfolioName"
                  type="text"
                  autoComplete="off"
                  maxLength={120}
                  value={draft.name}
                  aria-invalid={errors.name !== undefined}
                  aria-describedby={
                    errors.name === undefined
                      ? "portfolio-name-help"
                      : "portfolio-name-help portfolio-name-error"
                  }
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
                <p className={styles.helpText} id="portfolio-name-help">
                  Use um nome que identifique esta carteira para você.
                </p>
                <FieldError id="portfolio-name-error" message={errors.name} />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="portfolio-currency">Moeda de referência</label>
                <input
                  id="portfolio-currency"
                  name="referenceCurrency"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={3}
                  value={draft.referenceCurrency}
                  aria-invalid={errors.referenceCurrency !== undefined}
                  aria-describedby={
                    errors.referenceCurrency === undefined
                      ? "portfolio-currency-help"
                      : "portfolio-currency-help portfolio-currency-error"
                  }
                  onChange={(event) =>
                    updateDraft("referenceCurrency", event.target.value.toUpperCase())
                  }
                />
                <p className={styles.helpText} id="portfolio-currency-help">
                  Informe o código ISO de três letras, como BRL, USD ou EUR.
                </p>
                <FieldError id="portfolio-currency-error" message={errors.referenceCurrency} />
              </div>

              {errors.form === undefined ? null : (
                <p className={styles.formError} role="alert">
                  {errors.form}
                </p>
              )}

              <button className={styles.primaryAction} type="submit">
                Criar carteira local
              </button>
            </form>
          </section>

          <aside className={styles.truthRail} aria-labelledby="portfolio-truth-title">
            <h2 id="portfolio-truth-title">Fonte de verdade</h2>
            <p>
              O cadastro cria apenas o agregado <strong>Portfolio</strong>. Ele define identidade,
              nome e moeda de referência.
            </p>
            <div className={styles.ruleList}>
              <div>
                <strong>Posições</strong>
                <span>Serão projetadas a partir do Transaction Ledger.</span>
              </div>
              <div>
                <strong>Patrimônio e preços</strong>
                <span>Continuam indisponíveis sem transações e Market Data.</span>
              </div>
              <div>
                <strong>Holdings editáveis</strong>
                <span>Não são uma segunda fonte de verdade neste produto.</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={styles.snapshotLayout}>
          <section className={styles.snapshotSurface} aria-labelledby="portfolio-snapshot-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="portfolio-snapshot-title">Carteira criada nesta sessão</h2>
                <p>Este snapshot veio diretamente do agregado Portfolio validado pelo domínio.</p>
              </div>
              <span className={styles.validState}>Validada</span>
            </div>

            <dl className={styles.snapshotList}>
              <div>
                <dt>Nome</dt>
                <dd>{snapshot.name}</dd>
              </div>
              <div>
                <dt>Moeda de referência</dt>
                <dd>{snapshot.referenceCurrency}</dd>
              </div>
              <div>
                <dt>Identidade</dt>
                <dd className={styles.identifier}>{snapshot.id}</dd>
              </div>
            </dl>

            <button className={styles.secondaryAction} type="button" onClick={resetPortfolio}>
              Criar outra carteira
            </button>
          </section>

          <section className={styles.positionsSurface} aria-labelledby="positions-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="positions-title">Posições</h2>
                <p>Projeção derivada de transações registradas no ledger.</p>
              </div>
              <span className={styles.emptyStatus}>Sem transações</span>
            </div>

            <div className={styles.emptyState}>
              <span className={styles.emptyMark} aria-hidden="true" />
              <div>
                <strong>Nenhuma posição disponível</strong>
                <p>
                  O portfolio existe, mas ainda não há transações para projetar quantidades ou
                  posições. Nenhum holding ou patrimônio é inventado neste estado.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
