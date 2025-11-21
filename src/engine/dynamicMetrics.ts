import { RawFinancialData, DynamicMetric } from '../shared/types/types';

/**
 * Infers the format type for a field based on its name and value
 */
function inferFormat(fieldName: string, value: number | string): 'currency' | 'percentage' | 'ratio' | 'number' | 'text' {
  const name = fieldName.toLowerCase();
  
  if (typeof value === 'string') {
    return 'text';
  }

  // Percentage indicators
  if (name.includes('percentage') || name.includes('percent') || name.includes('yield') || 
      name.includes('margin') || name.includes('ratio') && (name.includes('roe') || name.includes('roa'))) {
    return 'percentage';
  }

  // Ratio indicators
  if (name.includes('ratio') || name.includes('pe') || name.includes('pb') || 
      name.includes('ps') || name.includes('peg') || name.includes('ev') || 
      name.includes('debt') || name.includes('current') || name.includes('quick')) {
    return 'ratio';
  }

  // Currency indicators
  if (name.includes('cap') || name.includes('price') || name.includes('revenue') || 
      name.includes('income') || name.includes('cash') || name.includes('debt') ||
      name.includes('assets') || name.includes('equity') || name.includes('value') ||
      name.includes('ebitda') || name.includes('book') || name.includes('eps') ||
      name.includes('change') || name.includes('high') || name.includes('low') ||
      name.includes('open') || name.includes('close') || name.includes('avg')) {
    return 'currency';
  }

  // Default to number for other numeric values
  return 'number';
}

/**
 * Infers the category for a field based on its name
 */
function inferCategory(fieldName: string): string {
  const name = fieldName.toLowerCase();
  
  if (name.includes('ticker') || name.includes('symbol') || name.includes('name') || 
      name.includes('exchange') || name.includes('industry') || name.includes('sector')) {
    return 'Basic Information';
  }
  
  if (name.includes('price') || name.includes('cap') || name.includes('value') || 
      name.includes('pe') || name.includes('pb') || name.includes('ps') || 
      name.includes('peg') || name.includes('ev')) {
    return 'Valuation';
  }
  
  if (name.includes('margin') || name.includes('roe') || name.includes('roa') || 
      name.includes('profit') || name.includes('income')) {
    return 'Profitability';
  }
  
  if (name.includes('growth') || name.includes('change')) {
    return 'Growth';
  }
  
  if (name.includes('ratio') || name.includes('debt') || name.includes('cash') || 
      name.includes('assets') || name.includes('equity') || name.includes('current') || 
      name.includes('quick') || name.includes('liquidity')) {
    return 'Financial Health';
  }
  
  if (name.includes('dividend') || name.includes('payout')) {
    return 'Dividends';
  }
  
  if (name.includes('volume') || name.includes('timestamp') || name.includes('date') ||
      name.includes('high') || name.includes('low') || name.includes('open') ||
      name.includes('close') || name.includes('avg')) {
    return 'Market Data';
  }
  
  return 'Other';
}

/**
 * Converts a field name to a human-readable name
 */
function formatFieldName(fieldName: string): string {
  // Handle camelCase and snake_case
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

/**
 * Generates dynamic metrics from all available fields in the data
 */
export function generateDynamicMetrics(data: RawFinancialData): DynamicMetric[] {
  const metrics: DynamicMetric[] = [];
  const seenFields = new Set<string>(['ticker', 'name']); // Skip required fields

  Object.keys(data).forEach(fieldName => {
    if (seenFields.has(fieldName)) return;
    
    const value = data[fieldName];
    if (value === undefined || value === null) return;
    
    seenFields.add(fieldName);
    
    const format = inferFormat(fieldName, value);
    const category = inferCategory(fieldName);
    const name = formatFieldName(fieldName);
    
    // Determine aggregation method based on field type
    let aggregationMethod: 'sum' | 'weightedAverage' | undefined;
    const fieldLower = fieldName.toLowerCase();
    
    if (format === 'currency') {
      // Sum for totals, weighted average for ratios/prices
      if (fieldLower.includes('cap') || fieldLower.includes('revenue') || 
          fieldLower.includes('income') || fieldLower.includes('assets') || 
          fieldLower.includes('debt') || fieldLower.includes('equity') ||
          fieldLower.includes('cash') || fieldLower.includes('value')) {
        aggregationMethod = 'sum';
      } else if (fieldLower.includes('price') || fieldLower.includes('avg')) {
        aggregationMethod = 'weightedAverage';
      }
    } else if (format === 'ratio' || format === 'percentage') {
      aggregationMethod = 'weightedAverage';
    }
    
    metrics.push({
      id: fieldName,
      name,
      category,
      format,
      aggregationMethod,
    });
  });

  // Sort by category, then by name
  return metrics.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets all available metrics from multiple data sources (all companies in comparison)
 * This collects ALL unique field names from ALL companies to ensure a complete comparison
 */
export function getAllAvailableMetrics(dataSources: RawFinancialData[]): DynamicMetric[] {
  const allFields = new Map<string, DynamicMetric>();
  
  // Process each company's data to collect all unique metrics
  dataSources.forEach((data, index) => {
    if (!data || typeof data !== 'object') {
      return; // Skip invalid data
    }
    
    const metrics = generateDynamicMetrics(data);
    metrics.forEach(metric => {
      // Collect all unique field names from all companies
      // If a field appears in multiple companies, use the first occurrence for format/category
      // but ensure the field is included even if only one company has it
      if (!allFields.has(metric.id)) {
        allFields.set(metric.id, metric);
      }
    });
  });
  
  // Return sorted metrics (by category, then by name)
  return Array.from(allFields.values()).sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

