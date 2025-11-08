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
  RawFinancialData,
} from '../../shared/types/types';
import {
  calculateCoreMetric,
  calculateCustomMetric,
  formatMetricValue,
} from '../../engine/metricCalculator';

interface MetricCategorySectionProps {
  title: string;
  metrics: (CoreMetric | CustomMetric)[];
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
    metric: CoreMetric | CustomMetric,
    data: RawFinancialData
  ) => {
    if (isCustom) {
      return calculateCustomMetric(metric as CustomMetric, data);
    }
    return calculateCoreMetric((metric as CoreMetric).id, data);
  };

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
      {metrics.map((metric) => (
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
            return (
              <TableCell key={item.id} align="right">
                {formatted}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </React.Fragment>
  );
}
