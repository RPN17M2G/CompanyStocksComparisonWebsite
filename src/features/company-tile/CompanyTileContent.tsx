// src/components/CompanyTileContent.tsx
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Checkbox,
  IconButton,
  SxProps,
  Theme,
  keyframes,
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric } from '../../shared/types/types';
import { coreMetrics } from '../../engine/coreMetrics';
import {
  calculateCoreMetric,
  calculateDynamicMetric,
  formatMetricValue,
} from '../../engine/metricCalculator';
import { generateDynamicMetrics } from '../../engine/dynamicMetrics';
import { TileRemoveButton } from '../../shared/ui/TileRemoveButton';
import React, { useMemo, useCallback } from 'react';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface CompanyTileContentProps {
  item: Company | ComparisonGroup;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  isSelected: boolean;
  onShowDetails: () => void;
  onToggleSelect: () => void;
  onRemove: () => void;
  onRefresh?: (ticker: string) => void;
  cardSx: SxProps<Theme>;
}

const TileSelectCheckbox = React.memo(
  ({
    isSelected,
    onToggleSelect,
  }: {
    isSelected: boolean;
    onToggleSelect: () => void;
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onToggleSelect();
      },
      [onToggleSelect]
    );

    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    return (
      <Checkbox
        checked={isSelected}
        onChange={handleChange}
        onClick={handleClick}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          backgroundColor: 'rgba(120, 120, 120, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(120, 120, 120, 0.2)',
          },
          padding: 1,
          borderRadius: '50%',
        }}
      />
    );
  }
);

export function CompanyTileContent({
  item,
  keyMetrics,
  customMetrics: _customMetrics, // Reserved for future use
  isSelected,
  onShowDetails,
  onToggleSelect,
  onRemove,
  onRefresh,
  cardSx,
}: CompanyTileContentProps) {
  const isGroup = 'isGroup' in item;
  const company = item as Company;
  const group = item as ComparisonGroup;
  const data = !isGroup ? company.rawData : null;

  const { title, subtitle } = useMemo(() => {
    if (isGroup) {
      return {
        title: group.name,
        subtitle: `Group (${group.companyIds.length} companies)`,
      };
    }
    if (data) {
      return {
        title: data.name,
        subtitle: data.ticker,
      };
    }
    return { title: 'Loading...', subtitle: '...' };
  }, [isGroup, item, data]);

  const metricsToShow = useMemo(() => {
    if (isGroup || !data) return [];

    // Generate dynamic metrics from data
    const dynamicMetrics = generateDynamicMetrics(data);

    // Get all available metrics (keyMetrics + dynamic metrics that have data)
    const allMetricIds = new Set(keyMetrics);
    
    // Add dynamic metrics that have actual data and aren't already in keyMetrics
    dynamicMetrics.forEach(metric => {
      const value = calculateDynamicMetric(metric, data);
      if (value !== null && value !== undefined && value !== '') {
        allMetricIds.add(metric.id);
      }
    });

    return Array.from(allMetricIds)
      .map(metricId => {
        // Try to find in legacy coreMetrics first
        const legacyMetric = coreMetrics.find(m => m.id === metricId);
        let value: string | number | null;
        let format: string;
        let name: string;

        if (legacyMetric) {
          // Legacy metric with calculate function
          value = calculateCoreMetric(legacyMetric.id, data);
          format = legacyMetric.format;
          name = legacyMetric.name;
        } else {
          // Try dynamic metric
          const dynamicMetric = dynamicMetrics.find(m => m.id === metricId);
          if (!dynamicMetric) {
            // Try direct data access
            const directValue = data[metricId];
            if (directValue !== undefined && directValue !== null && directValue !== '') {
              value = directValue as string | number;
              format = typeof directValue === 'number' ? 'number' : 'text';
              name = metricId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            } else {
              return null;
            }
          } else {
            value = calculateDynamicMetric(dynamicMetric, data);
            format = dynamicMetric.format;
            name = dynamicMetric.name;
          }
        }

        // Only include if value exists
        if (value === null || value === undefined || value === '') {
          return null;
        }

        const formatted = formatMetricValue(value, format);

        return { id: metricId, name, formattedValue: formatted ?? 'N/A' };
      })
      .filter(
        (m): m is { id: string; name: string; formattedValue: string } => 
          m !== null
      )
      .slice(0, 10); // Limit to 10 metrics to avoid overflow
  }, [keyMetrics, data, isGroup]);

  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGroup && onRefresh) {
      onRefresh(company.ticker);
    }
  }, [isGroup, company.ticker, onRefresh]);

  return (
    <Card sx={cardSx} onClick={onShowDetails}>
      <CardContent sx={{ height: '100%', position: 'relative' }}>
        <TileRemoveButton onRemove={onRemove} />
        <TileSelectCheckbox
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
        />
        {!isGroup && onRefresh && (
          <IconButton
            onClick={handleRefresh}
            size="small"
            disabled={company.isLoading}
            sx={{
              position: 'absolute',
              top: 8,
              right: 56,
              zIndex: 1,
              backgroundColor: 'rgba(120, 120, 120, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(120, 120, 120, 0.2)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
              padding: 1,
            }}
            title="Refresh data"
          >
            <RefreshCw 
              size={16} 
              style={company.isLoading ? {
                animation: `${spin} 1s linear infinite`,
              } : undefined}
            />
          </IconButton>
        )}

        <Box sx={{ pt: 3, px: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box sx={{ pr: '40px' }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  maxWidth: '22ch', 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: '22ch', 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {subtitle}
              </Typography>
              {!isGroup && company.lastUpdated && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    fontSize: '0.7rem',
                    opacity: 0.7,
                  }}
                >
                  Updated: {new Date(company.lastUpdated).toLocaleString()}
                </Typography>
              )}
            </Box>
            {isGroup && (
              <Chip
                label="Group"
                color="primary"
                size="small"
                sx={{ flexShrink: 0 }}
              />
            )}
          </Box>
          <Box display="flex" flexDirection="column" gap={1}>
            {metricsToShow.map(metric => (
              <Box
                key={metric.id}
                display="flex"
                justifyContent="space-between"
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    maxWidth: '18ch', 
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    mr: 1,
                  }}
                >
                  {metric.name}:
                </Typography>
                {/* ------------------------- */}
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  sx={{
                    flexShrink: 0,
                    pl: 1, 
                  }}
                >
                  {metric.formattedValue}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
