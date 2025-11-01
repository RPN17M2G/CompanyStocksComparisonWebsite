import { RawFinancialData, CustomMetric, ComparisonGroup, Company } from '../types';
import { coreMetrics } from './coreMetrics';

export function calculateCoreMetric(metricId: string, data: RawFinancialData): string | number | null {
  const metric = coreMetrics.find(m => m.id === metricId);
  if (!metric) return null;
  return metric.calculate(data);
}

export function calculateCustomMetric(
  metric: CustomMetric,
  data: RawFinancialData
): number | null {
  try {
    const formula = metric.formula;
    let processedFormula = formula;

    const fieldNames = Object.keys(data).filter(key => typeof data[key] === 'number');

    fieldNames.sort((a, b) => b.length - a.length);

    for (const field of fieldNames) {
      const value = data[field];
      if (typeof value === 'number') {
        const regex = new RegExp(`\\b${field}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, value.toString());
      }
    }

    const allowedChars = /^[\d\s+\-*/.()]+$/;
    if (!allowedChars.test(processedFormula)) {
      console.error('Invalid formula after substitution:', processedFormula);
      return null;
    }

    const result = eval(processedFormula);
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch (error) {
    console.error('Error calculating custom metric:', error);
    return null;
  }
}

export function aggregateGroupData(
  group: ComparisonGroup,
  companies: Company[]
): RawFinancialData {
  const groupCompanies = companies.filter(c => group.companyIds.includes(c.id) && c.rawData);

  if (groupCompanies.length === 0) {
    return {
      ticker: group.id,
      name: group.name,
    };
  }

  const validData = groupCompanies.map(c => c.rawData!);
  const marketCaps = validData.map(d => d.marketCap || 0).filter(m => m > 0);
  const totalMarketCap = marketCaps.reduce((sum, mc) => sum + mc, 0);

  const weightedAverage = (field: keyof RawFinancialData): number | undefined => {
    if (totalMarketCap === 0) return undefined;
    let weightedSum = 0;
    let validWeights = 0;

    validData.forEach(d => {
      const value = d[field];
      const mc = d.marketCap || 0;
      if (typeof value === 'number' && mc > 0) {
        weightedSum += value * mc;
        validWeights += mc;
      }
    });

    return validWeights > 0 ? weightedSum / validWeights : undefined;
  };

  const sum = (field: keyof RawFinancialData): number | undefined => {
    let total = 0;
    let hasValue = false;
    validData.forEach(d => {
      const value = d[field];
      if (typeof value === 'number') {
        total += value;
        hasValue = true;
      }
    });
    return hasValue ? total : undefined;
  };

  return {
    ticker: group.id,
    name: group.name,
    industry: `Group of ${groupCompanies.length} companies`,
    marketCap: sum('marketCap'),
    price: weightedAverage('price'),
    revenueTTM: sum('revenueTTM'),
    revenueQoQ: weightedAverage('revenueQoQ'),
    revenueYoY: weightedAverage('revenueYoY'),
    revenue3Yr: weightedAverage('revenue3Yr'),
    revenue5Yr: weightedAverage('revenue5Yr'),
    netIncome: sum('netIncome'),
    eps: weightedAverage('eps'),
    epsGrowthYoY: weightedAverage('epsGrowthYoY'),
    epsGrowth3Yr: weightedAverage('epsGrowth3Yr'),
    epsGrowth5Yr: weightedAverage('epsGrowth5Yr'),
    peRatio: weightedAverage('peRatio'),
    pbRatio: weightedAverage('pbRatio'),
    psRatio: weightedAverage('psRatio'),
    pegRatio: weightedAverage('pegRatio'),
    evToEbitda: weightedAverage('evToEbitda'),
    grossMargin: weightedAverage('grossMargin'),
    operatingMargin: weightedAverage('operatingMargin'),
    netMargin: weightedAverage('netMargin'),
    roe: weightedAverage('roe'),
    roa: weightedAverage('roa'),
    currentRatio: weightedAverage('currentRatio'),
    quickRatio: weightedAverage('quickRatio'),
    debtToEquity: weightedAverage('debtToEquity'),
    totalCash: sum('totalCash'),
    totalDebt: sum('totalDebt'),
    dividendYield: weightedAverage('dividendYield'),
    payoutRatio: weightedAverage('payoutRatio'),
    ebitda: sum('ebitda'),
    enterpriseValue: sum('enterpriseValue'),
    bookValue: sum('bookValue'),
    totalAssets: sum('totalAssets'),
    totalEquity: sum('totalEquity'),
  };
}

export function formatMetricValue(value: string | number | null, format: string): string {
  if (value === null || value === undefined) return 'N/A';

  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toFixed(2)}`;
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}
