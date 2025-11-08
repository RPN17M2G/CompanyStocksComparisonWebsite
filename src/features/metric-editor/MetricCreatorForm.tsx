import { useState, useCallback } from 'react';
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
import { CustomMetric } from '../../shared/types/types';

// --- Fields and Styles moved from parent ---
const availableFields = [
  'marketCap', 'price', 'revenueTTM', 'revenueQoQ', 'revenueYoY', 'revenue3Yr', 
  'revenue5Yr', 'netIncome', 'eps', 'epsGrowthYoY', 'epsGrowth3Yr', 'epsGrowth5Yr',
  'peRatio', 'pbRatio', 'psRatio', 'pegRatio', 'evToEbitda', 'grossMargin', 
  'operatingMargin', 'netMargin', 'roe', 'roa', 'currentRatio', 'quickRatio',
  'debtToEquity', 'totalCash', 'totalDebt', 'dividendYield', 'payoutRatio', 'ebitda',
  'enterpriseValue', 'bookValue', 'totalAssets', 'totalEquity', 'currentAssets',
  'currentLiabilities',
];

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
}

export function MetricCreatorForm({ onAddMetric, onCancel }: MetricCreatorFormProps) {
  const [metricName, setMetricName] = useState('');
  const [formula, setFormula] = useState('');
  const [format, setFormat] = useState<'currency' | 'percentage' | 'ratio' | 'number'>('ratio');

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
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
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
