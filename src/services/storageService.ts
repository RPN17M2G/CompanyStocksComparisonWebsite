// src/services/storageService.ts
import { DataProviderConfig, CustomMetric, ComparisonGroup, RawFinancialData } from '../shared/types/types';

const STORAGE_KEYS = {
  COMPANIES: 'stock_dashboard_companies',
  PROVIDER_CONFIG: 'stock_dashboard_provider',
  CUSTOM_METRICS: 'stock_dashboard_custom_metrics',
  COMPARISON_GROUPS: 'stock_dashboard_groups',
  KEY_METRICS: 'stock_dashboard_key_metrics',
  API_KEYS: 'stock_dashboard_api_keys',
  COMPANY_CACHE: 'stock_dashboard_company_cache',
  LAST_REFRESH_ALL: 'stock_dashboard_last_refresh_all',
};

// --- localStorage Helpers (for non-sensitive data) ---
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch (error) {
    console.error(`Error parsing stored item ${key}:`, error);
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving stored item ${key}:`, error);
  }
}

// --- sessionStorage Helpers (for sensitive data) ---
function getItemSession<T>(key: string, defaultValue: T): T {
  try {
    const stored = sessionStorage.getItem(key); 
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch (error) {
    console.error(`Error parsing stored session item ${key}:`, error);
    return defaultValue;
  }
}

function setItemSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value)); 
  } catch (error) {
    console.error(`Error saving stored session item ${key}:`, error);
  }
}

export const storageService = {
  // --- API Keys ---
  getApiKeys(): DataProviderConfig[] {
    return getItemSession(STORAGE_KEYS.API_KEYS, []); 
  },

  saveApiKeys(keys: DataProviderConfig[]): void {
    setItemSession(STORAGE_KEYS.API_KEYS, keys); 
  },

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

  // --- Company Data Cache ---
  getCachedCompanyData(ticker: string): { data: RawFinancialData; timestamp: number } | null {
    const cache = getItem<Record<string, { data: RawFinancialData; timestamp: number }>>(
      STORAGE_KEYS.COMPANY_CACHE,
      {}
    );
    return cache[ticker.toUpperCase()] || null;
  },

  setCachedCompanyData(ticker: string, data: RawFinancialData): void {
    const cache = getItem<Record<string, { data: RawFinancialData; timestamp: number }>>(
      STORAGE_KEYS.COMPANY_CACHE,
      {}
    );
    cache[ticker.toUpperCase()] = {
      data,
      timestamp: Date.now(),
    };
    setItem(STORAGE_KEYS.COMPANY_CACHE, cache);
  },

  clearCachedCompanyData(ticker: string): void {
    const cache = getItem<Record<string, { data: RawFinancialData; timestamp: number }>>(
      STORAGE_KEYS.COMPANY_CACHE,
      {}
    );
    delete cache[ticker.toUpperCase()];
    setItem(STORAGE_KEYS.COMPANY_CACHE, cache);
  },

  clearAllCachedData(): void {
    setItem(STORAGE_KEYS.COMPANY_CACHE, {});
  },

  isCacheStale(ticker: string, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const cached = this.getCachedCompanyData(ticker);
    if (!cached) return true;
    return Date.now() - cached.timestamp > maxAgeMs;
  },

  // --- Last Refresh All ---
  getLastRefreshAll(): number | null {
    return getItem<number | null>(STORAGE_KEYS.LAST_REFRESH_ALL, null);
  },

  setLastRefreshAll(): void {
    setItem(STORAGE_KEYS.LAST_REFRESH_ALL, Date.now());
  },

  shouldRefreshAll(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const lastRefresh = this.getLastRefreshAll();
    if (!lastRefresh) return true;
    return Date.now() - lastRefresh > maxAgeMs;
  },
};
