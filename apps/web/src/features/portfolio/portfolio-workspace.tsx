"use client";

import { useState, type FormEvent } from "react";

import { Money, type PortfolioSnapshot, type TransactionSnapshot } from "@portfolio-copilot/domain";

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
  return value.replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/u, "");
}

function ledgerStatus(count: number): string {
  if (count === 0) return "Ledger vazio";
  if (count === 1) return "1 movimentação";
  return `${count} movimentações`;
}

function assetCountLabel(count: number): string {
  if (count === 0) return "Nenhum ativo";
  if (count === 1) return "1 ativo";
  return `${count} ativos`;
}

export function PortfolioWorkspace({
  initialSnapshot = null,
  initialAssets = [],
  initialTransactions = [],
}: PortfolioWorkspaceProps) {
  const [draft, setDraft] = useState<PortfolioDraft>(createInitialPortfolioDraft);
  const [errors, setErrors] = useState<PortfolioFieldErrors>({});
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(initialSnapshot);
  const [cashDraft, setCashDraft] = useState<CashTransactionDraft>(
    createInitialCashTransactionDraft,
  );
  const [cashErrors, setCashErrors] = useState<CashTransactionFieldErrors>({});
  const [assets, setAssets] = useState<readonly LocalAssetSnapshot[]>(() => [...initialAssets]);
  const [assetDraft, setAssetDraft] = useState<LocalAssetDraft>(() =>
    createInitialLocalAssetDraft(initialSnapshot?.referenceCurrency ?? "BRL"),
  );
  const [assetErrors, setAssetErrors] = useState<LocalAssetFieldErrors>({});
  const [tradeDraft, setTradeDraft] = useState<AssetTradeDraft>(() =>
    createInitialAssetTradeDraft(initialAssets[0]?.id),
  );
  const [tradeErrors, setTradeErrors] = useState<AssetTradeFieldErrors>({});
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

  function updateAssetDraft(field: keyof LocalAssetDraft, value: string): void {
    setAssetDraft((current) => ({ ...current, [field]: value }));
    setAssetErrors({});
  }

  function updateTradeDraft(field: keyof AssetTradeDraft, value: string): void {
    setTradeDraft((current) => ({ ...current, [field]: value }));
    setTradeErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
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
    setCashDraft(createInitialCashTransactionDraft());
    setCashErrors({});
    setAssets([]);
    setAssetDraft(createInitialLocalAssetDraft("BRL"));
    setAssetErrors({});
    setTradeDraft(createInitialAssetTradeDraft());
    setTradeErrors({});
    setTransactions([]);
  }

  const positions =
    snapshot === null ? [] : projectLocalAssetPositions(snapshot.id, transactions);
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const displayTransactions = [...transactions].reverse();
  const hasAssetTrades = transactions.some(
    (transaction) => transaction.type === "BUY" || transaction.type === "SELL",
  );
  const hasCashTransactions = transactions.some(
    (transaction) => transaction.type === "CASH_IN" || transaction.type === "CASH_OUT",
  );

  let positionStatus = "Sem transações";
  if (positions.length === 1) positionStatus = "1 posição";
  if (positions.length > 1) positionStatus = `${positions.length} posições`;
  if (positions.length === 0 && hasAssetTrades) positionStatus = "Sem posições abertas";
  if (positions.length === 0 && !hasAssetTrades && hasCashTransactions) {
    positionStatus = "Somente fluxos de caixa";
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Carteira</h1>
          <p>
            Cadastre carteira e ativos, registre fatos no ledger e acompanhe apenas posições
            projetadas pelo domínio — sem holdings, preços ou patrimônio inventados.
          </p>
        </div>
        <span className={styles.localState}>Estado local</span>
      </header>

      <section className={styles.persistenceNotice} aria-labelledby="portfolio-persistence-title">
        <div>
          <h2 id="portfolio-persistence-title">Nada é persistido nesta versão</h2>
          <p>
            Carteira, ativos e movimentações existem somente enquanto esta tela permanecer aberta.
            Recarregar ou sair desta tela remove todo o estado criado aqui.
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
              O agregado <strong>Portfolio</strong> mantém apenas identidade, nome e moeda de
              referência. Ativos e transações são fatos separados da mesma sessão.
            </p>
            <div className={styles.ruleList}>
              <div>
                <strong>Ativos</strong>
                <span>Ganham identidade própria e são selecionados pelo nome na interface.</span>
              </div>
              <div>
                <strong>Posições</strong>
                <span>São projetadas exclusivamente a partir do Transaction Ledger.</span>
              </div>
              <div>
                <strong>Patrimônio</strong>
                <span>Continua indisponível sem Market Data; quantidade não é valor de mercado.</span>
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
                  <p>Snapshot validado diretamente pelo agregado Portfolio.</p>
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
                  <p>Quantidades abertas derivadas pelo `projectAssetPositions` do domínio.</p>
                </div>
                <span className={styles.emptyStatus}>{positionStatus}</span>
              </div>

              {positions.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyMark} aria-hidden="true" />
                  <div>
                    <strong>Nenhuma posição de ativo aberta</strong>
                    <p>
                      {hasAssetTrades
                        ? "As compras e vendas registradas resultam em quantidade aberta zero. Nenhum holding paralelo é mantido."
                        : "Registre uma compra para projetar quantidade. CASH_IN e CASH_OUT não alteram posições de ativos."}
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
                            {asset === undefined
                              ? "Identidade presente no ledger"
                              : `${assetClassLabel(asset.assetClass)} · ${instrumentTypeLabel(asset.instrumentType)}`}
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
                <p>
                  Cadastro mínimo local para selecionar um ativo real no ledger, sem ticker ou
                  catálogo remoto.
                </p>
              </div>
              <span className={styles.emptyStatus}>{assetCountLabel(assets.length)}</span>
            </div>

            <div className={styles.assetLayout}>
              <form className={styles.assetForm} noValidate onSubmit={handleAssetSubmit}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="asset-name">Nome do ativo</label>
                  <input
                    id="asset-name"
                    name="assetName"
                    type="text"
                    autoComplete="off"
                    maxLength={160}
                    value={assetDraft.name}
                    aria-invalid={assetErrors.name !== undefined}
                    aria-describedby={
                      assetErrors.name === undefined
                        ? "asset-name-help"
                        : "asset-name-help asset-name-error"
                    }
                    onChange={(event) => updateAssetDraft("name", event.target.value)}
                  />
                  <p className={styles.helpText} id="asset-name-help">
                    Nome humano usado na seleção de compra e venda; UUID não é exposto como campo.
                  </p>
                  <FieldError id="asset-name-error" message={assetErrors.name} />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="asset-class">Classe econômica</label>
                    <select
                      id="asset-class"
                      name="assetClass"
                      value={assetDraft.assetClass}
                      aria-invalid={assetErrors.assetClass !== undefined}
                      aria-describedby={assetErrors.assetClass ? "asset-class-error" : undefined}
                      onChange={(event) => updateAssetDraft("assetClass", event.target.value)}
                    >
                      {LOCAL_ASSET_CLASS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError id="asset-class-error" message={assetErrors.assetClass} />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="asset-instrument">Instrumento</label>
                    <select
                      id="asset-instrument"
                      name="instrumentType"
                      value={assetDraft.instrumentType}
                      aria-invalid={assetErrors.instrumentType !== undefined}
                      aria-describedby={
                        assetErrors.instrumentType ? "asset-instrument-error" : undefined
                      }
                      onChange={(event) => updateAssetDraft("instrumentType", event.target.value)}
                    >
                      {LOCAL_INSTRUMENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError id="asset-instrument-error" message={assetErrors.instrumentType} />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="asset-currency">Moeda de referência do ativo</label>
                  <input
                    id="asset-currency"
                    name="assetReferenceCurrency"
                    type="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    maxLength={3}
                    value={assetDraft.referenceCurrency}
                    aria-invalid={assetErrors.referenceCurrency !== undefined}
                    aria-describedby={
                      assetErrors.referenceCurrency === undefined
                        ? "asset-currency-help"
                        : "asset-currency-help asset-currency-error"
                    }
                    onChange={(event) =>
                      updateAssetDraft("referenceCurrency", event.target.value.toUpperCase())
                    }
                  />
                  <p className={styles.helpText} id="asset-currency-help">
                    Identidade monetária do Asset; não implica cotação ou conversão FX.
                  </p>
                  <FieldError id="asset-currency-error" message={assetErrors.referenceCurrency} />
                </div>

                {assetErrors.form === undefined ? null : (
                  <p className={styles.formError} role="alert">
                    {assetErrors.form}
                  </p>
                )}

                <button className={styles.primaryAction} type="submit">
                  Cadastrar ativo local
                </button>
              </form>

              <div className={styles.assetCatalog}>
                <div className={styles.ledgerHistoryHeading}>
                  <h3>Disponíveis para transações</h3>
                  <p>Identidade interna validada pelo domínio; seleção visível por nome e contexto.</p>
                </div>

                {assets.length === 0 ? (
                  <div className={styles.ledgerEmptyState}>
                    <strong>Nenhum ativo cadastrado</strong>
                    <p>Cadastre o primeiro ativo para liberar compra e venda.</p>
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
                <p>
                  Entradas, saídas, compras e vendas são fatos históricos. Posições são projeções,
                  não campos editáveis.
                </p>
              </div>
              <span className={styles.emptyStatus}>{ledgerStatus(transactions.length)}</span>
            </div>

            <div className={styles.ledgerLayout}>
              <div className={styles.transactionForms}>
                <form className={styles.transactionForm} noValidate onSubmit={handleCashSubmit}>
                  <div className={styles.formHeading}>
                    <h3>Fluxo de caixa</h3>
                    <p>Entrada ou saída sem AssetId ou quantidade.</p>
                  </div>

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
                      Valor positivo em {snapshot.referenceCurrency}; vírgula ou ponto decimal.
                    </p>
                    <FieldError id="cash-transaction-amount-error" message={cashErrors.amount} />
                  </div>

                  {cashErrors.form === undefined ? null : (
                    <p className={styles.formError} role="alert">
                      {cashErrors.form}
                    </p>
                  )}

                  <button className={styles.primaryAction} type="submit">
                    Registrar fluxo de caixa
                  </button>
                </form>

                <form className={styles.transactionForm} noValidate onSubmit={handleTradeSubmit}>
                  <div className={styles.formHeading}>
                    <h3>Compra e venda</h3>
                    <p>Selecione um Asset real da sessão; a identidade interna fica fora do fluxo.</p>
                  </div>

                  <fieldset className={styles.transactionTypeFieldset}>
                    <legend>Operação</legend>
                    <div className={styles.transactionTypeOptions}>
                      <label>
                        <input
                          type="radio"
                          name="assetTradeType"
                          value="BUY"
                          checked={tradeDraft.type === "BUY"}
                          onChange={() => updateTradeDraft("type", "BUY")}
                        />
                        <span>Compra</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="assetTradeType"
                          value="SELL"
                          checked={tradeDraft.type === "SELL"}
                          onChange={() => updateTradeDraft("type", "SELL")}
                        />
                        <span>Venda</span>
                      </label>
                    </div>
                  </fieldset>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="trade-asset">Ativo</label>
                    <select
                      id="trade-asset"
                      name="tradeAsset"
                      value={tradeDraft.assetId}
                      disabled={assets.length === 0}
                      aria-invalid={tradeErrors.assetId !== undefined}
                      aria-describedby={
                        tradeErrors.assetId === undefined ? "trade-asset-help" : "trade-asset-error"
                      }
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
                        ? "Cadastre um ativo local antes de registrar compra ou venda."
                        : "A seleção usa nome e classe; o AssetId é resolvido internamente."}
                    </p>
                    <FieldError id="trade-asset-error" message={tradeErrors.assetId} />
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="trade-quantity">Quantidade</label>
                      <input
                        id="trade-quantity"
                        name="tradeQuantity"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={tradeDraft.quantity}
                        aria-invalid={tradeErrors.quantity !== undefined}
                        aria-describedby={
                          tradeErrors.quantity === undefined
                            ? "trade-quantity-help"
                            : "trade-quantity-help trade-quantity-error"
                        }
                        onChange={(event) => updateTradeDraft("quantity", event.target.value)}
                      />
                      <p className={styles.helpText} id="trade-quantity-help">
                        Até 12 casas decimais; vírgula ou ponto.
                      </p>
                      <FieldError id="trade-quantity-error" message={tradeErrors.quantity} />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="trade-settlement">Valor de liquidação</label>
                      <input
                        id="trade-settlement"
                        name="tradeSettlementAmount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={tradeDraft.settlementAmount}
                        aria-invalid={tradeErrors.settlementAmount !== undefined}
                        aria-describedby={
                          tradeErrors.settlementAmount === undefined
                            ? "trade-settlement-help"
                            : "trade-settlement-help trade-settlement-error"
                        }
                        onChange={(event) =>
                          updateTradeDraft("settlementAmount", event.target.value)
                        }
                      />
                      <p className={styles.helpText} id="trade-settlement-help">
                        Valor positivo em {snapshot.referenceCurrency}; não é preço de mercado.
                      </p>
                      <FieldError
                        id="trade-settlement-error"
                        message={tradeErrors.settlementAmount}
                      />
                    </div>
                  </div>

                  {tradeErrors.form === undefined ? null : (
                    <p className={styles.formError} role="alert">
                      {tradeErrors.form}
                    </p>
                  )}

                  <button className={styles.primaryAction} type="submit" disabled={assets.length === 0}>
                    Registrar {tradeDraft.type === "BUY" ? "compra" : "venda"}
                  </button>
                </form>
              </div>

              <div className={styles.ledgerHistory}>
                <div className={styles.ledgerHistoryHeading}>
                  <h3>Movimentações desta sessão</h3>
                  <p>
                    Snapshots validados pelo domínio, do registro mais recente para o mais antigo.
                  </p>
                </div>

                {displayTransactions.length === 0 ? (
                  <div className={styles.ledgerEmptyState}>
                    <strong>Ledger sem movimentações</strong>
                    <p>Nenhum saldo, posição ou transação inicial é presumido pelo produto.</p>
                  </div>
                ) : (
                  <ol className={styles.ledgerList}>
                    {displayTransactions.map((transaction) => {
                      const asset =
                        transaction.assetId === null
                          ? undefined
                          : assetsById.get(transaction.assetId);
                      return (
                        <li key={transaction.id}>
                          <div className={styles.transactionMain}>
                            <div>
                              <strong>{transactionLabel(transaction.type)}</strong>
                              {transaction.quantity === null ? null : (
                                <span className={styles.transactionContext}>
                                  {asset?.name ?? "Ativo não disponível nesta sessão"} ·{" "}
                                  {compactQuantity(
                                    projectLocalAssetPositions(transaction.portfolioId, [transaction])
                                      .find((position) => position.assetId === transaction.assetId)
                                      ?.quantity ??
                                      compactQuantity(
                                        String(
                                          transaction.quantity.scaledUnits,
                                        ),
                                      ),
                                  )}
                                </span>
                              )}
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
