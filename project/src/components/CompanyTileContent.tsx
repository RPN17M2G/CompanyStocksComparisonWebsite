// src/components/CompanyTileContent.tsx
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Checkbox,
  SxProps,
  Theme,
} from '@mui/material';
import { Company, ComparisonGroup, CustomMetric } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import {
  calculateCoreMetric,
  formatMetricValue,
} from '../engine/metricCalculator';
import { TileRemoveButton } from './TileRemoveButton';
import React, { useMemo, useCallback } from 'react';

// ... (No changes to CompanyTileContentProps or TileSelectCheckbox) ...

interface CompanyTileContentProps {
  item: Company | ComparisonGroup;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  isSelected: boolean;
  onShowDetails: () => void;
  onToggleSelect: () => void;
  onRemove: () => void;
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
  customMetrics,
  isSelected,
  onShowDetails,
  onToggleSelect,
  onRemove,
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

    return keyMetrics
      .map(metricId => {
        const metric = coreMetrics.find(m => m.id === metricId);
        if (!metric) return null;

        const value = calculateCoreMetric(metric.id, data);
        const formatted = formatMetricValue(value, metric.format);

        return { id: metric.id, name: metric.name, formattedValue: formatted };
      })
      .filter(
        (m): m is { id: string; name: string; formattedValue: string } => !!m
      );
  }, [keyMetrics, data, isGroup]);

  return (
    <Card sx={cardSx} onClick={onShowDetails}>
      <CardContent sx={{ height: '100%', position: 'relative' }}>
        <TileRemoveButton onRemove={onRemove} />
        <TileSelectCheckbox
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
        />

        <Box sx={{ pt: 3, px: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box sx={{ pr: '40px' }}>
              {/* --- TITLE / SUBTITLE FIX --- */}
              <Typography
                variant="h6"
                component="div"
                sx={{
                  maxWidth: '22ch', // Reduced from 30ch
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
                  maxWidth: '22ch', // Reduced from 30ch
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {subtitle}
              </Typography>
              {/* ------------------------- */}
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
                {/* --- METRIC NAME FIX --- */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    maxWidth: '18ch', // Constrain metric name
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    mr: 1, // Add margin to separate from value
                  }}
                >
                  {metric.name}:
                </Typography>
                {/* ------------------------- */}
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  sx={{
                    flexShrink: 0, // Prevent value from wrapping
                    pl: 1, // Add padding to avoid collision
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
