export interface RawFinancialData {
  ticker: string;
  name: string;
  industry?: string;
  sector?: string;
  marketCap?: number;
  price?: number;
  revenueTTM?: number;
  revenueQoQ?: number;
  revenueYoY?: number;
  revenue3Yr?: number;
  revenue5Yr?: number;
  netIncome?: number;
  eps?: number;
  epsGrowthYoY?: number;
  epsGrowth3Yr?: number;
  epsGrowth5Yr?: number;
  peRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  pegRatio?: number;
  evToEbitda?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  roe?: number;
  roa?: number;
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  totalCash?: number;
  totalDebt?: number;
  dividendYield?: number;
  payoutRatio?: number;
  ebitda?: number;
  enterpriseValue?: number;
  bookValue?: number;
  totalAssets?: number;
  totalEquity?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  [key: string]: string | number | undefined;
}

export interface CoreMetric {
  id: string;
  name: string;
  category: string;
  format: 'currency' | 'percentage' | 'ratio' | 'number' | 'text';
  calculate: (data: RawFinancialData) => string | number | null;
}

export interface CustomMetric {
  id: string;
  name: string;
  format: 'currency' | 'percentage' | 'ratio' | 'number';
  formula: string;
}

export interface Company {
  id: string;
  ticker: string;
  rawData: RawFinancialData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ComparisonGroup {
  id: string;
  name: string;
  companyIds: string[];
  isGroup: true;
}

export type DashboardItem = Company | ComparisonGroup;

export interface DataProviderConfig {
  provider: string;
  apiKey: string;
}

export interface IDataAdapter {
  name: string;
  fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData>;
}
