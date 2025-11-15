import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  SxProps,
  Theme,
} from '@mui/material';
import {
  Company,
  ComparisonGroup,
  CoreMetric,
  CustomMetric,
  DynamicMetric,
  RawFinancialData,
} from '../../shared/types/types';
import {
  calculateCoreMetric,
  calculateCustomMetric,
  calculateDynamicMetric,
  formatMetricValue,
} from '../../engine/metricCalculator';

interface MetricCategorySectionProps {
  title: string;
  metrics: (CoreMetric | CustomMetric | DynamicMetric)[];
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  isCustom: boolean;
  stickyColumnBaseSx: SxProps<Theme>;
  getItemData: (item: Company | ComparisonGroup) => RawFinancialData | null;
}

export function MetricCategorySection({
  title,
  metrics,
  items,
  isCustom,
  stickyColumnBaseSx,
  getItemData,
}: MetricCategorySectionProps) {

  const calculateMetric = (
    metric: CoreMetric | CustomMetric | DynamicMetric,
    data: RawFinancialData
  ) => {
    if (isCustom) {
      return calculateCustomMetric(metric as CustomMetric, data);
    }
    // Check if it's a DynamicMetric (has format but no calculate function)
    if ('format' in metric && !('calculate' in metric)) {
      return calculateDynamicMetric(metric as DynamicMetric, data);
    }
    // Legacy CoreMetric with calculate function
    return calculateCoreMetric((metric as CoreMetric).id, data);
  };

  // Filter metrics to only show those with available data for at least one item
  const availableMetrics = metrics.filter(metric => {
    return items.some(item => {
      const data = getItemData(item);
      if (!data) return false;
      const value = calculateMetric(metric, data);
      const formatted = formatMetricValue(value, metric.format);
      return formatted !== null;
    });
  });

  // Only render category if it has available metrics
  if (availableMetrics.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      {/* Category Header Row */}
      <TableRow>
        <TableCell
          colSpan={items.length + 1}
          sx={{
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            backdropFilter: 'blur(3px)',
            py: 1.5,
          }}
        >
          <Typography variant="h6" color="primary.light">
            {title}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Metric Rows */}
      {availableMetrics.map((metric) => (
        <TableRow
          key={metric.id}
          hover
          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
        >
          {/* Sticky Metric Name Cell */}
          <TableCell
            sx={{
              ...stickyColumnBaseSx,
              zIndex: 1,
              backgroundColor: 'transparent',
              // Apply hover background color to sticky cell as well
              'tr:hover &': {
                backgroundColor: (theme: Theme) => theme.palette.action.hover,
              },
            }}
          >
            {metric.name}
          </TableCell>

          {/* Metric Value Cells */}
          {items.map((item) => {
            const data = getItemData(item);
            const value = data ? calculateMetric(metric, data) : null;
            const formatted = formatMetricValue(value, metric.format);
            // For custom metrics, show N/A instead of - when value is null
            const displayValue = isCustom && formatted === null ? 'N/A' : (formatted ?? '-');
            return (
              <TableCell key={item.id} align="right">
                {displayValue}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </React.Fragment>
  );
}
