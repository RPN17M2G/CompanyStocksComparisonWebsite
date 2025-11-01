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
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { X } from 'lucide-react';
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

const scrollbarStyles = {
  '&::-webkit-scrollbar': { display: 'none' },
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none',
};

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

  const getItemName = (item: Company | ComparisonGroup) =>
    'isGroup' in item ? item.name : item.ticker;

  const getItemData = (item: Company | ComparisonGroup): RawFinancialData | null =>
    itemsData.get(item.id) || null;

  const headerCellSx = {
    fontWeight: 'bold',
    minWidth: 150,
    backgroundColor: (theme: any) =>
      theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
  };

  const stickyColumnBaseSx = {
    fontWeight: 'bold',
    minWidth: 200,
    position: 'sticky',
    left: 0,
    borderRight: 1,
    borderColor: 'divider',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: (theme: any) =>
            theme.palette.mode === 'dark'
              ? 'rgba(10, 15, 25, 0.55)'
              : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(12px) saturate(160%) contrast(85%)',
        },
      }}
      PaperProps={{
        sx: {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          borderRadius: 4,
          background: (theme: any) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(25, 35, 55, 0.45) 0%, rgba(45, 55, 75, 0.35) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, rgba(245, 245, 245, 0.35) 100%)',
          backdropFilter: 'blur(18px) saturate(180%) contrast(85%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <DialogTitle
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="600">
              Detailed Comparison
            </Typography>
            <Chip label={`${items.length} items`} color="primary" size="small" />
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ ...scrollbarStyles, overflowY: 'auto' }}>
          <Box>
            {Object.entries(groupedMetrics).map(([category, metrics]) => (
              <Box key={category} mb={4}>
                <Typography variant="h6" color="primary.light" mb={2}>
                  {category}
                </Typography>
                <TableContainer
                  sx={{
                    ...scrollbarStyles,
                    overflowX: 'auto',
                    borderRadius: 2,
                    backgroundColor: (theme: any) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid',
                    borderColor: (theme: any) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            ...stickyColumnBaseSx,
                            ...headerCellSx,
                            zIndex: 11,
                          }}
                        >
                          Metric
                        </TableCell>
                        {items.map((item) => (
                          <TableCell
                            key={item.id}
                            align="right"
                            sx={{ ...headerCellSx, zIndex: 10 }}
                          >
                            {getItemName(item)}
                            {'isGroup' in item && (
                              <Chip label="Group" size="small" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {metrics.map((metric) => (
                        <TableRow
                          key={metric.id}
                          hover
                          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <TableCell
                            sx={{
                              ...stickyColumnBaseSx,
                              zIndex: 1,
                              backgroundColor: 'transparent',
                              'tr:hover &': {
                                backgroundColor: (theme: any) =>
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            {metric.name}
                          </TableCell>
                          {items.map((item) => {
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
                <Typography variant="h6" color="primary.light" mb={2}>
                  Custom Metrics
                </Typography>
                <TableContainer
                  sx={{
                    ...scrollbarStyles,
                    overflowX: 'auto',
                    borderRadius: 2,
                    backgroundColor: (theme: any) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid',
                    borderColor: (theme: any) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            ...stickyColumnBaseSx,
                            ...headerCellSx,
                            zIndex: 11,
                          }}
                        >
                          Metric
                        </TableCell>
                        {items.map((item) => (
                          <TableCell
                            key={item.id}
                            align="right"
                            sx={{ ...headerCellSx, zIndex: 10 }}
                          >
                            {getItemName(item)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customMetrics.map((metric) => (
                        <TableRow
                          key={metric.id}
                          hover
                          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <TableCell
                            sx={{
                              ...stickyColumnBaseSx,
                              zIndex: 1,
                              backgroundColor: 'transparent',
                              'tr:hover &': {
                                backgroundColor: (theme: any) =>
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            {metric.name}
                          </TableCell>
                          {items.map((item) => {
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

        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
