import { Card, CardContent, Typography, Box, CircularProgress, Chip, Checkbox } from '@mui/material';
import { AlertCircle } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';

interface CompanyTileProps {
  item: Company | ComparisonGroup;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
}

export function CompanyTile({
  item,
  keyMetrics,
  customMetrics,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
}: CompanyTileProps) {
  const isGroup = 'isGroup' in item;
  const company = item as Company;
  const group = item as ComparisonGroup;

  if (!isGroup && company.isLoading) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          cursor: 'pointer',
        }}
        onClick={onToggleExpand}
      >
        <CardContent>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading {company.ticker}...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!isGroup && company.error) {
    return (
      <Card
        sx={{
          height: '100%',
          minHeight: 200,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: 'error.main',
        }}
        onClick={onToggleExpand}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AlertCircle size={24} color="#d32f2f" />
            <Typography color="error">Error</Typography>
          </Box>
          <Typography variant="body2">{company.error}</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Ticker: {company.ticker}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const data = !isGroup ? company.rawData : null;
  if (!isGroup && !data) return null;

  const renderSummaryView = () => {
    const metricsToShow = keyMetrics
      .map(metricId => coreMetrics.find(m => m.id === metricId))
      .filter(Boolean);

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="div">
              {!isGroup ? data!.name : group.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {!isGroup ? data!.ticker : `Group (${group.companyIds.length} companies)`}
            </Typography>
          </Box>
          {isGroup && (
            <Chip label="Group" color="primary" size="small" />
          )}
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          {metricsToShow.map(metric => {
            if (!metric) return null;
            const value = data ? calculateCoreMetric(metric.id, data) : null;
            const formatted = formatMetricValue(value, metric.format);
            return (
              <Box key={metric.id} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {metric.name}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatted}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderExpandedView = () => {
    const groupedMetrics = coreMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof coreMetrics>);

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" component="div">
              {!isGroup ? data!.name : group.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {!isGroup ? data!.ticker : `Group (${group.companyIds.length} companies)`}
            </Typography>
          </Box>
          {isGroup && (
            <Chip label="Group" color="primary" />
          )}
        </Box>

        {Object.entries(groupedMetrics).map(([category, metrics]) => (
          <Box key={category} mb={3}>
            <Typography variant="h6" color="primary" mb={1}>
              {category}
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {metrics.map(metric => {
                const value = data ? calculateCoreMetric(metric.id, data) : null;
                const formatted = formatMetricValue(value, metric.format);
                return (
                  <Box
                    key={metric.id}
                    display="flex"
                    justifyContent="space-between"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2">{metric.name}</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatted}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}

        {customMetrics.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" color="primary" mb={1}>
              Custom Metrics
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {customMetrics.map(metric => {
                const value = data ? calculateCustomMetric(metric, data) : null;
                const formatted = formatMetricValue(value, metric.format);
                return (
                  <Box
                    key={metric.id}
                    display="flex"
                    justifyContent="space-between"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2">{metric.name}</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatted}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: isExpanded ? 400 : 200,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).type !== 'checkbox') {
          onToggleExpand();
        }
      }}
    >
      <CardContent sx={{ height: '100%', position: 'relative' }}>
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={(e) => e.stopPropagation()}
        />
        {isExpanded ? renderExpandedView() : renderSummaryView()}
      </CardContent>
    </Card>
  );
}
