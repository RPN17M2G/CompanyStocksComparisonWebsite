import { DataProviderConfig, CustomMetric, ComparisonGroup } from '../shared/types/types';

const STORAGE_KEYS = {
  COMPANIES: 'stock_dashboard_companies',
  PROVIDER_CONFIG: 'stock_dashboard_provider',
  CUSTOM_METRICS: 'stock_dashboard_custom_metrics',
  COMPARISON_GROUPS: 'stock_dashboard_groups',
  KEY_METRICS: 'stock_dashboard_key_metrics',
};

/**
 * Safely retrieves and parses a JSON item from localStorage.
 * @param key The localStorage key.
 * @param defaultValue A fallback value if the key doesn't exist or is invalid JSON.
 * @returns The parsed item or the default value.
 */
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch (error) {
    console.error(`Error parsing stored item ${key}:`, error);
    // On error, return the default value to prevent app crash
    return defaultValue;
  }
}

/**
 * Safely stringifies and saves a value to localStorage.
 * @param key The localStorage key.
 * @param value The value to save.
 */
function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving stored item ${key}:`, error);
  }
}

export const storageService = {
  // --- Companies ---
  getCompanyTickers(): string[] {
    return getItem(STORAGE_KEYS.COMPANIES, []);
  },

  saveCompanyTickers(tickers: string[]): void {
    setItem(STORAGE_KEYS.COMPANIES, tickers);
  },

  addCompanyTicker(ticker: string): void {
    const tickers = this.getCompanyTickers();
    if (!tickers.includes(ticker.toUpperCase())) {
      this.saveCompanyTickers([...tickers, ticker.toUpperCase()]);
    }
  },

  removeCompanyTicker(ticker: string): void {
    const tickers = this.getCompanyTickers();
    const filtered = tickers.filter(t => t !== ticker.toUpperCase());
    this.saveCompanyTickers(filtered);
  },

  // --- Provider Config ---
  getProviderConfig(): DataProviderConfig | null {
    return getItem(STORAGE_KEYS.PROVIDER_CONFIG, null);
  },

  saveProviderConfig(config: DataProviderConfig): void {
    setItem(STORAGE_KEYS.PROVIDER_CONFIG, config);
  },

  // --- Custom Metrics ---
  getCustomMetrics(): CustomMetric[] {
    return getItem(STORAGE_KEYS.CUSTOM_METRICS, []);
  },

  saveCustomMetrics(metrics: CustomMetric[]): void {
    setItem(STORAGE_KEYS.CUSTOM_METRICS, metrics);
  },

  addCustomMetric(metric: CustomMetric): void {
    const metrics = this.getCustomMetrics();
    this.saveCustomMetrics([...metrics, metric]);
  },

  removeCustomMetric(metricId: string): void {
    const metrics = this.getCustomMetrics();
    const filtered = metrics.filter(m => m.id !== metricId);
    this.saveCustomMetrics(filtered);
  },

  // --- Comparison Groups ---
  getComparisonGroups(): ComparisonGroup[] {
    return getItem(STORAGE_KEYS.COMPARISON_GROUPS, []);
  },

  saveComparisonGroups(groups: ComparisonGroup[]): void {
    setItem(STORAGE_KEYS.COMPARISON_GROUPS, groups);
  },

  addComparisonGroup(group: ComparisonGroup): void {
    const groups = this.getComparisonGroups();
    this.saveComparisonGroups([...groups, group]);
  },

  removeComparisonGroup(groupId: string): void {
    const groups = this.getComparisonGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    this.saveComparisonGroups(filtered);
  },

  // --- Key Metrics ---
  getKeyMetrics(): string[] {
    const defaultMetrics = ['ticker', 'name', 'marketCap', 'peRatio', 'roe'];
    return getItem(STORAGE_KEYS.KEY_METRICS, defaultMetrics);
  },

  saveKeyMetrics(metricIds: string[]): void {
    setItem(STORAGE_KEYS.KEY_METRICS, metricIds);
  },
};
