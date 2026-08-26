"use client";

import { useState, type FormEvent } from "react";

import {
  Money,
  type PortfolioSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";

import {
  createCashTransactionSnapshot,
  createInitialCashTransactionDraft,
  type CashTransactionDraft,
  type CashTransactionFieldErrors,
} from "./cash-transaction-form";
import {
  createInitialPortfolioDraft,
  createPortfolioSnapshot,
  type PortfolioDraft,
  type PortfolioFieldErrors,
} from "./portfolio-form";
import styles from "./portfolio-workspace.module.css";

type PortfolioWorkspaceProps = Readonly<{
  initialSnapshot?: PortfolioSnapshot | null;
  initialTransactions?: readonly TransactionSnapshot[];
}>;

function FieldError({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;

  return (
    <p className={styles.fieldError} id={id} role="alert">
      {message}
    </p>
  );
}

function transactionLabel(type: string): string {
  if (type === "CASH_IN") return "Entrada de caixa";
  if (type === "CASH_OUT") return "Saída de caixa";
  return type;
}

function transactionAmount(transaction: TransactionSnapshot): string {
  const amount = Money.fromSnapshot(transaction.settlementAmount);
  return `${amount.currency.toString()} ${amount.toDecimalString()}`;
}

function ledgerStatus(count: number): string {
  if (count === 0) return "Ledger vazio";
  if (count === 1) return "1 movimentação";
  return `${count} movimentações`;
}

export function PortfolioWorkspace({
  initialSnapshot = null,
  initialTransactions = [],
}: PortfolioWorkspaceProps) {
  const [draft, setDraft] = useState<PortfolioDraft>(createInitialPortfolioDraft);
  const [errors, setErrors] = useState<PortfolioFieldErrors>({});
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(initialSnapshot);
  const [cashDraft, setCashDraft] = useState<CashTransactionDraft>(
    createInitialCashTransactionDraft,
  );
  const [cashErrors, setCashErrors] = useState<CashTransactionFieldErrors>({});
  const [transactions, setTransactions] = useState<readonly TransactionSnapshot[]>(() => [
    ...initialTransactions,
  ]);

  function updateDraft(field: keyof PortfolioDraft, value: string): void {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors({});
  }

  function updateCashType(type: CashTransactionDraft["type"]): void {
    setCashDraft((current) => ({ ...current, type }));
    setCashErrors({});
  }

  function updateCashAmount(amount: string): void {
    setCashDraft((current) => ({ ...current, amount }));
    setCashErrors({});
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

  function handleCashSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (snapshot === null) return;

    const result = createCashTransactionSnapshot(
      cashDraft,
      snapshot,
      () => globalThis.crypto.randomUUID(),
      () => new Date().toISOString(),
    );

    if (!result.ok) {
      setCashErrors(result.errors);
      return;
    }

    setTransactions((current) => [result.snapshot, ...current]);
    setCashDraft((current) => ({ ...current, amount: "" }));
    setCashErrors({});
  }

  function resetPortfolio(): void {
    setDraft(createInitialPortfolioDraft());
    setErrors({});
    setSnapshot(null);
    setCashDraft(createInitialCashTransactionDraft());
    setCashErrors({});
    setTransactions([]);
  }

  const hasCashTransactions = transactions.length > 0;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Carteira</h1>
          <p>
            Cadastre sua carteira e registre os primeiros fatos do ledger sem transformar posições,
            saldos ou holdings em estado editável paralelo.
          </p>
        </div>
        <span className={styles.localState}>Estado local</span>
      </header>

      <section className={styles.persistenceNotice} aria-labelledby="portfolio-persistence-title">
        <div>
          <h2 id="portfolio-persistence-title">Nada é persistido nesta versão</h2>
          <p>
            Carteira e movimentações existem somente enquanto esta tela permanecer aberta. Recarregar
            ou sair desta tela remove todo o estado criado aqui.
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
                  Informe um código de três letras, como BRL, USD ou EUR.
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
              O cadastro cria apenas o agregado <strong>Portfolio</strong>. Depois, cada movimentação
              é registrada como um fato separado do Transaction Ledger.
            </p>
            <div className={styles.ruleList}>
              <div>
                <strong>Posições</strong>
                <span>Continuam derivadas do ledger, nunca cadastradas diretamente.</span>
              </div>
              <div>
                <strong>Fluxos de caixa</strong>
                <span>Entradas e saídas podem ser registradas sem depender de um ativo.</span>
              </div>
              <div>
                <strong>Compra e venda</strong>
                <span>Ficam bloqueadas até existir seleção real de Asset.</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={styles.sessionStack}>
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
                  <p>Projeção derivada de transações com ativo registradas no ledger.</p>
                </div>
                <span className={styles.emptyStatus}>
                  {hasCashTransactions ? "Somente fluxos de caixa" : "Sem transações"}
                </span>
              </div>

              <div className={styles.emptyState}>
                <span className={styles.emptyMark} aria-hidden="true" />
                <div>
                  <strong>Nenhuma posição de ativo disponível</strong>
                  <p>
                    {hasCashTransactions
                      ? "CASH_IN e CASH_OUT não carregam AssetId nem quantidade, então não projetam posições de ativos."
                      : "O portfolio existe, mas ainda não há fatos com ativo para projetar quantidades ou posições."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className={styles.ledgerSurface} aria-labelledby="ledger-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="ledger-title">Transaction Ledger</h2>
                <p>
                  Registre fatos de caixa vinculados à carteira desta sessão. O ledger não calcula
                  saldo, patrimônio ou posição por conta própria.
                </p>
              </div>
              <span className={styles.emptyStatus}>{ledgerStatus(transactions.length)}</span>
            </div>

            <div className={styles.ledgerLayout}>
              <form className={styles.cashForm} noValidate onSubmit={handleCashSubmit}>
                <fieldset className={styles.transactionTypeFieldset}>
                  <legend>Tipo de movimentação</legend>
                  <div className={styles.transactionTypeOptions}>
                    <label>
                      <input
                        type="radio"
                        name="cashTransactionType"
                        value="CASH_IN"
                        checked={cashDraft.type === "CASH_IN"}
                        onChange={() => updateCashType("CASH_IN")}
                      />
                      <span>Entrada</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="cashTransactionType"
                        value="CASH_OUT"
                        checked={cashDraft.type === "CASH_OUT"}
                        onChange={() => updateCashType("CASH_OUT")}
                      />
                      <span>Saída</span>
                    </label>
                  </div>
                </fieldset>

                <div className={styles.fieldGroup}>
                  <label htmlFor="cash-transaction-amount">Valor</label>
                  <input
                    id="cash-transaction-amount"
                    name="cashTransactionAmount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={cashDraft.amount}
                    aria-invalid={cashErrors.amount !== undefined}
                    aria-describedby={
                      cashErrors.amount === undefined
                        ? "cash-transaction-amount-help"
                        : "cash-transaction-amount-help cash-transaction-amount-error"
                    }
                    onChange={(event) => updateCashAmount(event.target.value)}
                  />
                  <p className={styles.helpText} id="cash-transaction-amount-help">
                    Valor positivo em {snapshot.referenceCurrency}; vírgula ou ponto decimal são
                    aceitos na entrada.
                  </p>
                  <FieldError id="cash-transaction-amount-error" message={cashErrors.amount} />
                </div>

                {cashErrors.form === undefined ? null : (
                  <p className={styles.formError} role="alert">
                    {cashErrors.form}
                  </p>
                )}

                <button className={styles.primaryAction} type="submit">
                  Registrar movimentação
                </button>

                <div className={styles.unavailableTrades} aria-label="Operações ainda indisponíveis">
                  <button type="button" disabled>
                    Compra
                  </button>
                  <button type="button" disabled>
                    Venda
                  </button>
                  <p>
                    Compra e venda exigem um Asset real selecionável. A interface não pede UUID
                    interno como atalho.
                  </p>
                </div>
              </form>

              <div className={styles.ledgerHistory}>
                <div className={styles.ledgerHistoryHeading}>
                  <h3>Movimentações desta sessão</h3>
                  <p>Snapshots validados pelo domínio, do registro mais recente para o mais antigo.</p>
                </div>

                {transactions.length === 0 ? (
                  <div className={styles.ledgerEmptyState}>
                    <strong>Ledger sem movimentações</strong>
                    <p>
                      Registre uma entrada ou saída de caixa. Nenhum saldo inicial é presumido pelo
                      produto.
                    </p>
                  </div>
                ) : (
                  <ol className={styles.ledgerList}>
                    {transactions.map((transaction) => (
                      <li key={transaction.id}>
                        <div className={styles.transactionMain}>
                          <div>
                            <strong>{transactionLabel(transaction.type)}</strong>
                            <time dateTime={transaction.occurredAt}>{transaction.occurredAt}</time>
                          </div>
                          <span className={styles.transactionAmount}>
                            {transactionAmount(transaction)}
                          </span>
                        </div>
                        <code>{transaction.id}</code>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
