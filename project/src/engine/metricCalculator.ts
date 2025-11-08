import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric } from '../shared/types/types';
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
    const scope: { [key: string]: number } = {};
    for (const key in data) {
      if (typeof data[key] === 'number') {
        scope[key] = data[key] as number;
      }
    }

    const fieldNames = Object.keys(scope);
    const fieldValues = Object.values(scope);

    const safeEvaluator = new Function(...fieldNames, `return ${metric.formula}`);

    const result = safeEvaluator(...fieldValues);

    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch (error) {
    console.error(`Error calculating custom metric "${metric.name}":`, error);
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

  const aggregatedData: RawFinancialData = {
    ticker: group.id,
    name: group.name,
    industry: `Group of ${groupCompanies.length} companies`,
  };

  coreMetrics.forEach((metric: CoreMetric) => {
    const field = metric.id as keyof RawFinancialData;

    if (metric.aggregationMethod === 'sum') {
      aggregatedData[field] = sum(field);
    } else if (metric.aggregationMethod === 'weightedAverage') {
      aggregatedData[field] = weightedAverage(field);
    }
  });

  aggregatedData.marketCap = sum('marketCap');
  aggregatedData.price = weightedAverage('price');

  return aggregatedData;
}

export function formatMetricValue(value: string | number | null, format: string): string {
  if (value === null || value === undefined) return 'N/A';

  if (typeof value === 'string') return value;
  
  if (!isFinite(value)) return 'N/A';

  try {
    switch (format) {
      case 'currency':
        if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
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
  } catch (error) {
    console.error("Error formatting value:", value, error);
    return 'N/A';
  }
}
