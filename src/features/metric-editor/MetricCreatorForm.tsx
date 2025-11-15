import { useState, useCallback, useMemo } from 'react';
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
}

export function MetricCreatorForm({ onAddMetric, onCancel, availableData = [] }: MetricCreatorFormProps) {
  const [metricName, setMetricName] = useState('');
  const [formula, setFormula] = useState('');
  const [format, setFormat] = useState<'currency' | 'percentage' | 'ratio' | 'number'>('ratio');

  // Dynamically get available fields from actual company data
  const availableFields = useMemo(() => {
    if (availableData && availableData.length > 0) {
      const metrics = getAllAvailableMetrics(availableData);
      return metrics.map(m => m.id).sort();
    }
    // Fallback to empty array if no data provided
    return [];
  }, [availableData]);

  const handleCreate = useCallback(() => {
    if (!metricName.trim() || !formula.trim()) return;

    const newMetric: CustomMetric = {
      id: `custom_${crypto.randomUUID()}`, 
      name: metricName.trim(),
      format,
      formula: formula.trim(),
    };

    onAddMetric(newMetric);
  }, [metricName, formula, format, onAddMetric]);

  const insertField = useCallback((field: string) => {
    setFormula(prev => prev + field);
  }, []);

  const handleFormatChange = useCallback((e: any) => {
    // <-- Fixed 'as any'
    setFormat(e.target.value as 'currency' | 'percentage' | 'ratio' | 'number');
  }, []);

  return (
    <>
      <Typography variant="h6" mb={2} color="text.secondary">
        Create New Metric
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
        onChange={(e) => setFormula(e.target.value)}
        placeholder="e.g., (totalDebt / netIncome) * 100"
        multiline
        rows={3}
        helperText="Use field names and arithmetic operators: +, -, *, /, ()"
        sx={{ ...formFieldSx, mb: 2 }}
      />

      <Box display="flex" gap={1}>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!metricName.trim() || !formula.trim()}
          sx={{ borderRadius: 2 }}
        >
          Create Metric
        </Button>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
      </Box>
    </>
  );
}
