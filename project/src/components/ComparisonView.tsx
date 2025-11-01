import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';

interface ComparisonViewProps {
  open: boolean;
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  customMetrics: CustomMetric[];
  onClose: () => void;
}

export function ComparisonView({
  open,
  items,
  itemsData,
  customMetrics,
  onClose,
}: ComparisonViewProps) {
  const groupedMetrics = coreMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof coreMetrics>);

  const getItemName = (item: Company | ComparisonGroup) => {
    return 'isGroup' in item ? item.name : item.ticker;
  };

  const getItemData = (item: Company | ComparisonGroup): RawFinancialData | null => {
    const id = item.id;
    return itemsData.get(id) || null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6">Detailed Comparison</Typography>
          <Chip label={`${items.length} items`} color="primary" size="small" />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ overflowX: 'auto' }}>
          {Object.entries(groupedMetrics).map(([category, metrics]) => (
            <Box key={category} mb={4}>
              <Typography variant="h6" color="primary" mb={2}>
                {category}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                        Metric
                      </TableCell>
                      {items.map(item => (
                        <TableCell key={item.id} align="right" sx={{ fontWeight: 'bold', minWidth: 150 }}>
                          {getItemName(item)}
                          {'isGroup' in item && (
                            <Chip label="Group" size="small" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.map(metric => (
                      <TableRow key={metric.id} hover>
                        <TableCell>{metric.name}</TableCell>
                        {items.map(item => {
                          const data = getItemData(item);
                          const value = data ? calculateCoreMetric(metric.id, data) : null;
                          const formatted = formatMetricValue(value, metric.format);
                          return (
                            <TableCell key={item.id} align="right">
                              {formatted}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}

          {customMetrics.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" color="primary" mb={2}>
                Custom Metrics
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                        Metric
                      </TableCell>
                      {items.map(item => (
                        <TableCell key={item.id} align="right" sx={{ fontWeight: 'bold', minWidth: 150 }}>
                          {getItemName(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customMetrics.map(metric => (
                      <TableRow key={metric.id} hover>
                        <TableCell>{metric.name}</TableCell>
                        {items.map(item => {
                          const data = getItemData(item);
                          const value = data ? calculateCustomMetric(metric, data) : null;
                          const formatted = formatMetricValue(value, metric.format);
                          return (
                            <TableCell key={item.id} align="right">
                              {formatted}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
