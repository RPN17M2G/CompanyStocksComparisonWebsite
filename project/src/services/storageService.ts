import { DataProviderConfig, CustomMetric, ComparisonGroup } from '../types';

const STORAGE_KEYS = {
  COMPANIES: 'stock_dashboard_companies',
  PROVIDER_CONFIG: 'stock_dashboard_provider',
  CUSTOM_METRICS: 'stock_dashboard_custom_metrics',
  COMPARISON_GROUPS: 'stock_dashboard_groups',
  KEY_METRICS: 'stock_dashboard_key_metrics',
};

export const storageService = {
  getCompanyTickers(): string[] {
    const stored = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    return stored ? JSON.parse(stored) : [];
  },

  saveCompanyTickers(tickers: string[]): void {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(tickers));
  },

  addCompanyTicker(ticker: string): void {
    const tickers = this.getCompanyTickers();
    if (!tickers.includes(ticker.toUpperCase())) {
      tickers.push(ticker.toUpperCase());
      this.saveCompanyTickers(tickers);
    }
  },

  removeCompanyTicker(ticker: string): void {
    const tickers = this.getCompanyTickers();
    const filtered = tickers.filter(t => t !== ticker.toUpperCase());
    this.saveCompanyTickers(filtered);
  },

  getProviderConfig(): DataProviderConfig | null {
    const stored = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIG);
    return stored ? JSON.parse(stored) : null;
  },

  saveProviderConfig(config: DataProviderConfig): void {
    localStorage.setItem(STORAGE_KEYS.PROVIDER_CONFIG, JSON.stringify(config));
  },

  getCustomMetrics(): CustomMetric[] {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_METRICS);
    return stored ? JSON.parse(stored) : [];
  },

  saveCustomMetrics(metrics: CustomMetric[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_METRICS, JSON.stringify(metrics));
  },

  addCustomMetric(metric: CustomMetric): void {
    const metrics = this.getCustomMetrics();
    metrics.push(metric);
    this.saveCustomMetrics(metrics);
  },

  removeCustomMetric(metricId: string): void {
    const metrics = this.getCustomMetrics();
    const filtered = metrics.filter(m => m.id !== metricId);
    this.saveCustomMetrics(filtered);
  },

  getComparisonGroups(): ComparisonGroup[] {
    const stored = localStorage.getItem(STORAGE_KEYS.COMPARISON_GROUPS);
    return stored ? JSON.parse(stored) : [];
  },

  saveComparisonGroups(groups: ComparisonGroup[]): void {
    localStorage.setItem(STORAGE_KEYS.COMPARISON_GROUPS, JSON.stringify(groups));
  },

  addComparisonGroup(group: ComparisonGroup): void {
    const groups = this.getComparisonGroups();
    groups.push(group);
    this.saveComparisonGroups(groups);
  },

  removeComparisonGroup(groupId: string): void {
    const groups = this.getComparisonGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    this.saveComparisonGroups(filtered);
  },

  getKeyMetrics(): string[] {
    const stored = localStorage.getItem(STORAGE_KEYS.KEY_METRICS);
    return stored ? JSON.parse(stored) : ['ticker', 'name', 'marketCap', 'peRatio', 'roe'];
  },

  saveKeyMetrics(metricIds: string[]): void {
    localStorage.setItem(STORAGE_KEYS.KEY_METRICS, JSON.stringify(metricIds));
  },
};
