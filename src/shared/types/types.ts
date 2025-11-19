export interface RawFinancialData extends Record<string, string | number | undefined> {
  ticker: string;
  name: string;
}

export interface DynamicMetric {
  id: string; // Field name from API
  name: string; // Human-readable name
  category: string;
  format: 'currency' | 'percentage' | 'ratio' | 'number' | 'text';
  aggregationMethod?: 'sum' | 'weightedAverage';
}

export interface CoreMetric extends DynamicMetric {
  calculate: (data: RawFinancialData) => string | number | null;
}

export interface CustomMetric {
  id: string;
  name: string;
  format: 'currency' | 'percentage' | 'ratio' | 'number';
  formula: string;
  betterDirection?: 'higher' | 'lower'; // Which direction is better for numeric values
  priority?: number; // Priority/importance of this metric (1-10, higher = more important)
}

export interface Company {
  id: string;
  ticker: string;
  rawData: RawFinancialData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: number; 
  apiProviders?: string[]; 
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

export interface MultiApiConfig {
  providers: Array<{
    provider: string;
    apiKey: string;
  }>;
  mergeStrategy?: 'merge' | 'first';
}

export interface IDataAdapter {
  name: string;
  fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData>;
}
