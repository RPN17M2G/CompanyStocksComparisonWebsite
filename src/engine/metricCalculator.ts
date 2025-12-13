import { RawFinancialData, CustomMetric, ComparisonGroup, Company, CoreMetric, DynamicMetric } from '../shared/types/types';
import { coreMetrics } from './coreMetrics';
import { getAllAvailableMetrics } from './dynamicMetrics';
import {
  sanitizeFormula,
  createFieldMapping,
  replaceFieldNamesInFormula,
  validateFormulaFields,
} from './formulaSanitizer';

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
  const normalizedMetricId = normalizeFieldName(metricId);
  const normalizedMetricName = normalizeFieldName(metricName);
  
  const metricWords = normalizedMetricName.length > normalizedMetricId.length 
    ? normalizedMetricName.match(/\w+/g) || []
    : normalizedMetricId.match(/\w+/g) || [];
  
  const searchPattern = metricWords.length > 0 && metricWords.join('').length > 3
    ? metricWords.join('')
    : normalizedMetricId;
  
  let bestMatch: { fieldName: string; value: any; score: number } | null = null;
  
  for (const fieldName in data) {
    if (data.hasOwnProperty(fieldName)) {
      const normalizedField = normalizeFieldName(fieldName);
      const value = data[fieldName];
      
      if (value === undefined || value === null) {
        continue;
      }
      
      if (normalizedField === normalizedMetricId || normalizedField === normalizedMetricName) {
        return value;
      }
      
      if (normalizedField.includes(searchPattern) || searchPattern.includes(normalizedField)) {
        const score = searchPattern.length / normalizedField.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { fieldName, value, score };
        }
      }
      
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

export function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const directNumber = parseFloat(trimmed);
    if (!isNaN(directNumber) && isFinite(directNumber)) {
      return directNumber;
    }

    let cleaned = trimmed.replace(/[\$,]/g, '').trim();
    
    const unitPattern = /^([+-]?\d+(?:\.\d+)?(?:\s*[eE][+-]?\d+)?)\s*(billion|million|thousand|trillion|bil|mil|thou|b|m|k|t)?\s*$/i;
    const unitMatch = cleaned.match(unitPattern);
    
    if (unitMatch) {
      const numericPart = parseFloat(unitMatch[1]);
      const unit = (unitMatch[2] || '').toLowerCase();

      if (isNaN(numericPart) || !isFinite(numericPart)) {
        return null;
      }

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
    const result = legacyMetric.calculate(data);
    if (result !== null && result !== undefined) {
      return result;
    }
    
    return findMatchingField(metricId, legacyMetric.name, data);
  }
  
  const value = data[metricId];
  if (value !== undefined && value !== null) {
    return value;
  }
  
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
    
    for (const key in data) {
      const parsedValue = parseNumericValue(data[key]);
      if (parsedValue !== null) {
        scope[key] = parsedValue;
      }
    }

    if (Object.keys(scope).length === 0) {
      return null;
    }

    const sanitizedFormula = sanitizeFormula(metric.formula);
    if (!sanitizedFormula) {
      console.warn(`Custom metric "${metric.name}" has invalid formula:`, metric.formula);
      return null;
    }

    const originalFieldNames = Object.keys(scope);
    const fieldMapping = createFieldMapping(originalFieldNames);
    
    let finalFormula = replaceFieldNamesInFormula(sanitizedFormula, fieldMapping);
    
    const validation = validateFormulaFields(finalFormula, fieldMapping);
    if (!validation.valid) {
      console.warn(
        `Custom metric "${metric.name}" formula references unknown fields:`,
        validation.missingFields.join(', ')
      );
      return null;
    }

    const sanitizedScope: { [key: string]: number } = {};
    originalFieldNames.forEach(originalName => {
      const sanitized = fieldMapping.get(originalName);
      if (sanitized) {
        sanitizedScope[sanitized] = scope[originalName];
      }
    });

    const sanitizedFieldNames = Object.keys(sanitizedScope);
    const sanitizedFieldValues = Object.values(sanitizedScope);

    if (sanitizedFieldNames.length === 0) {
      return null;
    }

    const safeEvaluator = new Function(...sanitizedFieldNames, `return (${finalFormula})`);

    const result = safeEvaluator(...sanitizedFieldValues);

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
      if (metric.format === 'ratio' || metric.format === 'percentage') {
        value = weightedAverage(field);
      } else if (metric.format === 'currency') {
        value = sum(field);
      }
    }

    if (value !== undefined) {
      aggregatedData[field] = value;
    }
  });
  
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
        return value.toLocaleString();
    }
  } catch (error) {
    console.error("Error formatting value:", value, "format:", format, error);
    try {
      return value.toString();
    } catch {
      return null;
    }
  }
}
