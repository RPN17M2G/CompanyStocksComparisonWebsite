import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric, DynamicMetric } from '../shared/types/types';
import { coreMetrics } from './coreMetrics';
import { getAllAvailableMetrics } from './dynamicMetrics';
import {
  sanitizeFieldName,
  sanitizeFormula,
  createFieldMapping,
  replaceFieldNamesInFormula,
  validateFormulaFields,
} from './formulaSanitizer';

/**
 * Parses a numeric value from a string or number, handling units like Billion, Million, K, etc.
 * Returns a number if successful, null if the value cannot be parsed as numeric.
 */
export function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // If it's already a number, return it (if finite)
  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Trim whitespace
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    // Try to parse as a direct number first
    const directNumber = parseFloat(trimmed);
    if (!isNaN(directNumber) && isFinite(directNumber)) {
      return directNumber;
    }

    // Remove currency symbols and commas
    let cleaned = trimmed.replace(/[\$,]/g, '').trim();
    
    // Extract the numeric part and unit
    // Match patterns like "1.5B", "500M", "100K", "2.5Billion", "1Million", "$1.5B", "1.5 B", etc.
    // Handle both full words and abbreviations, with optional spaces
    // Order: longer matches first (case-insensitive)
    const unitPattern = /^([+-]?\d+(?:\.\d+)?(?:\s*[eE][+-]?\d+)?)\s*(billion|million|thousand|trillion|bil|mil|thou|b|m|k|t)?\s*$/i;
    const unitMatch = cleaned.match(unitPattern);
    
    if (unitMatch) {
      const numericPart = parseFloat(unitMatch[1]);
      const unit = (unitMatch[2] || '').toLowerCase();

      if (isNaN(numericPart) || !isFinite(numericPart)) {
        return null;
      }

      // Apply multiplier based on unit
      let multiplier = 1;
      if (unit === 'b' || unit === 'billion' || unit === 'bil') {
        multiplier = 1e9;
      } else if (unit === 'm' || unit === 'million' || unit === 'mil') {
        multiplier = 1e6;
      } else if (unit === 'k' || unit === 'thousand' || unit === 'thou') {
        multiplier = 1e3;
      } else if (unit === 't' || unit === 'trillion') {
        multiplier = 1e12;
      }

      return numericPart * multiplier;
    }

    // Try to parse as a number after removing all non-numeric characters except decimal point, minus sign, and scientific notation
    const numericOnly = cleaned.replace(/[^\d.eE+-]/g, '');
    if (numericOnly !== '') {
      const parsed = parseFloat(numericOnly);
      if (!isNaN(parsed) && isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

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
    
    // Parse all numeric values from the data, handling units
    for (const key in data) {
      const parsedValue = parseNumericValue(data[key]);
      if (parsedValue !== null) {
        scope[key] = parsedValue;
      }
    }

    // If no numeric values found, return null
    if (Object.keys(scope).length === 0) {
      return null;
    }

    // Sanitize formula
    const sanitizedFormula = sanitizeFormula(metric.formula);
    if (!sanitizedFormula) {
      console.warn(`Custom metric "${metric.name}" has invalid formula:`, metric.formula);
      return null;
    }

    // Create field mapping (original name -> sanitized name)
    const originalFieldNames = Object.keys(scope);
    const fieldMapping = createFieldMapping(originalFieldNames);
    
    // Replace field names in formula with sanitized versions
    let finalFormula = replaceFieldNamesInFormula(sanitizedFormula, fieldMapping);
    
    // Validate that all fields in formula are available
    const validation = validateFormulaFields(finalFormula, fieldMapping);
    if (!validation.valid) {
      console.warn(
        `Custom metric "${metric.name}" formula references unknown fields:`,
        validation.missingFields.join(', ')
      );
      return null;
    }

    // Create sanitized scope with sanitized field names
    const sanitizedScope: { [key: string]: number } = {};
    originalFieldNames.forEach(originalName => {
      const sanitized = fieldMapping.get(originalName);
      if (sanitized) {
        sanitizedScope[sanitized] = scope[originalName];
      }
    });

    // Get sanitized field names and values in the same order
    const sanitizedFieldNames = Object.keys(sanitizedScope);
    const sanitizedFieldValues = Object.values(sanitizedScope);

    if (sanitizedFieldNames.length === 0) {
      return null;
    }

    // Create a safe evaluator with sanitized field names
    // The formula has already been sanitized and field names replaced
    const safeEvaluator = new Function(...sanitizedFieldNames, `return (${finalFormula})`);

    const result = safeEvaluator(...sanitizedFieldValues);

    // Validate result is a number
    if (typeof result !== 'number' || !isFinite(result)) {
      console.warn(`Custom metric "${metric.name}" returned non-numeric result:`, result);
      return null;
    }

    return result;
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
        return value.toLocaleString();;
      default:
        return value.toString();
    }
  } catch (error) {
    console.error("Error formatting value:", value, error);
    return null;
  }
}
