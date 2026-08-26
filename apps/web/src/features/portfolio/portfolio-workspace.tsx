"use client";

import { useState, type FormEvent } from "react";

import {
  AssetQuantity,
  Money,
  type PortfolioSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";

import {
  createAssetTradeSnapshot,
  createInitialAssetTradeDraft,
  projectLocalAssetPositions,
  type AssetTradeDraft,
  type AssetTradeFieldErrors,
} from "./asset-trade-form";
import {
  createCashTransactionSnapshot,
  createInitialCashTransactionDraft,
  type CashTransactionDraft,
  type CashTransactionFieldErrors,
} from "./cash-transaction-form";
import {
  assetClassLabel,
  createInitialLocalAssetDraft,
  createLocalAssetSnapshot,
  instrumentTypeLabel,
  LOCAL_ASSET_CLASS_OPTIONS,
  LOCAL_INSTRUMENT_TYPE_OPTIONS,
  type LocalAssetDraft,
  type LocalAssetFieldErrors,
  type LocalAssetSnapshot,
} from "./local-asset-form";
import {
  createInitialPortfolioDraft,
  createPortfolioSnapshot,
  type PortfolioDraft,
  type PortfolioFieldErrors,
} from "./portfolio-form";
import styles from "./portfolio-workspace.module.css";

type PortfolioWorkspaceProps = Readonly<{
  initialSnapshot?: PortfolioSnapshot | null;
  initialAssets?: readonly LocalAssetSnapshot[];
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
  if (type === "BUY") return "Compra";
  if (type === "SELL") return "Venda";
  return type;
}

function transactionAmount(transaction: TransactionSnapshot): string {
  const amount = Money.fromSnapshot(transaction.settlementAmount);
  return `${amount.currency.toString()} ${amount.toDecimalString()}`;
}

function compactQuantity(value: string): string {
  const [whole = "0", fraction] = value.split(".");
  if (fraction === undefined) return value;
  const trimmedFraction = fraction.replace(/0+$/u, "");
  return trimmedFraction.length === 0 ? whole : `${whole}.${trimmedFraction}`;
}

function transactionQuantity(transaction: TransactionSnapshot): string | null {
  if (transaction.quantity === null) return null;
  return compactQuantity(AssetQuantity.fromSnapshot(transaction.quantity).toDecimalString());
}

function countLabel(count: number, singular: string, plural: string, empty: string): string {
  if (count === 0) return empty;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural}`;
}

export function PortfolioWorkspace({
  initialSnapshot = null,
  initialAssets = [],
  initialTransactions = [],
}: PortfolioWorkspaceProps) {
  const [draft, setDraft] = useState<PortfolioDraft>(createInitialPortfolioDraft);
  const [errors, setErrors] = useState<PortfolioFieldErrors>({});
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(initialSnapshot);
  const [assets, setAssets] = useState<readonly LocalAssetSnapshot[]>(() => [...initialAssets]);
  const [assetDraft, setAssetDraft] = useState<LocalAssetDraft>(() =>
    createInitialLocalAssetDraft(initialSnapshot?.referenceCurrency ?? "BRL"),
  );
  const [assetErrors, setAssetErrors] = useState<LocalAssetFieldErrors>({});
  const [cashDraft, setCashDraft] = useState<CashTransactionDraft>(
    createInitialCashTransactionDraft,
  );
  const [cashErrors, setCashErrors] = useState<CashTransactionFieldErrors>({});
  const [tradeDraft, setTradeDraft] = useState<AssetTradeDraft>(() =>
    createInitialAssetTradeDraft(initialAssets[0]?.id),
  );
  const [tradeErrors, setTradeErrors] = useState<AssetTradeFieldErrors>({});
  const [transactions, setTransactions] = useState<readonly TransactionSnapshot[]>(() => [
    ...initialTransactions,
  ]);

  function updateDraft(field: keyof PortfolioDraft, value: string): void {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function updateAssetDraft(field: keyof LocalAssetDraft, value: string): void {
    setAssetDraft((current) => ({ ...current, [field]: value }));
    setAssetErrors({});
  }

  function updateTradeDraft(field: keyof AssetTradeDraft, value: string): void {
    setTradeDraft((current) => ({ ...current, [field]: value }));
    setTradeErrors({});
  }

  function handlePortfolioSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createPortfolioSnapshot(draft, () => globalThis.crypto.randomUUID());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSnapshot(result.snapshot);
    setAssetDraft(createInitialLocalAssetDraft(result.snapshot.referenceCurrency));
    setErrors({});
  }

  function handleAssetSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (snapshot === null) return;
    const result = createLocalAssetSnapshot(assetDraft, () => globalThis.crypto.randomUUID());
    if (!result.ok) {
      setAssetErrors(result.errors);
      return;
    }
    setAssets((current) => [...current, result.snapshot]);
    setAssetDraft(createInitialLocalAssetDraft(snapshot.referenceCurrency));
    setTradeDraft((current) =>
      current.assetId === "" ? { ...current, assetId: result.snapshot.id } : current,
    );
    setAssetErrors({});
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
    setTransactions((current) => [...current, result.snapshot]);
    setCashDraft((current) => ({ ...current, amount: "" }));
    setCashErrors({});
  }

  function handleTradeSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (snapshot === null) return;
    const result = createAssetTradeSnapshot(
      tradeDraft,
      snapshot,
      transactions,
      () => globalThis.crypto.randomUUID(),
      () => new Date().toISOString(),
    );
    if (!result.ok) {
      setTradeErrors(result.errors);
      return;
    }
    setTransactions((current) => [...current, result.snapshot]);
    setTradeDraft((current) => ({ ...current, quantity: "", settlementAmount: "" }));
    setTradeErrors({});
  }

  function resetPortfolio(): void {
    setDraft(createInitialPortfolioDraft());
    setErrors({});
    setSnapshot(null);
    setAssets([]);
    setAssetDraft(createInitialLocalAssetDraft("BRL"));
    setAssetErrors({});
    setCashDraft(createInitialCashTransactionDraft());
    setCashErrors({});
    setTradeDraft(createInitialAssetTradeDraft());
    setTradeErrors({});
    setTransactions([]);
  }

  const positions = snapshot === null ? [] : projectLocalAssetPositions(snapshot.id, transactions);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const displayTransactions = [...transactions].reverse();
  const hasTrades = transactions.some(
    (transaction) => transaction.type === "BUY" || transaction.type === "SELL",
  );
  const hasCashFlows = transactions.some(
    (transaction) => transaction.type === "CASH_IN" || transaction.type === "CASH_OUT",
  );
  const positionStatus =
    positions.length > 0
      ? countLabel(positions.length, "posição", "posições", "Sem posições")
      : hasTrades
        ? "Sem posições abertas"
        : hasCashFlows
          ? "Somente fluxos de caixa"
          : "Sem transações";

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Carteira</h1>
          <p>
            Cadastre carteira e ativos, registre fatos no ledger e acompanhe somente posições
            projetadas pelo domínio — sem holdings, preços ou patrimônio inventados.
          </p>
        </div>
        <span className={styles.localState}>Estado local</span>
      </header>

      <section className={styles.persistenceNotice} aria-labelledby="portfolio-persistence-title">
        <h2 id="portfolio-persistence-title">Nada é persistido nesta versão</h2>
        <p>
          Carteira, ativos e movimentações existem somente enquanto esta tela permanecer aberta.
          Recarregar ou sair remove todo o estado criado aqui.
        </p>
      </section>

      {snapshot === null ? (
        <div className={styles.creationLayout}>
          <section className={styles.formSurface} aria-labelledby="portfolio-form-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="portfolio-form-title">Criar carteira</h2>
                <p>O domínio valida identidade, nome e moeda antes de liberar o ledger.</p>
              </div>
            </div>
            <form className={styles.form} noValidate onSubmit={handlePortfolioSubmit}>
              <div className={styles.fieldGroup}>
                <label htmlFor="portfolio-name">Nome da carteira</label>
                <input
                  id="portfolio-name"
                  type="text"
                  maxLength={120}
                  autoComplete="off"
                  value={draft.name}
                  aria-invalid={errors.name !== undefined}
                  aria-describedby={errors.name ? "portfolio-name-error" : undefined}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
                <FieldError id="portfolio-name-error" message={errors.name} />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="portfolio-currency">Moeda de referência</label>
                <input
                  id="portfolio-currency"
                  type="text"
                  maxLength={3}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={draft.referenceCurrency}
                  aria-invalid={errors.referenceCurrency !== undefined}
                  aria-describedby={errors.referenceCurrency ? "portfolio-currency-error" : undefined}
                  onChange={(event) =>
                    updateDraft("referenceCurrency", event.target.value.toUpperCase())
                  }
                />
                <p className={styles.helpText}>Código de três letras, como BRL, USD ou EUR.</p>
                <FieldError id="portfolio-currency-error" message={errors.referenceCurrency} />
              </div>
              {errors.form ? (
                <p className={styles.formError} role="alert">
                  {errors.form}
                </p>
              ) : null}
              <button className={styles.primaryAction} type="submit">
                Criar carteira local
              </button>
            </form>
          </section>

          <aside className={styles.truthRail} aria-labelledby="portfolio-truth-title">
            <h2 id="portfolio-truth-title">Fonte de verdade</h2>
            <p>
              O <strong>Portfolio</strong> guarda só identidade, nome e moeda. Ativos têm identidade
              própria; posições nascem exclusivamente do Transaction Ledger.
            </p>
            <div className={styles.ruleList}>
              <div>
                <strong>Seleção humana</strong>
                <span>Ativos aparecem por nome e contexto, nunca como campo de UUID.</span>
              </div>
              <div>
                <strong>Posições derivadas</strong>
                <span>BUY/SELL alimentam `projectAssetPositions`; cash flows não alteram quantidade.</span>
              </div>
              <div>
                <strong>Sem Market Data</strong>
                <span>Quantidade não é preço, patrimônio, custo médio ou P&amp;L.</span>
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
                  <h2 id="portfolio-snapshot-title">Carteira desta sessão</h2>
                  <p>Snapshot validado pelo agregado Portfolio.</p>
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
                  <p>Quantidade aberta derivada pelo projetor do domínio.</p>
                </div>
                <span className={styles.emptyStatus}>{positionStatus}</span>
              </div>
              {positions.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyMark} aria-hidden="true" />
                  <div>
                    <strong>Nenhuma posição de ativo aberta</strong>
                    <p>
                      {hasTrades
                        ? "Os fatos de compra e venda resultam em quantidade aberta zero. Nenhum holding paralelo é mantido."
                        : "Registre uma compra para projetar quantidade. CASH_IN e CASH_OUT não alteram posições."}
                    </p>
                  </div>
                </div>
              ) : (
                <ul className={styles.positionList}>
                  {positions.map((position) => {
                    const asset = assetsById.get(position.assetId);
                    return (
                      <li key={position.assetId}>
                        <div>
                          <strong>{asset?.name ?? "Ativo não disponível nesta sessão"}</strong>
                          <span>
                            {asset
                              ? `${assetClassLabel(asset.assetClass)} · ${instrumentTypeLabel(asset.instrumentType)}`
                              : "Identidade presente no ledger"}
                          </span>
                        </div>
                        <span className={styles.positionQuantity}>
                          {compactQuantity(position.quantity)} un.
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section className={styles.assetSurface} aria-labelledby="assets-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="assets-title">Ativos da sessão</h2>
                <p>Cadastro mínimo local, sem ticker, busca remota ou Asset Master improvisado.</p>
              </div>
              <span className={styles.emptyStatus}>
                {countLabel(assets.length, "ativo", "ativos", "Nenhum ativo")}
              </span>
            </div>
            <div className={styles.assetLayout}>
              <form className={styles.assetForm} noValidate onSubmit={handleAssetSubmit}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="asset-name">Nome do ativo</label>
                  <input
                    id="asset-name"
                    type="text"
                    maxLength={160}
                    autoComplete="off"
                    value={assetDraft.name}
                    aria-invalid={assetErrors.name !== undefined}
                    aria-describedby={assetErrors.name ? "asset-name-error" : "asset-name-help"}
                    onChange={(event) => updateAssetDraft("name", event.target.value)}
                  />
                  <p className={styles.helpText} id="asset-name-help">
                    Nome usado na seleção de compra e venda; UUID permanece interno.
                  </p>
                  <FieldError id="asset-name-error" message={assetErrors.name} />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="asset-class">Classe econômica</label>
                    <select
                      id="asset-class"
                      value={assetDraft.assetClass}
                      onChange={(event) => updateAssetDraft("assetClass", event.target.value)}
                    >
                      {LOCAL_ASSET_CLASS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="asset-instrument">Instrumento</label>
                    <select
                      id="asset-instrument"
                      value={assetDraft.instrumentType}
                      onChange={(event) => updateAssetDraft("instrumentType", event.target.value)}
                    >
                      {LOCAL_INSTRUMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="asset-currency">Moeda de referência do ativo</label>
                  <input
                    id="asset-currency"
                    type="text"
                    maxLength={3}
                    autoCapitalize="characters"
                    autoComplete="off"
                    value={assetDraft.referenceCurrency}
                    aria-invalid={assetErrors.referenceCurrency !== undefined}
                    aria-describedby={
                      assetErrors.referenceCurrency ? "asset-currency-error" : "asset-currency-help"
                    }
                    onChange={(event) =>
                      updateAssetDraft("referenceCurrency", event.target.value.toUpperCase())
                    }
                  />
                  <p className={styles.helpText} id="asset-currency-help">
                    Não implica cotação nem conversão FX.
                  </p>
                  <FieldError id="asset-currency-error" message={assetErrors.referenceCurrency} />
                </div>
                {assetErrors.form ? (
                  <p className={styles.formError} role="alert">
                    {assetErrors.form}
                  </p>
                ) : null}
                <button className={styles.primaryAction} type="submit">
                  Cadastrar ativo local
                </button>
              </form>

              <div className={styles.assetCatalog}>
                <div className={styles.ledgerHistoryHeading}>
                  <h3>Disponíveis para transações</h3>
                  <p>Seleção visível por nome, classe e instrumento.</p>
                </div>
                {assets.length === 0 ? (
                  <div className={styles.ledgerEmptyState}>
                    <strong>Nenhum ativo cadastrado</strong>
                    <p>Cadastre um ativo para liberar compra e venda.</p>
                  </div>
                ) : (
                  <ul className={styles.assetList}>
                    {assets.map((asset) => (
                      <li key={asset.id}>
                        <strong>{asset.name}</strong>
                        <span>
                          {assetClassLabel(asset.assetClass)} · {instrumentTypeLabel(asset.instrumentType)}
                          {" · "}
                          {asset.referenceCurrency}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section className={styles.ledgerSurface} aria-labelledby="ledger-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="ledger-title">Transaction Ledger</h2>
                <p>Transações são fatos históricos; posições são projeções, não campos editáveis.</p>
              </div>
              <span className={styles.emptyStatus}>
                {countLabel(transactions.length, "movimentação", "movimentações", "Ledger vazio")}
              </span>
            </div>
            <div className={styles.ledgerLayout}>
              <div className={styles.transactionForms}>
                <form className={styles.transactionForm} noValidate onSubmit={handleCashSubmit}>
                  <div className={styles.formHeading}>
                    <h3>Fluxo de caixa</h3>
                    <p>Entrada ou saída sem ativo ou quantidade.</p>
                  </div>
                  <fieldset className={styles.transactionTypeFieldset}>
                    <legend>Tipo</legend>
                    <div className={styles.transactionTypeOptions}>
                      {(["CASH_IN", "CASH_OUT"] as const).map((type) => (
                        <label key={type}>
                          <input
                            type="radio"
                            name="cashTransactionType"
                            value={type}
                            checked={cashDraft.type === type}
                            onChange={() => {
                              setCashDraft((current) => ({ ...current, type }));
                              setCashErrors({});
                            }}
                          />
                          <span>{type === "CASH_IN" ? "Entrada" : "Saída"}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="cash-transaction-amount">Valor</label>
                    <input
                      id="cash-transaction-amount"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={cashDraft.amount}
                      aria-invalid={cashErrors.amount !== undefined}
                      aria-describedby={cashErrors.amount ? "cash-amount-error" : "cash-amount-help"}
                      onChange={(event) => {
                        setCashDraft((current) => ({ ...current, amount: event.target.value }));
                        setCashErrors({});
                      }}
                    />
                    <p className={styles.helpText} id="cash-amount-help">
                      Valor positivo em {snapshot.referenceCurrency}; vírgula ou ponto decimal.
                    </p>
                    <FieldError id="cash-amount-error" message={cashErrors.amount} />
                  </div>
                  {cashErrors.form ? (
                    <p className={styles.formError} role="alert">
                      {cashErrors.form}
                    </p>
                  ) : null}
                  <button className={styles.primaryAction} type="submit">
                    Registrar fluxo de caixa
                  </button>
                </form>

                <form className={styles.transactionForm} noValidate onSubmit={handleTradeSubmit}>
                  <div className={styles.formHeading}>
                    <h3>Compra e venda</h3>
                    <p>Asset selecionado por nome; identidade interna resolvida pela interface.</p>
                  </div>
                  <fieldset className={styles.transactionTypeFieldset}>
                    <legend>Operação</legend>
                    <div className={styles.transactionTypeOptions}>
                      {(["BUY", "SELL"] as const).map((type) => (
                        <label key={type}>
                          <input
                            type="radio"
                            name="assetTradeType"
                            value={type}
                            checked={tradeDraft.type === type}
                            onChange={() => updateTradeDraft("type", type)}
                          />
                          <span>{type === "BUY" ? "Compra" : "Venda"}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="trade-asset">Ativo</label>
                    <select
                      id="trade-asset"
                      value={tradeDraft.assetId}
                      disabled={assets.length === 0}
                      aria-invalid={tradeErrors.assetId !== undefined}
                      aria-describedby={tradeErrors.assetId ? "trade-asset-error" : "trade-asset-help"}
                      onChange={(event) => updateTradeDraft("assetId", event.target.value)}
                    >
                      <option value="">Selecione um ativo</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} — {assetClassLabel(asset.assetClass)}
                        </option>
                      ))}
                    </select>
                    <p className={styles.helpText} id="trade-asset-help">
                      {assets.length === 0
                        ? "Cadastre um ativo local antes de negociar."
                        : "O AssetId não é solicitado ao usuário."}
                    </p>
                    <FieldError id="trade-asset-error" message={tradeErrors.assetId} />
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="trade-quantity">Quantidade</label>
                      <input
                        id="trade-quantity"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={tradeDraft.quantity}
                        aria-invalid={tradeErrors.quantity !== undefined}
                        aria-describedby={
                          tradeErrors.quantity ? "trade-quantity-error" : "trade-quantity-help"
                        }
                        onChange={(event) => updateTradeDraft("quantity", event.target.value)}
                      />
                      <p className={styles.helpText} id="trade-quantity-help">
                        Até 12 casas decimais.
                      </p>
                      <FieldError id="trade-quantity-error" message={tradeErrors.quantity} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="trade-settlement">Valor de liquidação</label>
                      <input
                        id="trade-settlement"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={tradeDraft.settlementAmount}
                        aria-invalid={tradeErrors.settlementAmount !== undefined}
                        aria-describedby={
                          tradeErrors.settlementAmount
                            ? "trade-settlement-error"
                            : "trade-settlement-help"
                        }
                        onChange={(event) => updateTradeDraft("settlementAmount", event.target.value)}
                      />
                      <p className={styles.helpText} id="trade-settlement-help">
                        Valor positivo em {snapshot.referenceCurrency}; não é preço de mercado.
                      </p>
                      <FieldError id="trade-settlement-error" message={tradeErrors.settlementAmount} />
                    </div>
                  </div>
                  {tradeErrors.form ? (
                    <p className={styles.formError} role="alert">
                      {tradeErrors.form}
                    </p>
                  ) : null}
                  <button className={styles.primaryAction} type="submit" disabled={assets.length === 0}>
                    Registrar {tradeDraft.type === "BUY" ? "compra" : "venda"}
                  </button>
                </form>
              </div>

              <div className={styles.ledgerHistory}>
                <div className={styles.ledgerHistoryHeading}>
                  <h3>Movimentações desta sessão</h3>
                  <p>Mais recentes primeiro; cada item é um snapshot validado.</p>
                </div>
                {displayTransactions.length === 0 ? (
                  <div className={styles.ledgerEmptyState}>
                    <strong>Ledger sem movimentações</strong>
                    <p>Nenhum saldo, posição ou transação inicial é presumido.</p>
                  </div>
                ) : (
                  <ol className={styles.ledgerList}>
                    {displayTransactions.map((transaction) => {
                      const asset = transaction.assetId ? assetsById.get(transaction.assetId) : undefined;
                      const quantity = transactionQuantity(transaction);
                      return (
                        <li key={transaction.id}>
                          <div className={styles.transactionMain}>
                            <div>
                              <strong>{transactionLabel(transaction.type)}</strong>
                              {quantity ? (
                                <span className={styles.transactionContext}>
                                  {asset?.name ?? "Ativo não disponível nesta sessão"} · {quantity} un.
                                </span>
                              ) : null}
                              <time dateTime={transaction.occurredAt}>{transaction.occurredAt}</time>
                            </div>
                            <span className={styles.transactionAmount}>
                              {transactionAmount(transaction)}
                            </span>
                          </div>
                          <code>{transaction.id}</code>
                        </li>
                      );
                    })}
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
