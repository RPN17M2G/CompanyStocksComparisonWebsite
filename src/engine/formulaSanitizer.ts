/**
 * Formula Sanitizer
 * 
 * Sanitizes formulas and field names for safe JavaScript evaluation.
 * Ensures that field names are valid JavaScript identifiers and formulas
 * are safe to evaluate.
 */

/**
 * Checks if a string is a valid JavaScript identifier
 */
function isValidIdentifier(name: string): boolean {
  if (!name || name.length === 0) return false;
  
  // JavaScript identifier rules:
  // - Must start with letter, $, or _
  // - Can contain letters, digits, $, or _
  // - Cannot be a reserved keyword
  const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!identifierRegex.test(name)) return false;
  
  // Check if it's a reserved keyword
  const reservedKeywords = [
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
    'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return',
    'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'let', 'static', 'enum', 'implements',
    'interface', 'package', 'private', 'protected', 'public', 'abstract',
    'boolean', 'byte', 'char', 'double', 'final', 'float', 'goto', 'int',
    'long', 'native', 'short', 'synchronized', 'transient', 'volatile',
    'arguments', 'eval', 'undefined', 'null', 'true', 'false', 'NaN',
    'Infinity', 'console', 'window', 'document', 'global', 'process'
  ];
  
  return !reservedKeywords.includes(name);
}

/**
 * Sanitizes a field name to make it a valid JavaScript identifier
 * Returns a sanitized identifier or null if it cannot be sanitized
 */
export function sanitizeFieldName(fieldName: string): string | null {
  if (!fieldName || typeof fieldName !== 'string') {
    return null;
  }

  // If it's already a valid identifier, return it
  if (isValidIdentifier(fieldName)) {
    return fieldName;
  }

  // Try to sanitize by:
  // 1. Removing all non-alphanumeric characters except $ and _
  // 2. Ensuring it starts with a letter, $, or _
  // 3. Replacing invalid characters with underscore
  
  let sanitized = fieldName.trim();
  
  // Remove leading numbers (can't start with a number)
  sanitized = sanitized.replace(/^[0-9]+/, '');
  
  // Replace invalid characters with underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9_$]/g, '_');
  
  // Ensure it starts with letter, $, or _
  if (!/^[a-zA-Z_$]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  
  // Remove consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Ensure it's not empty
  if (!sanitized || sanitized.length === 0) {
    return null;
  }
  
  // Check again if it's valid
  if (isValidIdentifier(sanitized)) {
    return sanitized;
  }
  
  // Final fallback: prefix with underscore
  return '_' + sanitized.replace(/[^a-zA-Z0-9_$]/g, '');
}

/**
 * Sanitizes a formula string to ensure it's safe to evaluate
 * Returns the sanitized formula or null if it's invalid
 */
export function sanitizeFormula(formula: string): string | null {
  if (!formula || typeof formula !== 'string') {
    return null;
  }

  const trimmed = formula.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // Remove any comments (single-line and multi-line)
  let sanitized = trimmed
    .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
    .replace(/\/\/.*$/gm, '') // Single-line comments
    .trim();

  if (sanitized.length === 0) {
    return null;
  }

  // Check for dangerous patterns that could execute arbitrary code
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /new\s+Function/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /import\s*\(/i,
    /require\s*\(/i,
    /with\s*\(/i,
    /constructor/i,
    /prototype/i,
    /__proto__/i,
    /process\./i,
    /global\./i,
    /window\./i,
    /document\./i,
    /console\./i,
    /\.call\s*\(/i,
    /\.apply\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return null; // Reject dangerous formulas
    }
  }

  // Check for valid JavaScript expression characters
  // Allow: numbers, operators, parentheses, brackets, field names, whitespace
  const validChars = /^[\s\w+\-*/().,\[\]^%!<>=&|?$:'"]+$/;
  if (!validChars.test(sanitized)) {
    // Check if it contains only safe mathematical expressions
    const safeExpression = /^[\s\w+\-*/().,\[\]^%!<>=&|?$:]+$/;
    if (!safeExpression.test(sanitized.replace(/"([^"]*)"/g, '').replace(/'([^']*)'/g, ''))) {
      return null;
    }
  }

  return sanitized;
}

/**
 * Creates a safe mapping between original field names and sanitized identifiers
 */
export function createFieldMapping(
  fieldNames: string[]
): Map<string, string> {
  const mapping = new Map<string, string>();
  const usedNames = new Set<string>();
  
  fieldNames.forEach(originalName => {
    if (!originalName || typeof originalName !== 'string') {
      return;
    }
    
    let sanitized = sanitizeFieldName(originalName);
    
    // If sanitization failed, skip this field
    if (!sanitized) {
      return;
    }
    
    // Ensure uniqueness by appending number if needed
    let finalName = sanitized;
    let counter = 1;
    while (usedNames.has(finalName)) {
      finalName = `${sanitized}_${counter}`;
      counter++;
    }
    
    usedNames.add(finalName);
    mapping.set(originalName, finalName);
  });
  
  return mapping;
}

/**
 * Replaces field names in a formula with their sanitized versions
 */
export function replaceFieldNamesInFormula(
  formula: string,
  fieldMapping: Map<string, string>
): string {
  let replaced = formula;
  
  // Sort field names by length (longest first) to avoid partial replacements
  // This ensures "debtToEquity" is replaced before "debt"
  const sortedNames = Array.from(fieldMapping.keys()).sort((a, b) => b.length - a.length);
  
  for (const originalName of sortedNames) {
    const sanitized = fieldMapping.get(originalName);
    if (sanitized && originalName !== sanitized) {
      // Use word boundary to avoid partial matches
      // This ensures we don't replace "debt" inside "debtToEquity"
      // But we do want to replace standalone identifiers
      const regex = new RegExp(
        `\\b${escapeRegex(originalName)}\\b`,
        'g'
      );
      replaced = replaced.replace(regex, sanitized);
    }
  }
  
  return replaced;
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates that all field names in a formula are in the mapping
 */
export function validateFormulaFields(
  formula: string,
  fieldMapping: Map<string, string>
): { valid: boolean; missingFields: string[] } {
  // Extract potential field names from formula
  // This is a simple regex that finds word-like identifiers
  const wordPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
  const matches = formula.match(wordPattern) || [];
  
  const missingFields: string[] = [];
  const knownFields = new Set(Array.from(fieldMapping.keys()));
  
  // Common JavaScript keywords to ignore
  const keywords = new Set([
    'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new',
    'this', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'typeof', 'instanceof', 'in', 'void', 'delete', 'Math', 'Number',
    'String', 'Boolean', 'Array', 'Object', 'Date', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite', 'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow',
    'max', 'min', 'log', 'exp', 'sin', 'cos', 'tan'
  ]);
  
  for (const match of matches) {
    // Skip if it's a keyword
    if (keywords.has(match)) {
      continue;
    }
    
    // Skip if it's a number
    if (/^\d+/.test(match)) {
      continue;
    }
    
    // Check if this field exists in our mapping
    const found = Array.from(fieldMapping.keys()).some(original => {
      const sanitized = fieldMapping.get(original);
      return original === match || sanitized === match;
    });
    
    if (!found && !missingFields.includes(match)) {
      missingFields.push(match);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

