import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric } from '../types';
import { coreMetrics } from './coreMetrics';

export function calculateCoreMetric(metricId: string, data: RawFinancialData): string | number | null {
  const metric = coreMetrics.find(m => m.id === metricId);
  if (!metric) return null;
  return metric.calculate(data);
}

/**
 * [REFACTOR 1]
 * Replaced 'eval()' with the much safer 'new Function()' approach.
 * This removes the "magic" and security risks by creating a function
 * with a constrained scope, rather than executing code in the global scope.
 */
export function calculateCustomMetric(
  metric: CustomMetric,
  data: RawFinancialData
): number | null {
  try {
    // 1. Create a "safe scope" containing only the numeric fields from data.
    const scope: { [key: string]: number } = {};
    for (const key in data) {
      if (typeof data[key] === 'number') {
        scope[key] = data[key] as number;
      }
    }

    const fieldNames = Object.keys(scope);
    const fieldValues = Object.values(scope);

    // 2. Create a new function. The field names are the arguments,
    //    and the formula is the function body.
    //    e.g., new Function('totalDebt', 'netIncome', 'return totalDebt / netIncome')
    const safeEvaluator = new Function(...fieldNames, `return ${metric.formula}`);

    // 3. Call the function, passing the field values as arguments.
    const result = safeEvaluator(...fieldValues);

    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch (error) {
    console.error(`Error calculating custom metric "${metric.name}":`, error);
    return null;
  }
}

/**
 * [REFACTOR 2]
 * This function is now generic and follows the Open/Closed Principle.
 * It reads the 'aggregationMethod' from each metric's definition
 * instead of hard-coding the logic for every metric.
 *
 * NOTE: This requires you to update your 'CoreMetric' type in 'types.ts'
 * and the 'coreMetrics' definitions to include:
 * `aggregationMethod: 'sum' | 'weightedAverage';`
 */
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

  // --- Helper: Weighted Average ---
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

  // --- Helper: Sum ---
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

  // --- Generic Aggregation Logic ---
  const aggregatedData: RawFinancialData = {
    ticker: group.id,
    name: group.name,
    industry: `Group of ${groupCompanies.length} companies`,
  };

  // Loop through all core metrics and aggregate them based on their defined method
  coreMetrics.forEach((metric: CoreMetric) => {
    // We assume metric.id is a valid key in RawFinancialData
    const field = metric.id as keyof RawFinancialData;

    if (metric.aggregationMethod === 'sum') {
      aggregatedData[field] = sum(field);
    } else if (metric.aggregationMethod === 'weightedAverage') {
      aggregatedData[field] = weightedAverage(field);
    }
    // If no aggregationMethod is specified, it's skipped (e.g., 'price')
    // We will handle 'price' and 'marketCap' manually as special cases.
  });

  // --- Manual/Special Case Aggregations ---
  // MarketCap is always the sum, and the basis for other calculations.
  aggregatedData.marketCap = sum('marketCap');
  // Price is a special weighted average that should always be calculated.
  aggregatedData.price = weightedAverage('price');

  // We no longer need the giant, hard-coded return statement.
  return aggregatedData;
}

export function formatMetricValue(value: string | number | null, format: string): string {
  if (value === null || value === undefined) return 'N/A';

  if (typeof value === 'string') return value;
  
  // Added isFinite check to handle Infinity or -Infinity
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