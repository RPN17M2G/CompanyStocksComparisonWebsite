import { Box, Typography, IconButton, Chip, Paper, Card, CardContent } from '@mui/material';
import { X } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';

interface DetailViewProps {
  item: Company | ComparisonGroup;
  data: RawFinancialData;
  customMetrics: CustomMetric[];
  onClose: () => void;
}

export function DetailView({ item, data, customMetrics, onClose }: DetailViewProps) {
  const isGroup = 'isGroup' in item;
  const company = item as Company;
  const group = item as ComparisonGroup;

  let title = '...';
  let subtitle = '...';
  if (isGroup) {
    title = group.name;
    subtitle = `Group (${group.companyIds.length} companies)`;
  } else if (data) {
    title = data.name;
    subtitle = data.ticker;
  }

  // Group metrics by category
  const groupedMetrics = coreMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof coreMetrics>);


  const metricRowSx = {
    display: 'flex',
    justifyContent: 'space-between',
    p: 1.5,
    borderRadius: 2, // 8px
    transition: 'background-color 0.2s ease',
    '&:hover': { 
      bgcolor: 'action.hover' 
    },
  };

  return (
    // This Paper is now the single floating card
    <Paper
      sx={{
        borderRadius: 4, // More circular (16px)
        // Glassmorphism effect
        backgroundColor: (theme: any) => 
          theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        // Make it pop
        boxShadow: (theme: any) => theme.shadows[8],
        border: '1px solid transparent',
        
        // --- UPDATED ---
        // Make the card scrollable
        overflowY: 'auto',
        // Fill the padded Box container from App.tsx
        height: '100%', 
        
        // --- ADDED ---
        // Hide scrollbar
        scrollbarWidth: 'none', // Firefox
        '&::-webkit-scrollbar': {
          display: 'none', // Safari and Chrome
        },
        // -------------
      }}
    >
      {/* --- Sticky Header --- */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          p: 2,
          // Glassy background
          backgroundColor: (theme: any) => 
            theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.2)',
            }
          }}
        >
          <X size={20} />
        </IconButton>
        
        <Box sx={{ pr: 5 }}> {/* Padding to avoid close button */}
          <Typography variant="h5" component="div" fontWeight="600">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
          {isGroup && (
            <Chip label="Group" color="primary" size="small" sx={{ mt: 1 }} />
          )}
        </Box>
      </Box>

      {/* --- Scrolling Content Area --- */}
      <Box sx={{ p: 3 }}>
        {Object.entries(groupedMetrics).map(([category, metrics]) => (
          // Replaced stacked cards with simple sections
          <Box key={category} sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.light" mb={1} fontWeight="500">
              {category}
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {metrics.map(metric => {
                const value = data ? calculateCoreMetric(metric.id, data) : null;
                const formatted = formatMetricValue(value, metric.format);
                return (
                  <Box key={metric.id} sx={metricRowSx}>
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary.light" mb={1} fontWeight="500">
              Custom Metrics
            </Typography>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {customMetrics.map(metric => {
                const value = data ? calculateCustomMetric(metric, data) : null;
                const formatted = formatMetricValue(value, metric.format);
                return (
                  <Box key={metric.id} sx={metricRowSx}>
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
    </Paper>
  );
}

