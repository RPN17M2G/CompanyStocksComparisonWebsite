import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Trash2, Plus } from 'lucide-react';
import { CustomMetric } from '../types';

interface CustomMetricEditorProps {
  open: boolean;
  customMetrics: CustomMetric[];
  onClose: () => void;
  onAddMetric: (metric: CustomMetric) => void;
  onDeleteMetric: (metricId: string) => void;
}

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Custom Metrics</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          {customMetrics.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" mb={2}>
                Existing Custom Metrics
              </Typography>
              <List>
                {customMetrics.map(metric => (
                  <ListItem
                    key={metric.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={metric.name}
                      secondary={
                        <>
                          <Typography variant="body2" component="span" color="text.secondary">
                            Formula: {metric.formula}
                          </Typography>
                          <br />
                          <Chip label={metric.format} size="small" sx={{ mt: 0.5 }} />
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => onDeleteMetric(metric.id)}
                        color="error"
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
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
            >
              Create New Custom Metric
            </Button>
          ) : (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" mb={2}>
                Create New Metric
              </Typography>

              <TextField
                fullWidth
                label="Metric Name"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="e.g., My Debt/Income Ratio"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
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
                    sx={{ cursor: 'pointer' }}
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
                sx={{ mb: 2 }}
              />

              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={!metricName.trim() || !formula.trim()}
                >
                  Create Metric
                </Button>
                <Button onClick={() => setShowCreator(false)}>
                  Cancel
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
