import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  Theme,
  SxProps,
} from '@mui/material';
import { CustomMetric, RawFinancialData } from '../../shared/types/types';
import { getAllAvailableMetrics } from '../../engine/dynamicMetrics';
import { parseNumericValue } from '../../engine/metricCalculator';
import {
  sanitizeFormula,
  sanitizeFieldName,
  createFieldMapping,
  replaceFieldNamesInFormula,
  validateFormulaFields,
} from '../../engine/formulaSanitizer';

const glassyChipSx: SxProps<Theme> = {
  cursor: 'pointer',
  backgroundColor: (theme) => 
    theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.1)',
  backdropFilter: 'blur(5px)',
  color: (theme) =>
    theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
  fontWeight: 'medium',
  borderRadius: 2,
  border: '1px solid',
  borderColor: (theme) => 
    theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.3)',
  '&:hover': {
    backgroundColor: (theme) => 
      theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.2)',
  }
};

const formFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme) => 
      theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  '& .MuiInputLabel-root': {
    color: (theme) => theme.palette.text.secondary,
  }
};

// --- Component Props ---
interface MetricCreatorFormProps {
  onAddMetric: (metric: CustomMetric) => void;
  onCancel: () => void;
  availableData?: RawFinancialData[]; // Optional: provide actual company data to get dynamic fields
  initialMetric?: CustomMetric; // Optional: metric to edit
}

export function MetricCreatorForm({ onAddMetric, onCancel, availableData = [], initialMetric }: MetricCreatorFormProps) {
  const [metricName, setMetricName] = useState(initialMetric?.name || '');
  const [formula, setFormula] = useState(initialMetric?.formula || '');
  const [format, setFormat] = useState<'currency' | 'percentage' | 'ratio' | 'number'>(
    initialMetric?.format || 'ratio'
  );
  const [betterDirection, setBetterDirection] = useState<'higher' | 'lower' | undefined>(
    initialMetric?.betterDirection
  );
  const [priority, setPriority] = useState<number>(initialMetric?.priority || 5);
  const [formulaError, setFormulaError] = useState<string | null>(null);

  // Update form when initialMetric changes
  useEffect(() => {
    if (initialMetric) {
      setMetricName(initialMetric.name);
      setFormula(initialMetric.formula);
      setFormat(initialMetric.format);
      setBetterDirection(initialMetric.betterDirection);
      setPriority(initialMetric.priority || 5);
      setFormulaError(null); // Clear any previous errors
    } else {
      setMetricName('');
      setFormula('');
      setFormat('ratio');
      setBetterDirection(undefined);
      setPriority(5);
      setFormulaError(null); // Clear any previous errors
    }
  }, [initialMetric]);

  // Dynamically get available fields from actual company data (only numeric fields)
  const availableFields = useMemo(() => {
    if (availableData && availableData.length > 0) {
      const allFields = new Set<string>();
      availableData.forEach(data => {
        Object.keys(data).forEach(key => {
          // Only include fields that can be parsed as numeric
          const parsedValue = parseNumericValue(data[key]);
          if (parsedValue !== null) {
            allFields.add(key);
          }
        });
      });
      return Array.from(allFields).sort();
    }
    // Fallback to empty array if no data provided
    return [];
  }, [availableData]);

  // Validate formula
  const validateFormula = useCallback((formulaText: string): string | null => {
    if (!formulaText.trim()) {
      return null; // Empty is fine, will be caught by required validation
    }

    // Check if we have sample data to validate against
    if (availableData.length === 0) {
      return null; // Can't validate without data
    }

    // First sanitize the formula to ensure it's safe
    const sanitizedFormula = sanitizeFormula(formulaText);
    if (!sanitizedFormula) {
      return 'Formula contains invalid characters or dangerous code. Only mathematical expressions are allowed.';
    }

    // Extract field names from formula (simple regex to find identifiers)
    // After sanitization, field names should be safe identifiers
    const fieldPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
    const matches = sanitizedFormula.match(fieldPattern) || [];
    
    // Remove JavaScript keywords and operators
    const keywords = new Set([
      'return', 'if', 'else', 'for', 'while', 'do', 'function', 'var', 'let', 'const',
      'Math', 'parseFloat', 'parseInt', 'isNaN', 'isFinite', 'typeof', 'instanceof',
      'new', 'this', 'delete', 'void', 'with', 'switch', 'case', 'break', 'continue',
      'try', 'catch', 'finally', 'throw', 'in', 'of'
    ]);
    const operators = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
    const mathFunctions = new Set(['abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'max', 'min', 'log', 'exp', 'sin', 'cos', 'tan']);
    
    const formulaFields = matches.filter(m => 
      !keywords.has(m) && 
      !operators.has(m) && 
      !mathFunctions.has(m) &&
      !/^\d+/.test(m) // Exclude numbers
    );

    // Map formula fields to original field names (handle sanitization)
    // Create a mapping from sanitized names back to original names
    const sanitizedToOriginal = new Map<string, string>();
    availableFields.forEach(origField => {
      const sanitized = sanitizeFieldName(origField);
      if (sanitized) {
        sanitizedToOriginal.set(sanitized, origField);
        // Also map the original name to itself if it's already valid
        if (origField === sanitized) {
          sanitizedToOriginal.set(origField, origField);
        }
      }
    });

    // Check if all fields are numeric
    const missingFields: string[] = [];
    const nonNumericFields: string[] = [];
    
    formulaFields.forEach(field => {
      // Find the original field name (handles both sanitized and original)
      const originalField = sanitizedToOriginal.get(field) || field;
      
      if (!availableFields.includes(originalField)) {
        missingFields.push(field);
      } else {
        // Double check that the field is numeric in the data
        const hasNumericValue = availableData.some(data => {
          const parsed = parseNumericValue(data[originalField]);
          return parsed !== null;
        });
        if (!hasNumericValue) {
          nonNumericFields.push(field);
        }
      }
    });

    if (missingFields.length > 0) {
      return `Fields not found or not numeric: ${missingFields.join(', ')}. Only numeric fields can be used.`;
    }

    if (nonNumericFields.length > 0) {
      return `Fields are not numeric: ${nonNumericFields.join(', ')}. Only numeric values (including values with units like "Billion", "Million", "K") are supported.`;
    }

    // Try to evaluate the formula with sample data to check for syntax errors
    try {
      if (availableData.length > 0) {
        const sampleData = availableData[0];
        const scope: { [key: string]: number } = {};
        
        // Build scope from original field names (before sanitization)
        // Use the sanitizedToOriginal mapping we created earlier
        formulaFields.forEach(field => {
          // Get the original field name from our mapping
          const originalField = sanitizedToOriginal.get(field) || field;
          
          // Get the numeric value using the original field name
          const parsed = parseNumericValue(sampleData[originalField]);
          if (parsed !== null) {
            // Store with original field name for later mapping
            scope[originalField] = parsed;
          }
        });

        if (Object.keys(scope).length > 0) {
          // Create field mapping (original name -> sanitized name)
          const originalFieldNames = Object.keys(scope);
          const fieldMapping = createFieldMapping(originalFieldNames);
          
          // Replace field names in formula with sanitized versions
          const finalFormula = replaceFieldNamesInFormula(sanitizedFormula, fieldMapping);
          
          // Validate that all fields in formula are available
          const validation = validateFormulaFields(finalFormula, fieldMapping);
          if (!validation.valid) {
            return `Formula references unknown fields: ${validation.missingFields.join(', ')}`;
          }

          // Create sanitized scope
          const sanitizedScope: { [key: string]: number } = {};
          originalFieldNames.forEach(originalName => {
            const sanitized = fieldMapping.get(originalName);
            if (sanitized) {
              sanitizedScope[sanitized] = scope[originalName];
            }
          });

          const sanitizedFieldNames = Object.keys(sanitizedScope);
          const sanitizedFieldValues = Object.values(sanitizedScope);

          if (sanitizedFieldNames.length > 0) {
            // Create a safe evaluator with sanitized field names
            const testEvaluator = new Function(...sanitizedFieldNames, `return (${finalFormula})`);
            const result = testEvaluator(...sanitizedFieldValues);
            
            if (typeof result !== 'number' || !isFinite(result)) {
              return 'Formula must evaluate to a numeric value. Current formula returns: ' + (typeof result === 'undefined' ? 'undefined' : String(result));
            }
          }
        }
      }
    } catch (error) {
      return `Formula syntax error: ${error instanceof Error ? error.message : 'Invalid formula'}`;
    }

    return null;
  }, [availableFields, availableData]);

  const handleCreate = useCallback(() => {
    if (!metricName.trim() || !formula.trim()) return;

    // Validate formula
    const error = validateFormula(formula.trim());
    if (error) {
      setFormulaError(error);
      return;
    }

    setFormulaError(null);

    const newMetric: CustomMetric = {
      id: initialMetric?.id || `custom_${crypto.randomUUID()}`, 
      name: metricName.trim(),
      format,
      formula: formula.trim(),
      betterDirection: betterDirection || undefined,
      priority: priority || 5,
    };

    onAddMetric(newMetric);
  }, [metricName, formula, format, betterDirection, priority, onAddMetric, initialMetric, validateFormula]);

  const handleFormulaChange = useCallback((newFormula: string) => {
    setFormula(newFormula);
    // Validate on change (debounced would be better, but this works)
    if (newFormula.trim()) {
      const error = validateFormula(newFormula.trim());
      setFormulaError(error);
    } else {
      // Clear error when formula is empty
      setFormulaError(null);
    }
  }, [validateFormula]);

  const insertField = useCallback((field: string) => {
    setFormula(prev => {
      const newFormula = prev + field;
      // Trigger validation after inserting field
      if (newFormula.trim()) {
        const error = validateFormula(newFormula.trim());
        setFormulaError(error);
      } else {
        setFormulaError(null);
      }
      return newFormula;
    });
  }, [validateFormula]);

  const handleFormatChange = useCallback((e: any) => {
    // <-- Fixed 'as any'
    setFormat(e.target.value as 'currency' | 'percentage' | 'ratio' | 'number');
  }, []);

  return (
    <>
      <Typography variant="h6" mb={2} color="text.secondary">
        {initialMetric ? 'Edit Metric' : 'Create New Metric'}
      </Typography>

      <TextField
        fullWidth
        label="Metric Name"
        value={metricName}
        onChange={(e) => setMetricName(e.target.value)}
        placeholder="e.g., My Debt/Income Ratio"
        sx={{ ...formFieldSx, mb: 2 }}
        autoFocus
      />

      <FormControl fullWidth sx={{ ...formFieldSx, mb: 2 }}>
        <InputLabel>Format</InputLabel>
        <Select
          value={format}
          label="Format"
          onChange={handleFormatChange} 
        >
          <MenuItem value="currency">Currency</MenuItem>
          <MenuItem value="percentage">Percentage</MenuItem>
          <MenuItem value="ratio">Ratio</MenuItem>
          <MenuItem value="number">Number</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ ...formFieldSx, mb: 2 }}>
        <InputLabel>Better Direction (for charts)</InputLabel>
        <Select
          value={betterDirection || ''}
          label="Better Direction (for charts)"
          onChange={(e) => setBetterDirection(e.target.value as 'higher' | 'lower' || undefined)}
        >
          <MenuItem value="">Not specified</MenuItem>
          <MenuItem value="higher">Higher is better</MenuItem>
          <MenuItem value="lower">Lower is better</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Priority (1-10)"
        type="number"
        value={priority}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val >= 1 && val <= 10) {
            setPriority(val);
          }
        }}
        inputProps={{ min: 1, max: 10, step: 1 }}
        helperText="Higher priority metrics appear first (1 = least important, 10 = most important)"
        sx={{ ...formFieldSx, mb: 2 }}
      />

      <Typography variant="body2" color="text.secondary" mb={1}>
        Available Fields (click to insert):
        {availableFields.length === 0 && (
          <Typography component="span" variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>
            Add companies first to see available fields
          </Typography>
        )}
      </Typography>
      {availableFields.length > 0 ? (
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1} 
          mb={2}
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            p: 1,
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          {availableFields.map(field => (
            <Chip
              key={field}
              label={field}
              onClick={() => insertField(field)}
              size="small"
              sx={glassyChipSx}
              color="primary"
            />
          ))}
        </Box>
      ) : (
        <Box 
          sx={{ 
            p: 2, 
            mb: 2, 
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No company data available. Add companies to see available fields.
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        label="Formula"
        value={formula}
        onChange={(e) => handleFormulaChange(e.target.value)}
        placeholder="e.g., (totalDebt / netIncome) * 100"
        multiline
        rows={3}
        error={!!formulaError}
        helperText={formulaError || "Use field names and arithmetic operators: +, -, *, /, (). Only numeric fields are supported. Units like 'Billion', 'Million', 'K' will be automatically parsed."}
        sx={{ ...formFieldSx, mb: 2 }}
      />

      <Box display="flex" gap={1}>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!metricName.trim() || !formula.trim() || !!formulaError}
          sx={{ borderRadius: 2 }}
        >
          {initialMetric ? 'Update Metric' : 'Create Metric'}
        </Button>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
      </Box>
    </>
  );
}
