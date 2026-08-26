import {
  ASSET_CLASS_CODES,
  Asset,
  AssetClass,
  AssetId,
  CurrencyCode,
  INSTRUMENT_TYPE_CODES,
  InstrumentType,
  InvalidAssetClassError,
  InvalidAssetIdError,
  InvalidAssetNameError,
  InvalidCurrencyCodeError,
  InvalidInstrumentTypeError,
  type AssetClassCode,
  type InstrumentTypeCode,
} from "@portfolio-copilot/domain";

export type LocalAssetDraft = Readonly<{
  name: string;
  assetClass: string;
  instrumentType: string;
  referenceCurrency: string;
}>;

export type LocalAssetSnapshot = Readonly<{
  id: string;
  name: string;
  assetClass: AssetClassCode;
  instrumentType: InstrumentTypeCode;
  referenceCurrency: string;
}>;

export type LocalAssetFieldErrors = Readonly<{
  name?: string;
  assetClass?: string;
  instrumentType?: string;
  referenceCurrency?: string;
  form?: string;
}>;

export type LocalAssetCreationResult =
  | Readonly<{ ok: true; snapshot: LocalAssetSnapshot }>
  | Readonly<{ ok: false; errors: LocalAssetFieldErrors }>;

export type AssetIdFactory = () => string;

const ASSET_CLASS_LABELS: Record<AssetClassCode, string> = {
  CASH: "Caixa",
  FIXED_INCOME: "Renda fixa",
  EQUITY: "Ações",
  REAL_ESTATE: "Imobiliário",
  COMMODITY: "Commodities",
  CRYPTO_ASSET: "Criptoativos",
  MULTI_ASSET: "Multiativos",
};

const INSTRUMENT_TYPE_LABELS: Record<InstrumentTypeCode, string> = {
  CASH_BALANCE: "Saldo de caixa",
  FIXED_INCOME_INSTRUMENT: "Instrumento de renda fixa",
  STOCK: "Ação",
  ETF: "ETF",
  REAL_ESTATE_FUND: "Fundo imobiliário",
  INVESTMENT_FUND: "Fundo de investimento",
  CRYPTO_ASSET: "Criptoativo",
};

const NAME_ERROR = "Informe um nome de ativo válido com até 160 caracteres.";
const ASSET_CLASS_ERROR = "Selecione uma classe econômica válida.";
const INSTRUMENT_TYPE_ERROR = "Selecione um tipo de instrumento válido.";
const CURRENCY_ERROR = "Informe um código de moeda válido com 3 letras, como BRL.";
const ID_ERROR = "Não foi possível gerar a identidade local do ativo. Tente novamente.";

export const LOCAL_ASSET_CLASS_OPTIONS = ASSET_CLASS_CODES.map((value) => ({
  value,
  label: ASSET_CLASS_LABELS[value],
}));

export const LOCAL_INSTRUMENT_TYPE_OPTIONS = INSTRUMENT_TYPE_CODES.map((value) => ({
  value,
  label: INSTRUMENT_TYPE_LABELS[value],
}));

export function assetClassLabel(value: AssetClassCode): string {
  return ASSET_CLASS_LABELS[value];
}

export function instrumentTypeLabel(value: InstrumentTypeCode): string {
  return INSTRUMENT_TYPE_LABELS[value];
}

export function createInitialLocalAssetDraft(referenceCurrency: string): LocalAssetDraft {
  return {
    name: "",
    assetClass: "EQUITY",
    instrumentType: "STOCK",
    referenceCurrency,
  };
}

export function createLocalAssetSnapshot(
  draft: LocalAssetDraft,
  idFactory: AssetIdFactory,
): LocalAssetCreationResult {
  try {
    const id = AssetId.from(idFactory());
    const assetClass = AssetClass.from(draft.assetClass);
    const instrumentType = InstrumentType.from(draft.instrumentType);
    const referenceCurrency = CurrencyCode.from(draft.referenceCurrency);
    const asset = Asset.create({
      id,
      name: draft.name,
      assetClass,
      instrumentType,
      referenceCurrency,
    });

    return {
      ok: true,
      snapshot: {
        id: asset.id.toString(),
        name: asset.name,
        assetClass: asset.assetClass.code,
        instrumentType: asset.instrumentType.code,
        referenceCurrency: asset.referenceCurrency.toString(),
      },
    };
  } catch (error) {
    if (error instanceof InvalidAssetNameError) {
      return { ok: false, errors: { name: NAME_ERROR } };
    }

    if (error instanceof InvalidAssetClassError) {
      return { ok: false, errors: { assetClass: ASSET_CLASS_ERROR } };
    }

    if (error instanceof InvalidInstrumentTypeError) {
      return { ok: false, errors: { instrumentType: INSTRUMENT_TYPE_ERROR } };
    }

    if (error instanceof InvalidCurrencyCodeError) {
      return { ok: false, errors: { referenceCurrency: CURRENCY_ERROR } };
    }

    if (error instanceof InvalidAssetIdError) {
      return { ok: false, errors: { form: ID_ERROR } };
    }

    throw error;
  }
}
