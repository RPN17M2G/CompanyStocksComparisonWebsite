import { RawFinancialData } from '../shared/types/types';

/**
 * Common values that should be treated as null/undefined
 */
const NULL_VALUES = ['N/A', 'None', '-', '', null, undefined];

/**
 * Parses a value to a number if possible, otherwise returns undefined
 */
function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? undefined : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (NULL_VALUES.includes(trimmed)) return undefined;
    const num = parseFloat(trimmed);
    return isNaN(num) || !isFinite(num) ? undefined : num;
  }
  return undefined;
}

/**
 * Parses a value to a string if possible, otherwise returns undefined
 */
function parseString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return NULL_VALUES.includes(trimmed) ? undefined : trimmed;
  }
  // Convert other types to string
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

/**
 * Checks if a value should be included in the output
 */
function isValidValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && NULL_VALUES.includes(value.trim())) return false;
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Skip empty objects
    return Object.keys(value).length > 0;
  }
  return true;
}

/**
 * Recursively flattens nested objects with optional prefix
 */
function flattenObject(obj: any, prefix: string = '', maxDepth: number = 2, currentDepth: number = 0): Record<string, any> {
  if (currentDepth >= maxDepth || !obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }

  const flattened: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      return; // Skip null/undefined
    }

    if (Array.isArray(value)) {
      // For arrays, take the first element if it's an object, otherwise skip
      if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
        const nested = flattenObject(value[0], newKey, maxDepth, currentDepth + 1);
        Object.assign(flattened, nested);
      }
    } else if (typeof value === 'object') {
      // Recursively flatten nested objects
      const nested = flattenObject(value, newKey, maxDepth, currentDepth + 1);
      Object.assign(flattened, nested);
    } else {
      // Primitive value
      flattened[newKey] = value;
    }
  });

  return flattened;
}

/**
 * Transforms API response data into RawFinancialData by capturing ALL fields
 * This is completely generic and future-proof - any new fields will be automatically included
 */
export function transformApiData(
  data: any,
  options: {
    tickerField?: string | string[];
    nameField?: string | string[];
    excludeFields?: string[];
    prefixFields?: Record<string, string>; // Map of source keys to prefixes
    flattenNested?: boolean;
  } = {}
): RawFinancialData {
  const {
    tickerField = ['symbol', 'ticker', 'Symbol', 'Ticker'],
    nameField = ['name', 'companyName', 'Name', 'CompanyName'],
    excludeFields = [],
    prefixFields = {},
    flattenNested = true,
  } = options;

  const result: any = {};

  // Helper to find a field value by trying multiple possible field names
  const findField = (fields: string | string[], data: any): string | undefined => {
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    for (const field of fieldArray) {
      if (data[field] !== undefined && data[field] !== null) {
        return parseString(data[field]);
      }
    }
    return undefined;
  };

  result.ticker = findField(tickerField, data) || '';
  result.name = findField(nameField, data) || result.ticker;

  const flatData = flattenNested ? flattenObject(data, '', 2) : data;

  const sourceData = flattenNested ? { ...data, ...flatData } : data;
  
  Object.keys(sourceData).forEach(key => {
    if (
      excludeFields.includes(key) ||
      tickerField.includes(key) ||
      nameField.includes(key) ||
      key === 'Error Message' ||
      key === 'Note'
    ) {
      return;
    }

    const value = sourceData[key];
    
    if (!isValidValue(value)) {
      return;
    }

    const outputKey = prefixFields[key] ? `${prefixFields[key]}_${key}` : key;

    if (typeof value === 'number') {
      const parsed = parseNumber(value);
      if (parsed !== undefined) {
        result[outputKey] = parsed;
      }
    } else if (typeof value === 'string') {
      const parsed = parseString(value);
      if (parsed !== undefined) {
        const numParsed = parseNumber(value);
        result[outputKey] = numParsed !== undefined ? numParsed : parsed;
      }
    } else if (typeof value === 'boolean') {
      result[outputKey] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === 'object' && !Array.isArray(value[0])) {
        const nested = flattenObject(value[0], outputKey, 1);
        Object.assign(result, nested);
      } else if (typeof value[0] === 'number' || typeof value[0] === 'string') {
        const firstValue = value[0];
        const parsed = typeof firstValue === 'number' 
          ? parseNumber(firstValue)
          : parseString(firstValue);
        if (parsed !== undefined) {
          result[outputKey] = parsed;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const nested = flattenObject(value, outputKey, 1);
      Object.assign(result, nested);
    }
  });

  return result as RawFinancialData;
}

/**
 * Merges multiple API responses into a single RawFinancialData object
 * Automatically handles field name conflicts by using prefixes
 */
export function mergeApiResponses(
  responses: Array<{ data: any; prefix?: string; excludeFields?: string[] }>
): RawFinancialData {
  const merged: any = {};
  let ticker = '';
  let name = '';

  responses.forEach(({ data, prefix = '', excludeFields = [] }) => {
    if (!data) return;

    const transformed = transformApiData(data, {
      excludeFields,
    });

    if (!ticker && transformed.ticker) {
      ticker = transformed.ticker;
    }
    if (!name && transformed.name) {
      name = transformed.name;
    }

    Object.keys(transformed).forEach(key => {
      if (key === 'ticker' || key === 'name') return;
      
      const outputKey = prefix ? `${prefix}_${key}` : key;
      
      if (merged[outputKey] !== undefined && merged[outputKey] !== transformed[key]) {
        merged[`${prefix}_${key}`] = transformed[key];
      } else {
        merged[outputKey] = transformed[key];
      }
    });
  });

  return {
    ticker: ticker || '',
    name: name || ticker,
    ...merged,
  } as RawFinancialData;
}

