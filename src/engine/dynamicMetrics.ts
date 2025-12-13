import { RawFinancialData, DynamicMetric } from '../shared/types/types';

function inferFormat(fieldName: string, value: number | string): 'currency' | 'percentage' | 'ratio' | 'number' | 'text' {
  const name = fieldName.toLowerCase();
  
  if (typeof value === 'string') {
    return 'text';
  }

  if (name.includes('percentage') || name.includes('percent') || name.includes('yield') || 
      name.includes('margin') || name.includes('ratio') && (name.includes('roe') || name.includes('roa'))) {
    return 'percentage';
  }

  if (name.includes('ratio') || name.includes('pe') || name.includes('pb') || 
      name.includes('ps') || name.includes('peg') || name.includes('ev') || 
      name.includes('debt') || name.includes('current') || name.includes('quick')) {
    return 'ratio';
  }

  if (name.includes('cap') || name.includes('price') || name.includes('revenue') || 
      name.includes('income') || name.includes('cash') || name.includes('debt') ||
      name.includes('assets') || name.includes('equity') || name.includes('value') ||
      name.includes('ebitda') || name.includes('book') || name.includes('eps') ||
      name.includes('change') || name.includes('high') || name.includes('low') ||
      name.includes('open') || name.includes('close') || name.includes('avg')) {
    return 'currency';
  }

  return 'number';
}

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

function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

export function generateDynamicMetrics(data: RawFinancialData): DynamicMetric[] {
  const metrics: DynamicMetric[] = [];
  const seenFields = new Set<string>(['ticker', 'name']);

  Object.keys(data).forEach(fieldName => {
    if (seenFields.has(fieldName)) return;
    
    const value = data[fieldName];
    if (value === undefined || value === null) return;
    
    seenFields.add(fieldName);
    
    const format = inferFormat(fieldName, value);
    const category = inferCategory(fieldName);
    const name = formatFieldName(fieldName);
    
    let aggregationMethod: 'sum' | 'weightedAverage' | undefined;
    const fieldLower = fieldName.toLowerCase();
    
    if (format === 'currency') {
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

  return metrics.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

export function getAllAvailableMetrics(dataSources: RawFinancialData[]): DynamicMetric[] {
  const allFields = new Map<string, DynamicMetric>();
  
  dataSources.forEach((data, index) => {
    if (!data || typeof data !== 'object') {
      return;
    }
    
    const metrics = generateDynamicMetrics(data);
    metrics.forEach(metric => {
      if (!allFields.has(metric.id)) {
        allFields.set(metric.id, metric);
      }
    });
  });
  
  return Array.from(allFields.values()).sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
}

