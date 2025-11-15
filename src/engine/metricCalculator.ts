import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric, DynamicMetric } from '../shared/types/types';
import { coreMetrics } from './coreMetrics';
import { getAllAvailableMetrics } from './dynamicMetrics';

export function calculateCoreMetric(metricId: string, data: RawFinancialData): string | number | null {
  const legacyMetric = coreMetrics.find(m => m.id === metricId);
  if (legacyMetric) {
    return legacyMetric.calculate(data);
  }
  
  const value = data[metricId];
  if (value === undefined || value === null) {
    return null;
  }
  
  return value;
}

export function calculateDynamicMetric(metric: DynamicMetric, data: RawFinancialData): string | number | null {
  const value = data[metric.id];
  if (value === undefined || value === null) {
    return null;
  }
  return value;
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
  const marketCaps = validData
    .map(d => {
      const mc = d.marketCap;
      return typeof mc === 'number' ? mc : 0;
    })
    .filter(m => m > 0);
  const totalMarketCap = marketCaps.reduce((sum, mc) => sum + mc, 0);

  const weightedAverage = (field: keyof RawFinancialData): number | undefined => {
    if (totalMarketCap === 0) return undefined;
    let weightedSum = 0;
    let validWeights = 0;

    validData.forEach(d => {
      const value = d[field];
      const mc = d.marketCap || 0;
      if (typeof value === 'number' && typeof mc === 'number' && mc > 0) {
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

  const aggregatedData: Partial<RawFinancialData> = {
    ticker: group.id,
    name: group.name,
    industry: `Group of ${groupCompanies.length} companies`,
  };

  const allMetrics = getAllAvailableMetrics(validData);
  
  allMetrics.forEach((metric) => {
    const field = metric.id as keyof RawFinancialData;
    let value: number | string | undefined;

    if (metric.aggregationMethod === 'sum') {
      value = sum(field);
    } else if (metric.aggregationMethod === 'weightedAverage') {
      value = weightedAverage(field);
    } else {
      // Default: try weighted average for ratios/percentages, sum for currency
      if (metric.format === 'ratio' || metric.format === 'percentage') {
        value = weightedAverage(field);
      } else if (metric.format === 'currency') {
        value = sum(field);
      }
    }

    // Only add field if it has a value
    if (value !== undefined) {
      aggregatedData[field] = value;
    }
  });
  
  // Also aggregate legacy core metrics for backward compatibility
  coreMetrics.forEach((metric: CoreMetric) => {
    const field = metric.id as keyof RawFinancialData;
    if (aggregatedData[field] !== undefined) return; // Already aggregated
    
    let value: number | string | undefined;
    if (metric.aggregationMethod === 'sum') {
      value = sum(field);
    } else if (metric.aggregationMethod === 'weightedAverage') {
      value = weightedAverage(field);
    }

    if (value !== undefined) {
      aggregatedData[field] = value;
    }
  });

  // Add market cap and price if they have values
  const marketCapValue = sum('marketCap');
  const priceValue = weightedAverage('price');
  if (marketCapValue !== undefined) {
    aggregatedData.marketCap = marketCapValue;
  }
  if (priceValue !== undefined) {
    aggregatedData.price = priceValue;
  }

  return aggregatedData as RawFinancialData;
}

export function formatMetricValue(value: string | number | null, format: string): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') return value;
  
  if (!isFinite(value)) return null;

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
    return null;
  }
}
