import { Card, CardContent, Typography, Box, CircularProgress, Chip, Checkbox, IconButton } from '@mui/material';
import { AlertCircle, X } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';

interface CompanyTileProps {
  item: Company | ComparisonGroup;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  // isExpanded: boolean; // Removed
  isSelected: boolean;
  // onToggleExpand: () => void; // Removed
  onShowDetails: () => void; // Added
  onToggleSelect: () => void;
  onRemove: () => void;
}

export function CompanyTile({
  item,
  keyMetrics,
  customMetrics,
  // isExpanded, // Removed
  isSelected,
  // onToggleExpand, // Removed
  onShowDetails, // Added
  onToggleSelect,
  onRemove,
}: CompanyTileProps) {
  const isGroup = 'isGroup' in item;
  const company = item as Company;
  const group = item as ComparisonGroup;

  // --- Base Card Styles ---
  const cardSx = {
    height: '100%',
    minHeight: 200,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: 4, // More circular (16px)
    // Glassmorphism effect
    backgroundColor: (theme: any) => 
      theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    // Base shadow
    boxShadow: (theme: any) => theme.shadows[1],
    // Selection border
    border: isSelected ? 2 : 1,
    borderColor: isSelected ? 'primary.main' : 'transparent',
    // Hover effect
    '&:hover': {
      boxShadow: (theme: any) => theme.shadows[6], // Make it pop more
      transform: 'translateY(-4px)', // Lift it higher
      borderColor: isSelected ? 'primary.main' : 'primary.light',
    },
  };
  // -------------------------

  if (!isGroup && company.isLoading) {
    return (
      <Card
        sx={{
          ...cardSx, // Apply base styles
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onShowDetails} // Changed
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
          ...cardSx, // Apply base styles
          position: 'relative',
          borderColor: 'error.main', // Override border color for error
        }}
        onClick={onShowDetails} // Changed
      >
        <IconButton
          aria-label="remove"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            // Make button background visible on transparent card
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.2)',
            }
          }}
        >
          <X size={18} />
        </IconButton>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2} sx={{ pt: 2, pl: 3 }}>
            <AlertCircle size={24} color="#d32f2f" />
            <Typography color="error">Error</Typography>
          </Box>
          <Typography variant="body2" sx={{ pl: 3 }}>{company.error}</Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', pl: 3 }}>
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

    let title = 'Loading...';
    let subtitle = '...';
    if (isGroup) {
      title = group.name;
      subtitle = `Group (${group.companyIds.length} companies)`;
    } else if (data) {
      title = data.name;
      subtitle = data.ticker;
    }

    return (
      <Box sx={{ pt: 3, px: 1 }}> {/* Added horizontal padding */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box sx={{ pr: '40px' }}> 
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          {isGroup && (
            <Chip label="Group" color="primary" size="small" sx={{ flexShrink: 0 }}/>
          )}
        </Box>
        <Box display="flex" flexDirection="column" gap={1}>
          {metricsToShow.map(metric => {
            if (!metric) return null;
            const value = data ? calculateCoreMetric(metric.id, data) : null;
            const formatted = !isGroup ? formatMetricValue(value, metric.format) : '...';
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

  return (
    <Card
      sx={cardSx} // Apply base styles
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON' ||
          target.closest('button')
        ) {
          return;
        }
        onShowDetails(); 
      }}
    >
      <CardContent sx={{ height: '100%', position: 'relative' }}>
        {/* Remove Button */}
        <IconButton
          aria-label="remove"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            // Make button background visible on transparent card
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.2)',
            }
          }}
        >
          <X size={18} />
        </IconButton>

        {/* Select Checkbox */}
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            // Make button background visible on transparent card
            backgroundColor: 'rgba(120, 120, 120, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(120, 120, 120, 0.2)',
            },
            padding: 1, // Adjust padding for background
            borderRadius: '50%', // Make background circular
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {renderSummaryView()}
      </CardContent>
    </Card>
  );
}

