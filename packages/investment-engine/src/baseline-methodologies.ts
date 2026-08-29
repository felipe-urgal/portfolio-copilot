import { createInvestmentMethodology, InvestmentMethodologyRegistry } from "./methodology";

export const GENERIC_STOCK_METHODOLOGY = createInvestmentMethodology({
  methodologyId: "EQUITY_STOCK_GENERAL",
  version: "1.0.0",
  classification: {
    assetClass: "EQUITY",
    instrumentType: "STOCK",
    sector: "GENERAL",
  },
  quality: [
    { componentId: "PROFITABILITY", weightBps: 2_000 },
    { componentId: "CAPITAL_EFFICIENCY", weightBps: 1_500 },
    { componentId: "BALANCE_SHEET", weightBps: 1_500 },
    { componentId: "COMPETITIVE_QUALITY", weightBps: 1_500 },
    { componentId: "GROWTH_QUALITY", weightBps: 1_500 },
    { componentId: "CASH_GENERATION", weightBps: 1_000 },
    { componentId: "GOVERNANCE", weightBps: 500 },
    { componentId: "PREDICTABILITY", weightBps: 500 },
  ],
  opportunity: [
    { componentId: "VALUATION_HISTORY", weightBps: 2_000 },
    { componentId: "VALUATION_PEERS", weightBps: 1_500 },
    { componentId: "IMPLIED_RETURN", weightBps: 2_000 },
    { componentId: "MARGIN_OF_SAFETY", weightBps: 2_500 },
    { componentId: "EARNINGS_REVISIONS", weightBps: 750 },
    { componentId: "CYCLE_POSITION", weightBps: 500 },
    { componentId: "THESIS_RISK", weightBps: 750 },
  ],
  dividendApplicability: "OPTIONAL",
  dividend: [
    { componentId: "PAYOUT_QUALITY", weightBps: 1_500 },
    { componentId: "CASH_COVERAGE", weightBps: 2_000 },
    { componentId: "DISTRIBUTION_RECURRENCE", weightBps: 1_500 },
    { componentId: "BALANCE_SHEET_SUPPORT", weightBps: 1_500 },
    { componentId: "CAPEX_HEADROOM", weightBps: 1_000 },
    { componentId: "EARNINGS_GROWTH", weightBps: 1_000 },
    { componentId: "DISTRIBUTION_SUSTAINABILITY", weightBps: 1_500 },
  ],
});

export const BANK_STOCK_METHODOLOGY = createInvestmentMethodology({
  methodologyId: "EQUITY_STOCK_BANKS",
  version: "1.0.0",
  classification: {
    assetClass: "EQUITY",
    instrumentType: "STOCK",
    sector: "BANKS",
  },
  quality: [
    { componentId: "RETURN_ON_EQUITY", weightBps: 2_000 },
    { componentId: "CAPITAL_ADEQUACY", weightBps: 1_500 },
    { componentId: "ASSET_QUALITY", weightBps: 1_500 },
    { componentId: "FUNDING_QUALITY", weightBps: 1_000 },
    { componentId: "OPERATING_EFFICIENCY", weightBps: 1_000 },
    { componentId: "EARNINGS_STABILITY", weightBps: 1_000 },
    { componentId: "GOVERNANCE", weightBps: 1_000 },
    { componentId: "GROWTH_QUALITY", weightBps: 1_000 },
  ],
  opportunity: [
    { componentId: "VALUATION_HISTORY", weightBps: 2_000 },
    { componentId: "VALUATION_PEERS", weightBps: 2_000 },
    { componentId: "IMPLIED_RETURN", weightBps: 1_500 },
    { componentId: "MARGIN_OF_SAFETY", weightBps: 2_000 },
    { componentId: "CREDIT_CYCLE", weightBps: 1_000 },
    { componentId: "EARNINGS_REVISIONS", weightBps: 750 },
    { componentId: "THESIS_RISK", weightBps: 750 },
  ],
  dividendApplicability: "OPTIONAL",
  dividend: [
    { componentId: "PAYOUT_QUALITY", weightBps: 1_500 },
    { componentId: "CAPITAL_ADEQUACY_SUPPORT", weightBps: 2_000 },
    { componentId: "EARNINGS_RECURRENCE", weightBps: 1_500 },
    { componentId: "ASSET_QUALITY_SUPPORT", weightBps: 1_000 },
    { componentId: "EARNINGS_GROWTH", weightBps: 1_000 },
    { componentId: "DISTRIBUTION_SUSTAINABILITY", weightBps: 3_000 },
  ],
});

export const REAL_ESTATE_FUND_METHODOLOGY = createInvestmentMethodology({
  methodologyId: "REAL_ESTATE_FUND_GENERAL",
  version: "1.0.0",
  classification: {
    assetClass: "REAL_ESTATE",
    instrumentType: "REAL_ESTATE_FUND",
    sector: "GENERAL",
  },
  quality: [
    { componentId: "OCCUPANCY_QUALITY", weightBps: 1_500 },
    { componentId: "TENANT_QUALITY", weightBps: 1_500 },
    { componentId: "LEASE_QUALITY", weightBps: 1_500 },
    { componentId: "LEVERAGE", weightBps: 1_500 },
    { componentId: "CASH_GENERATION", weightBps: 1_500 },
    { componentId: "PORTFOLIO_DIVERSIFICATION", weightBps: 1_000 },
    { componentId: "MANAGEMENT_QUALITY", weightBps: 1_000 },
    { componentId: "PREDICTABILITY", weightBps: 500 },
  ],
  opportunity: [
    { componentId: "VALUATION_HISTORY", weightBps: 2_000 },
    { componentId: "VALUATION_PEERS", weightBps: 1_500 },
    { componentId: "IMPLIED_RETURN", weightBps: 1_500 },
    { componentId: "MARGIN_OF_SAFETY", weightBps: 2_500 },
    { componentId: "INTEREST_RATE_SENSITIVITY", weightBps: 1_000 },
    { componentId: "LIQUIDITY", weightBps: 500 },
    { componentId: "THESIS_RISK", weightBps: 1_000 },
  ],
  dividendApplicability: "REQUIRED",
  dividend: [
    { componentId: "CASH_COVERAGE", weightBps: 2_000 },
    { componentId: "DISTRIBUTION_RECURRENCE", weightBps: 1_500 },
    { componentId: "OCCUPANCY_SUPPORT", weightBps: 1_500 },
    { componentId: "LEVERAGE_SUPPORT", weightBps: 1_500 },
    { componentId: "CAPEX_HEADROOM", weightBps: 1_000 },
    { componentId: "PAYOUT_QUALITY", weightBps: 1_000 },
    { componentId: "DISTRIBUTION_SUSTAINABILITY", weightBps: 1_500 },
  ],
});

export const BASELINE_INVESTMENT_METHODOLOGIES = Object.freeze([
  GENERIC_STOCK_METHODOLOGY,
  BANK_STOCK_METHODOLOGY,
  REAL_ESTATE_FUND_METHODOLOGY,
]);

export const BASELINE_INVESTMENT_METHODOLOGY_REGISTRY = new InvestmentMethodologyRegistry(
  BASELINE_INVESTMENT_METHODOLOGIES,
);
