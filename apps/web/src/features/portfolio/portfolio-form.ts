import {
  CurrencyCode,
  InvalidCurrencyCodeError,
  InvalidPortfolioIdError,
  InvalidPortfolioNameError,
  Portfolio,
  PortfolioId,
  type PortfolioSnapshot,
} from "@portfolio-copilot/domain";

export type PortfolioDraft = Readonly<{
  name: string;
  referenceCurrency: string;
}>;

export type PortfolioFieldErrors = Readonly<{
  name?: string;
  referenceCurrency?: string;
  form?: string;
}>;

export type PortfolioCreationResult =
  | Readonly<{ ok: true; snapshot: PortfolioSnapshot }>
  | Readonly<{ ok: false; errors: PortfolioFieldErrors }>;

export type PortfolioIdFactory = () => string;

const NAME_ERROR = "Informe um nome de carteira válido com até 120 caracteres.";
const CURRENCY_ERROR = "Informe um código de moeda válido com 3 letras, como BRL.";
const ID_ERROR = "Não foi possível gerar a identidade local da carteira. Tente novamente.";

export function createInitialPortfolioDraft(): PortfolioDraft {
  return {
    name: "",
    referenceCurrency: "BRL",
  };
}

export function createPortfolioSnapshot(
  draft: PortfolioDraft,
  idFactory: PortfolioIdFactory,
): PortfolioCreationResult {
  try {
    const id = PortfolioId.from(idFactory());
    const referenceCurrency = CurrencyCode.from(draft.referenceCurrency);
    const portfolio = Portfolio.create({
      id,
      name: draft.name,
      referenceCurrency,
    });

    return {
      ok: true,
      snapshot: portfolio.toSnapshot(),
    };
  } catch (error) {
    if (error instanceof InvalidPortfolioNameError) {
      return { ok: false, errors: { name: NAME_ERROR } };
    }

    if (error instanceof InvalidCurrencyCodeError) {
      return { ok: false, errors: { referenceCurrency: CURRENCY_ERROR } };
    }

    if (error instanceof InvalidPortfolioIdError) {
      return { ok: false, errors: { form: ID_ERROR } };
    }

    throw error;
  }
}
