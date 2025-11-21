import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric, DynamicMetric } from '../shared/types/types';
import { coreMetrics } from './coreMetrics';
import { getAllAvailableMetrics } from './dynamicMetrics';
import {
  sanitizeFormula,
  createFieldMapping,
  replaceFieldNamesInFormula,
  validateFormulaFields,
} from './formulaSanitizer';

/**
 * Normalizes a field name for comparison by removing spaces, special chars, and converting to lowercase
 */
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
}

/**
 * Tries to find a matching field in the data when exact match fails
 * This handles cases where field names differ (e.g., "currentRatio" vs "Financials Metric Current Ratio Annual")
 */
function findMatchingField(
  metricId: string,
  metricName: string,
  data: RawFinancialData
): string | number | null {
  // Normalize the metric identifier and name for comparison
  const normalizedMetricId = normalizeFieldName(metricId);
  const normalizedMetricName = normalizeFieldName(metricName);
  
  // Extract key words from metric name (e.g., "Current Ratio" -> ["current", "ratio"])
  const metricWords = normalizedMetricName.length > normalizedMetricId.length 
    ? normalizedMetricName.match(/\w+/g) || []
    : normalizedMetricId.match(/\w+/g) || [];
  
  // If we have a very short pattern, use the full normalized string
  const searchPattern = metricWords.length > 0 && metricWords.join('').length > 3
    ? metricWords.join('')
    : normalizedMetricId;
  
  let bestMatch: { fieldName: string; value: any; score: number } | null = null;
  
  // Try to find a field that matches
  for (const fieldName in data) {
    if (data.hasOwnProperty(fieldName)) {
      const normalizedField = normalizeFieldName(fieldName);
      const value = data[fieldName];
      
      if (value === undefined || value === null) {
        continue;
      }
      
      // Exact match gets highest priority
      if (normalizedField === normalizedMetricId || normalizedField === normalizedMetricName) {
        return value;
      }
      
      // Check if field contains the search pattern (e.g., "currentratio" in "financialsmetriccurrentratioannual")
      if (normalizedField.includes(searchPattern) || searchPattern.includes(normalizedField)) {
        // Score based on how close the match is (prefer shorter field names that match)
        const score = searchPattern.length / normalizedField.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { fieldName, value, score };
        }
      }
      
      // Also check if all key words from metric name are present in field name
      if (metricWords.length > 0) {
        const allWordsMatch = metricWords.every(word => normalizedField.includes(word));
        if (allWordsMatch) {
          const score = metricWords.join('').length / normalizedField.length;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { fieldName, value, score };
          }
        }
      }
    }
  }
  
  return bestMatch ? bestMatch.value : null;
}

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
    // Try the legacy metric's calculate function first
    const result = legacyMetric.calculate(data);
    if (result !== null && result !== undefined) {
      return result;
    }
    
    // If legacy metric returns null, try to find a matching field in the data
    // This handles cases where the field exists but with a different name
    return findMatchingField(metricId, legacyMetric.name, data);
  }
  
  // Try exact match first
  const value = data[metricId];
  if (value !== undefined && value !== null) {
    return value;
  }
  
  // If exact match fails, try to find a matching field
  return findMatchingField(metricId, metricId, data);
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
    // Handle empty or invalid format strings
    const normalizedFormat = (format || '').trim().toLowerCase();
    
    switch (normalizedFormat) {
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
      case 'text':
        return value.toString();
      default:
        // For unknown formats, try to format as number as fallback
        return value.toLocaleString();
    }
  } catch (error) {
    console.error("Error formatting value:", value, "format:", format, error);
    // Fallback: try to return a string representation
    try {
      return value.toString();
    } catch {
      return null;
    }
  }
}
