import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  SxProps,
  Theme,
  IconButton,
  Collapse,
  Box,
} from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  itemsData,
  isCustom,
  stickyColumnBaseSx,
  getItemData,
}: MetricCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Sort metrics by priority (custom metrics only) then filter
  const sortedMetrics = [...metrics].sort((a, b) => {
    if (isCustom && 'priority' in a && 'priority' in b) {
      const priorityA = (a as CustomMetric).priority || 5;
      const priorityB = (b as CustomMetric).priority || 5;
      return priorityB - priorityA; // Higher priority first
    }
    return 0;
  });

  // Filter metrics to only show those with available data for at least one item
  const availableMetrics = sortedMetrics.filter(metric => {
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
      {/* Category Header Row with Collapse/Expand */}
      <TableRow>
        <TableCell
          colSpan={items.length + 1}
          sx={{
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            backdropFilter: 'blur(3px)',
            py: 1,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.15)',
            },
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton size="small" sx={{ p: 0.5 }}>
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </IconButton>
            <Typography variant="h6" color="primary.light" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({availableMetrics.length} metrics)
            </Typography>
          </Box>
        </TableCell>
      </TableRow>

      {/* Metric Rows */}
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <>
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
        </>
      </Collapse>
    </React.Fragment>
  );
}
