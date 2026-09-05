"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  AssetQuantity,
  Money,
  type PortfolioSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";

import {
  Alert,
  Badge,
  Button,
  Disclosure,
  EmptyState,
  Field,
  FieldError,
  HelpText,
  Label,
  PageHeader,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Status,
  Surface,
  TextInput,
} from "@/components/ui";

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
import { ContributionBaselinePanel } from "./contribution-baseline-panel";
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

type PortfolioTask = "overview" | "assets" | "transactions" | "contribution" | "settings";
type PortfolioFocusTarget = PortfolioTask | "creation";

type PortfolioWorkspaceProps = Readonly<{
  initialSnapshot?: PortfolioSnapshot | null;
  initialAssets?: readonly LocalAssetSnapshot[];
  initialTransactions?: readonly TransactionSnapshot[];
  initialTask?: PortfolioTask;
}>;

const PORTFOLIO_TASKS: readonly Readonly<{ id: PortfolioTask; label: string }>[] = [
  { id: "overview", label: "Visão geral" },
  { id: "assets", label: "Ativos e posições" },
  { id: "transactions", label: "Transações" },
  { id: "contribution", label: "Aporte" },
  { id: "settings", label: "Configuração" },
];

function ErrorMessage({ id, message }: Readonly<{ id: string; message: string | undefined }>) {
  if (message === undefined) return null;
  return <FieldError id={id}>{message}</FieldError>;
}

function focusFirstInvalidField(form: HTMLFormElement): void {
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
  });
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

function formatOccurredAt(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function PortfolioWorkspace({
  initialSnapshot = null,
  initialAssets = [],
  initialTransactions = [],
  initialTask = "overview",
}: PortfolioWorkspaceProps) {
  const [activeTask, setActiveTask] = useState<PortfolioTask>(initialTask);
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
  const taskButtonRefs = useRef<Partial<Record<PortfolioTask, HTMLButtonElement | null>>>({});
  const portfolioFormTitleRef = useRef<HTMLHeadingElement>(null);
  const pendingFocusRef = useRef<PortfolioFocusTarget | null>(null);

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (target === null) return;

    if (target === "creation") {
      portfolioFormTitleRef.current?.focus();
    } else {
      taskButtonRefs.current[target]?.focus();
    }
    pendingFocusRef.current = null;
  }, [activeTask, snapshot]);

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

  function activateTask(task: PortfolioTask): void {
    pendingFocusRef.current = task;
    setActiveTask(task);
  }

  function handlePortfolioSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createPortfolioSnapshot(draft, () => globalThis.crypto.randomUUID());
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstInvalidField(event.currentTarget);
      return;
    }
    pendingFocusRef.current = "overview";
    setSnapshot(result.snapshot);
    setAssetDraft(createInitialLocalAssetDraft(result.snapshot.referenceCurrency));
    setErrors({});
    setActiveTask("overview");
  }

  function handleAssetSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (snapshot === null) return;
    const result = createLocalAssetSnapshot(assetDraft, () => globalThis.crypto.randomUUID());
    if (!result.ok) {
      setAssetErrors(result.errors);
      focusFirstInvalidField(event.currentTarget);
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
      focusFirstInvalidField(event.currentTarget);
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
      focusFirstInvalidField(event.currentTarget);
      return;
    }
    setTransactions((current) => [...current, result.snapshot]);
    setTradeDraft((current) => ({ ...current, quantity: "", settlementAmount: "" }));
    setTradeErrors({});
  }

  function resetPortfolio(): void {
    pendingFocusRef.current = "creation";
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
    setActiveTask("overview");
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

  const nextAction =
    assets.length === 0
      ? {
          task: "assets" as const,
          title: "Cadastre o primeiro ativo",
          description:
            "O catálogo local libera seleção humana nas transações sem expor AssetId como campo.",
          label: "Ir para Ativos e posições",
        }
      : transactions.length === 0
        ? {
            task: "transactions" as const,
            title: "Registre o primeiro fato no ledger",
            description:
              "Posições só existem depois de BUY/SELL; fluxos de caixa permanecem separados.",
            label: "Ir para Transações",
          }
        : {
            task: "contribution" as const,
            title: "Estruture o próximo aporte",
            description:
              "Use baseline manual, política, concentração e restrições antes da recomendação determinística.",
            label: "Ir para Aporte",
          };
  return (
    <div className={styles.workspace}>
      <PageHeader
        title="Carteira"
        description={
          snapshot === null
            ? "Configure a carteira local antes de cadastrar ativos, registrar fatos no Transaction Ledger e estruturar aportes."
            : "Consulte e mantenha fatos da carteira por tarefa. Posições continuam derivadas do ledger e nenhum preço, patrimônio ou P&L é inferido."
        }
        actions={<Badge tone="accent">Estado local</Badge>}
      />

      {snapshot === null ? (
        <div className={styles.creationLayout}>
          <Surface padding="lg" aria-labelledby="portfolio-form-title">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Configuração inicial</span>
                <h2 id="portfolio-form-title" ref={portfolioFormTitleRef} tabIndex={-1}>
                  Criar carteira
                </h2>
                <p>O domínio valida nome e moeda antes de liberar ativos e Transaction Ledger.</p>
              </div>
              <Status tone="neutral">Ainda não configurada</Status>
            </div>

            <form className={styles.form} noValidate onSubmit={handlePortfolioSubmit}>
              <Field>
                <Label htmlFor="portfolio-name" required>
                  Nome da carteira
                </Label>
                <TextInput
                  id="portfolio-name"
                  required
                  type="text"
                  maxLength={120}
                  autoComplete="off"
                  value={draft.name}
                  invalid={errors.name !== undefined}
                  aria-describedby={errors.name ? "portfolio-name-error" : undefined}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
                <ErrorMessage id="portfolio-name-error" message={errors.name} />
              </Field>

              <Field>
                <Label htmlFor="portfolio-currency" required>
                  Moeda de referência
                </Label>
                <TextInput
                  id="portfolio-currency"
                  required
                  type="text"
                  maxLength={3}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={draft.referenceCurrency}
                  invalid={errors.referenceCurrency !== undefined}
                  aria-describedby={
                    errors.referenceCurrency
                      ? "portfolio-currency-error"
                      : "portfolio-currency-help"
                  }
                  onChange={(event) =>
                    updateDraft("referenceCurrency", event.target.value.toUpperCase())
                  }
                />
                <HelpText id="portfolio-currency-help">
                  Código de três letras, como BRL, USD ou EUR.
                </HelpText>
                <ErrorMessage id="portfolio-currency-error" message={errors.referenceCurrency} />
              </Field>

              {errors.form ? <FieldError>{errors.form}</FieldError> : null}

              <div className={styles.actionRow}>
                <Button type="submit">Criar carteira local</Button>
              </div>
            </form>
          </Surface>

          <Surface tone="subtle" padding="lg" aria-labelledby="portfolio-principles-title">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Contrato de dados</span>
                <h2 id="portfolio-principles-title">O que a carteira representa</h2>
              </div>
            </div>
            <dl className={styles.factList}>
              <div>
                <dt>Portfolio</dt>
                <dd>Identidade, nome e moeda de referência.</dd>
              </div>
              <div>
                <dt>Ativos</dt>
                <dd>Catálogo local com identidade própria e seleção por contexto humano.</dd>
              </div>
              <div>
                <dt>Posições</dt>
                <dd>Projeção exclusiva de BUY/SELL no Transaction Ledger.</dd>
              </div>
              <div>
                <dt>Market Data</dt>
                <dd>Não participa desta superfície; preço e patrimônio não são inventados.</dd>
              </div>
            </dl>
          </Surface>
        </div>
      ) : (
        <>
          <nav className={styles.taskTabs} aria-label="Tarefas da carteira">
            {PORTFOLIO_TASKS.map((task) => (
              <Button
                key={task.id}
                ref={(node) => {
                  taskButtonRefs.current[task.id] = node;
                }}
                size="md"
                variant={activeTask === task.id ? "secondary" : "ghost"}
                aria-current={activeTask === task.id ? "page" : undefined}
                aria-controls={`portfolio-panel-${task.id}`}
                id={`portfolio-task-${task.id}`}
                onClick={() => setActiveTask(task.id)}
              >
                {task.label}
              </Button>
            ))}
          </nav>

          <section
            className={styles.taskPanel}
            id="portfolio-panel-overview"
            aria-labelledby="portfolio-task-overview"
            hidden={activeTask !== "overview"}
          >
            <div className={styles.overviewGrid}>
              <Surface padding="lg" className={styles.overviewPrimary}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Visão geral</span>
                    <h2>{snapshot.name}</h2>
                    <p>Moeda de referência {snapshot.referenceCurrency}.</p>
                  </div>
                  <Status tone="success">Configurada</Status>
                </div>

                <dl className={styles.summaryList}>
                  <div>
                    <dt>Ativos cadastrados</dt>
                    <dd>{assets.length}</dd>
                  </div>
                  <div>
                    <dt>Posições abertas</dt>
                    <dd>{positions.length}</dd>
                  </div>
                  <div>
                    <dt>Movimentações</dt>
                    <dd>{transactions.length}</dd>
                  </div>
                </dl>

                <Alert tone="info" title="Sem valuation implícito">
                  Quantidade, settlement e base manual não são preço de mercado, patrimônio, custo
                  médio ou P&amp;L. Essas métricas permanecem ausentes até existir fonte real.
                </Alert>
              </Surface>

              <Surface tone="subtle" padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Próxima ação</span>
                    <h2>{nextAction.title}</h2>
                    <p>{nextAction.description}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => activateTask(nextAction.task)}>
                  {nextAction.label}
                </Button>
              </Surface>
            </div>

            <Surface padding="lg">
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Posições</span>
                  <h2>Posições projetadas</h2>
                  <p>Quantidade aberta derivada exclusivamente do Transaction Ledger.</p>
                </div>
                <Status tone="neutral">{positionStatus}</Status>
              </div>

              {positions.length === 0 ? (
                <EmptyState
                  title="Nenhuma posição de ativo aberta"
                  description={
                    hasTrades
                      ? "As compras e vendas registradas resultam em quantidade aberta zero. Nenhum holding paralelo é mantido."
                      : hasCashFlows
                        ? "Existem somente fluxos de caixa. CASH_IN e CASH_OUT não alteram posições."
                        : "Registre uma compra para projetar quantidade. CASH_IN e CASH_OUT não alteram posições."
                  }
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activateTask("transactions")}
                    >
                      Abrir Transações
                    </Button>
                  }
                />
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
            </Surface>
          </section>

          <section
            className={styles.taskPanel}
            id="portfolio-panel-assets"
            aria-labelledby="portfolio-task-assets"
            hidden={activeTask !== "assets"}
          >
            <div className={styles.assetGrid}>
              <Surface padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Ativos</span>
                    <h2>Cadastrar ativo local</h2>
                    <p>O ativo entra no catálogo da sessão sem ticker, busca remota ou preço.</p>
                  </div>
                </div>

                <form className={styles.form} noValidate onSubmit={handleAssetSubmit}>
                  <Field>
                    <Label htmlFor="asset-name" required>
                      Nome do ativo
                    </Label>
                    <TextInput
                      id="asset-name"
                      required
                      type="text"
                      maxLength={160}
                      autoComplete="off"
                      value={assetDraft.name}
                      invalid={assetErrors.name !== undefined}
                      aria-describedby={assetErrors.name ? "asset-name-error" : "asset-name-help"}
                      onChange={(event) => updateAssetDraft("name", event.target.value)}
                    />
                    <HelpText id="asset-name-help">
                      Nome usado na seleção de compra e venda; UUID permanece em detalhe técnico.
                    </HelpText>
                    <ErrorMessage id="asset-name-error" message={assetErrors.name} />
                  </Field>

                  <div className={styles.fieldRow}>
                    <Field>
                      <Label htmlFor="asset-class" required>
                        Classe econômica
                      </Label>
                      <Select
                        id="asset-class"
                        required
                        value={assetDraft.assetClass}
                        onChange={(event) => updateAssetDraft("assetClass", event.target.value)}
                      >
                        {LOCAL_ASSET_CLASS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field>
                      <Label htmlFor="asset-instrument" required>
                        Instrumento
                      </Label>
                      <Select
                        id="asset-instrument"
                        required
                        value={assetDraft.instrumentType}
                        onChange={(event) => updateAssetDraft("instrumentType", event.target.value)}
                      >
                        {LOCAL_INSTRUMENT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field>
                    <Label htmlFor="asset-currency" required>
                      Moeda de referência do ativo
                    </Label>
                    <TextInput
                      id="asset-currency"
                      required
                      type="text"
                      maxLength={3}
                      autoCapitalize="characters"
                      autoComplete="off"
                      value={assetDraft.referenceCurrency}
                      invalid={assetErrors.referenceCurrency !== undefined}
                      aria-describedby={
                        assetErrors.referenceCurrency
                          ? "asset-currency-error"
                          : "asset-currency-help"
                      }
                      onChange={(event) =>
                        updateAssetDraft("referenceCurrency", event.target.value.toUpperCase())
                      }
                    />
                    <HelpText id="asset-currency-help">
                      Não implica cotação nem conversão FX.
                    </HelpText>
                    <ErrorMessage
                      id="asset-currency-error"
                      message={assetErrors.referenceCurrency}
                    />
                  </Field>

                  {assetErrors.form ? <FieldError>{assetErrors.form}</FieldError> : null}

                  <div className={styles.actionRow}>
                    <Button type="submit">Cadastrar ativo local</Button>
                  </div>
                </form>
              </Surface>

              <Surface tone="subtle" padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Catálogo</span>
                    <h2>Ativos disponíveis</h2>
                    <p>Catálogo e posição são conceitos separados.</p>
                  </div>
                  <Status tone="neutral">
                    {countLabel(assets.length, "ativo", "ativos", "Nenhum ativo")}
                  </Status>
                </div>

                {assets.length === 0 ? (
                  <EmptyState
                    title="Nenhum ativo cadastrado"
                    description="Cadastre um ativo para liberar compra e venda com seleção por nome e contexto."
                  />
                ) : (
                  <ul className={styles.assetList}>
                    {assets.map((asset) => (
                      <li key={asset.id}>
                        <div>
                          <strong>{asset.name}</strong>
                          <span>
                            {assetClassLabel(asset.assetClass)} ·{" "}
                            {instrumentTypeLabel(asset.instrumentType)} · {asset.referenceCurrency}
                          </span>
                        </div>
                        <Disclosure className={styles.inlineDetails} summary="Identidade técnica">
                          <code>{asset.id}</code>
                        </Disclosure>
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>
            </div>

            <Surface padding="lg">
              <div className={styles.sectionHeading}>
                <div>
                  <span className={styles.eyebrow}>Posições</span>
                  <h2>Posições abertas</h2>
                  <p>Quantidade projetada pelo domínio; não existe campo de holding editável.</p>
                </div>
                <Status tone="neutral">{positionStatus}</Status>
              </div>

              {positions.length === 0 ? (
                <EmptyState
                  title="Nenhuma posição de ativo aberta"
                  description={
                    hasTrades
                      ? "Os fatos de compra e venda resultam em quantidade aberta zero. Nenhum holding paralelo é mantido."
                      : "Registre uma compra para projetar quantidade. CASH_IN e CASH_OUT não alteram posições."
                  }
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activateTask("transactions")}
                    >
                      Registrar transação
                    </Button>
                  }
                />
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
            </Surface>
          </section>

          <section
            className={styles.taskPanel}
            id="portfolio-panel-transactions"
            aria-labelledby="portfolio-task-transactions"
            hidden={activeTask !== "transactions"}
          >
            <div className={styles.transactionGrid}>
              <Surface padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Registrar fato</span>
                    <h2>Nova movimentação</h2>
                    <p>Erros de validação não entram parcialmente no ledger.</p>
                  </div>
                </div>

                <div className={styles.transactionForms}>
                  <form className={styles.form} noValidate onSubmit={handleCashSubmit}>
                    <div className={styles.formHeading}>
                      <h3>Fluxo de caixa</h3>
                      <p>Entrada ou saída sem ativo ou quantidade.</p>
                    </div>

                    <SegmentedControl legend="Tipo do fluxo de caixa (obrigatório)">
                      {(["CASH_IN", "CASH_OUT"] as const).map((type) => (
                        <SegmentedControlOption
                          key={type}
                          name="cashTransactionType"
                          required
                          value={type}
                          checked={cashDraft.type === type}
                          onChange={() => {
                            setCashDraft((current) => ({ ...current, type }));
                            setCashErrors({});
                          }}
                        >
                          {type === "CASH_IN" ? "Entrada" : "Saída"}
                        </SegmentedControlOption>
                      ))}
                    </SegmentedControl>

                    <Field>
                      <Label htmlFor="cash-transaction-amount" required>
                        Valor
                      </Label>
                      <TextInput
                        id="cash-transaction-amount"
                        required
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={cashDraft.amount}
                        invalid={cashErrors.amount !== undefined}
                        aria-describedby={
                          cashErrors.amount ? "cash-amount-error" : "cash-amount-help"
                        }
                        onChange={(event) => {
                          setCashDraft((current) => ({ ...current, amount: event.target.value }));
                          setCashErrors({});
                        }}
                      />
                      <HelpText id="cash-amount-help">
                        Valor positivo em {snapshot.referenceCurrency}; vírgula ou ponto decimal.
                      </HelpText>
                      <ErrorMessage id="cash-amount-error" message={cashErrors.amount} />
                    </Field>

                    {cashErrors.form ? <FieldError>{cashErrors.form}</FieldError> : null}
                    <Button type="submit">Registrar fluxo de caixa</Button>
                  </form>

                  <form className={styles.form} noValidate onSubmit={handleTradeSubmit}>
                    <div className={styles.formHeading}>
                      <h3>Compra e venda</h3>
                      <p>Ativo selecionado por nome; AssetId permanece interno à interface.</p>
                    </div>

                    <SegmentedControl legend="Operação com ativo (obrigatório)">
                      {(["BUY", "SELL"] as const).map((type) => (
                        <SegmentedControlOption
                          key={type}
                          name="assetTradeType"
                          required
                          value={type}
                          checked={tradeDraft.type === type}
                          onChange={() => updateTradeDraft("type", type)}
                        >
                          {type === "BUY" ? "Compra" : "Venda"}
                        </SegmentedControlOption>
                      ))}
                    </SegmentedControl>

                    <Field>
                      <Label htmlFor="trade-asset" required>
                        Ativo
                      </Label>
                      <Select
                        id="trade-asset"
                        required
                        disabled={assets.length === 0}
                        value={tradeDraft.assetId}
                        invalid={tradeErrors.assetId !== undefined}
                        aria-describedby={
                          tradeErrors.assetId ? "trade-asset-error" : "trade-asset-help"
                        }
                        onChange={(event) => updateTradeDraft("assetId", event.target.value)}
                      >
                        <option value="">Selecione um ativo</option>
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name} — {assetClassLabel(asset.assetClass)}
                          </option>
                        ))}
                      </Select>
                      <HelpText id="trade-asset-help">
                        {assets.length === 0
                          ? "Cadastre um ativo local antes de negociar."
                          : "O AssetId não é solicitado ao usuário."}
                      </HelpText>
                      <ErrorMessage id="trade-asset-error" message={tradeErrors.assetId} />
                    </Field>

                    <div className={styles.fieldRow}>
                      <Field>
                        <Label htmlFor="trade-quantity" required>
                          Quantidade
                        </Label>
                        <TextInput
                          id="trade-quantity"
                          required
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={tradeDraft.quantity}
                          invalid={tradeErrors.quantity !== undefined}
                          aria-describedby={
                            tradeErrors.quantity ? "trade-quantity-error" : "trade-quantity-help"
                          }
                          onChange={(event) => updateTradeDraft("quantity", event.target.value)}
                        />
                        <HelpText id="trade-quantity-help">Até 12 casas decimais.</HelpText>
                        <ErrorMessage id="trade-quantity-error" message={tradeErrors.quantity} />
                      </Field>

                      <Field>
                        <Label htmlFor="trade-settlement" required>
                          Valor de liquidação
                        </Label>
                        <TextInput
                          id="trade-settlement"
                          required
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={tradeDraft.settlementAmount}
                          invalid={tradeErrors.settlementAmount !== undefined}
                          aria-describedby={
                            tradeErrors.settlementAmount
                              ? "trade-settlement-error"
                              : "trade-settlement-help"
                          }
                          onChange={(event) =>
                            updateTradeDraft("settlementAmount", event.target.value)
                          }
                        />
                        <HelpText id="trade-settlement-help">
                          Valor positivo em {snapshot.referenceCurrency}; não é preço de mercado.
                        </HelpText>
                        <ErrorMessage
                          id="trade-settlement-error"
                          message={tradeErrors.settlementAmount}
                        />
                      </Field>
                    </div>

                    {tradeErrors.form ? <FieldError>{tradeErrors.form}</FieldError> : null}
                    <Button type="submit" disabled={assets.length === 0}>
                      Registrar {tradeDraft.type === "BUY" ? "compra" : "venda"}
                    </Button>
                  </form>
                </div>
              </Surface>

              <Surface tone="subtle" padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Histórico</span>
                    <h2>Transaction Ledger</h2>
                    <p>Mais recentes primeiro; cada item é um snapshot validado.</p>
                  </div>
                  <Status role="status" tone="neutral">
                    {countLabel(
                      transactions.length,
                      "movimentação",
                      "movimentações",
                      "Ledger vazio",
                    )}
                  </Status>
                </div>

                {displayTransactions.length === 0 ? (
                  <EmptyState
                    title="Ledger sem movimentações"
                    description="Nenhum saldo, posição ou transação inicial é presumido."
                  />
                ) : (
                  <ol className={styles.ledgerList}>
                    {displayTransactions.map((transaction) => {
                      const asset = transaction.assetId
                        ? assetsById.get(transaction.assetId)
                        : undefined;
                      const quantity = transactionQuantity(transaction);
                      return (
                        <li key={transaction.id}>
                          <div className={styles.transactionMain}>
                            <div>
                              <strong>{transactionLabel(transaction.type)}</strong>
                              {quantity ? (
                                <span className={styles.transactionContext}>
                                  {asset?.name ?? "Ativo não disponível nesta sessão"} · {quantity}{" "}
                                  un.
                                </span>
                              ) : null}
                              <time dateTime={transaction.occurredAt}>
                                {formatOccurredAt(transaction.occurredAt)} UTC
                              </time>
                            </div>
                            <span className={styles.transactionAmount}>
                              {transactionAmount(transaction)}
                            </span>
                          </div>
                          <Disclosure className={styles.inlineDetails} summary="Detalhes técnicos">
                            <code>{transaction.id}</code>
                          </Disclosure>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Surface>
            </div>
          </section>

          <section
            className={styles.taskPanel}
            id="portfolio-panel-contribution"
            aria-labelledby="portfolio-task-contribution"
            hidden={activeTask !== "contribution"}
          >
            <Alert tone="info" title="Aporte é planejamento, não execução de ordem">
              O fluxo usa valores manuais e regras determinísticas para produzir um plano auditável.
              Nada aqui envia ordem para corretora ou transforma quantidade do ledger em valuation.
            </Alert>
            <ContributionBaselinePanel portfolio={snapshot} assets={assets} />
          </section>

          <section
            className={styles.taskPanel}
            id="portfolio-panel-settings"
            aria-labelledby="portfolio-task-settings"
            hidden={activeTask !== "settings"}
          >
            <div className={styles.settingsGrid}>
              <Surface padding="lg">
                <div className={styles.sectionHeading}>
                  <div>
                    <span className={styles.eyebrow}>Configuração</span>
                    <h2>Carteira desta sessão</h2>
                    <p>Snapshot validado pelo agregado Portfolio.</p>
                  </div>
                  <Status tone="success">Validada</Status>
                </div>

                <dl className={styles.factList}>
                  <div>
                    <dt>Nome</dt>
                    <dd>{snapshot.name}</dd>
                  </div>
                  <div>
                    <dt>Moeda de referência</dt>
                    <dd>{snapshot.referenceCurrency}</dd>
                  </div>
                </dl>

                <Disclosure
                  className={styles.technicalDetails}
                  summary="Detalhes técnicos e identidade"
                >
                  <div className={styles.detailsBody}>
                    <p>
                      A identidade canônica é mantida para os snapshots e regras do domínio, mas não
                      participa da primeira ordem da experiência.
                    </p>
                    <code>{snapshot.id}</code>
                  </div>
                </Disclosure>
              </Surface>

              <Surface tone="subtle" padding="lg">
                <Alert tone="warning" title="Nada é persistido nesta versão">
                  Carteira, ativos e movimentações existem somente enquanto esta tela permanecer
                  aberta. Recarregar ou sair remove todo o estado criado aqui.
                </Alert>

                <div className={styles.resetBlock}>
                  <div>
                    <h2>Recomeçar o estado local</h2>
                    <p>
                      Remove carteira, ativos, movimentações e estados de aporte desta sessão. A
                      ação não altera perfil financeiro ou dados da conta.
                    </p>
                  </div>
                  <Button variant="danger" onClick={resetPortfolio}>
                    Criar outra carteira
                  </Button>
                </div>
              </Surface>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
