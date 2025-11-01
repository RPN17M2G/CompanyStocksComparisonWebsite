import { useState } from 'react';
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
  IconButton,
  List,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Trash2, Plus } from 'lucide-react';
import { CustomMetric } from '../types';
import { GlassDialog } from './GlassDialog'; // Import the new component

const availableFields = [
  'marketCap',
  'price',
  'revenueTTM',
  'revenueQoQ',
  'revenueYoY',
  'revenue3Yr',
  'revenue5Yr',
  'netIncome',
  'eps',
  'epsGrowthYoY',
  'epsGrowth3Yr',
  'epsGrowth5Yr',
  'peRatio',
  'pbRatio',
  'psRatio',
  'pegRatio',
  'evToEbitda',
  'grossMargin',
  'operatingMargin',
  'netMargin',
  'roe',
  'roa',
  'currentRatio',
  'quickRatio',
  'debtToEquity',
  'totalCash',
  'totalDebt',
  'dividendYield',
  'payoutRatio',
  'ebitda',
  'enterpriseValue',
  'bookValue',
  'totalAssets',
  'totalEquity',
  'currentAssets',
  'currentLiabilities',
];

// --- Reusable "Glassy Card" style ---
const glassyCardSx = {
  p: 2,
  mb: 1.5,
  borderRadius: 3, // 12px
  backgroundColor: (theme: any) => 
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  backdropFilter: 'blur(5px)',
  border: '1px solid',
  borderColor: (theme: any) => 
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
};

// --- Reusable "Glassy Chip" style ---
const glassyChipSx = {
  cursor: 'pointer',
  backgroundColor: (theme: any) => 
    theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.1)',
  backdropFilter: 'blur(5px)',
  color: (theme: any) => // <-- CHANGED
    theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
  fontWeight: 'medium',
  borderRadius: 2,
  border: '1px solid',
  borderColor: (theme: any) => 
    theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.3)',
  '&:hover': {
    backgroundColor: (theme: any) => 
      theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.2)',
  }
};

// --- Style for form fields on glassy background ---
const formFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme: any) => 
      theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  '& .MuiInputLabel-root': { // Ensure label is readable
    color: (theme: any) => theme.palette.text.secondary,
  }
};
// ------------------------------------------------

// --- ADDED THIS INTERFACE ---
interface CustomMetricEditorProps {
  open: boolean;
  customMetrics: CustomMetric[];
  onClose: () => void;
  onAddMetric: (metric: CustomMetric) => void;
  onDeleteMetric: (metricId: string) => void;
}
// ----------------------------

export function CustomMetricEditor({
  open,
  customMetrics,
  onClose,
  onAddMetric,
  onDeleteMetric,
}: CustomMetricEditorProps) {
  const [metricName, setMetricName] = useState('');
  const [formula, setFormula] = useState('');
  const [format, setFormat] = useState<'currency' | 'percentage' | 'ratio' | 'number'>('ratio');
  const [showCreator, setShowCreator] = useState(false);

  const handleCreate = () => {
    if (!metricName.trim() || !formula.trim()) return;

    const newMetric: CustomMetric = {
      id: `custom_${Date.now()}`,
      name: metricName.trim(),
      format,
      formula: formula.trim(),
    };

    onAddMetric(newMetric);
    setMetricName('');
    setFormula('');
    setFormat('ratio');
    setShowCreator(false);
  };

  const insertField = (field: string) => {
    setFormula(prev => prev + field);
  };
  
  // Close and reset local state
  const handleClose = () => {
    setMetricName('');
    setFormula('');
    setFormat('ratio');
    setShowCreator(false);
    onClose();
  };

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Custom Metrics"
      maxWidth="md"
      fullWidth
      actions={
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      }
    >
      {customMetrics.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" mb={2} color="text.secondary">
            Existing Metrics
          </Typography>
          <List sx={{ p: 0 }}>
            {customMetrics.map(metric => (
              <Box key={metric.id} sx={glassyCardSx}>
                <ListItemText
                  primary={metric.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        Formula: {metric.formula}
                      </Typography>
                      <br />
                      <Chip 
                        label={metric.format} 
                        size="small" 
                        sx={{ 
                          mt: 0.5, 
                          borderRadius: 1.5,
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          opacity: 0.8
                        }} 
                      />
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => onDeleteMetric(metric.id)}
                    color="error"
                    sx={{
                      marginRight: 2,
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.2)',
                      }
                    }}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </ListItemSecondaryAction>
              </Box>
            ))}
          </List>
        </Box>
      )}

      {!showCreator ? (
        <Button
          variant="outlined"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreator(true)}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, mt: 2 }}
        >
          Create New Custom Metric
        </Button>
      ) : (
        <Box sx={{ ...glassyCardSx, p: 3 }}>
          <Typography variant="h6" mb={2} color="text.secondary">
            Create New Metric
          </Typography>

          <TextField
            fullWidth
            label="Metric Name"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="e.g., My Debt/Income Ratio"
            sx={{ ...formFieldSx, mb: 2 }} // <-- APPLIED FIX
          />

          <FormControl fullWidth sx={{ ...formFieldSx, mb: 2 }}> {/* <-- APPLIED FIX */}
            <InputLabel>Format</InputLabel>
            <Select
              value={format}
              label="Format"
              onChange={(e) => setFormat(e.target.value as any)}
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
            sx={{ ...formFieldSx, mb: 2 }} // <-- APPLIED FIX
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
            <Button onClick={() => setShowCreator(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </GlassDialog>
  );
}

