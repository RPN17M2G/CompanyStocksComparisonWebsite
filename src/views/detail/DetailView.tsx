import { Box, Typography, IconButton, Chip, Paper, Collapse, } from '@mui/material';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../../shared/types/types';
import { calculateCustomMetric, formatMetricValue, calculateDynamicMetric } from '../../engine/metricCalculator';
import { generateDynamicMetrics } from '../../engine/dynamicMetrics';
import { groupMetricsWithSubcategories } from '../../engine/metricGrouping';
import { scrollbarStyles } from '../../app/theme/theme';

interface DetailViewProps {
  item: Company | ComparisonGroup;
  data: RawFinancialData;
  customMetrics: CustomMetric[];
  onClose: () => void;
}

export function DetailView({ item, data, customMetrics, onClose }: DetailViewProps) {
  const isGroup = 'isGroup' in item;
  const group = item as ComparisonGroup;
  const company = !isGroup ? (item as Company) : null;

  let title = '...';
  let subtitle = '...';
  if (isGroup) {
    title = group.name;
    subtitle = `Group (${group.companyIds.length} companies)`;
  } else if (data && data != undefined) {
    title = data.name || company?.ticker || 'Unknown';
    subtitle = data.ticker || company?.ticker || 'Unknown';
  } else if (company) {
    title = company.ticker;
    subtitle = 'No data available';
  }

  const dynamicMetrics = useMemo(() => {
    if (!data) return [];
    return generateDynamicMetrics(data);
  }, [data]);

  const groupedMetrics = useMemo(() => {
    return groupMetricsWithSubcategories(dynamicMetrics);
  }, [dynamicMetrics]);

  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => 
    new Set(groupedMetrics.map(g => g.category))
  );
  const [isCustomExpanded, setIsCustomExpanded] = useState(true);
  
  const toggleSubcategory = (category: string, subcategory: string) => {
    const key = `${category}_${subcategory}`;
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };



  const metricRowSx = {
    display: 'flex',
    justifyContent: 'space-between',
    p: 1.5,
    borderRadius: 2,
    transition: 'background-color 0.2s ease',
    '&:hover': { 
      bgcolor: 'action.hover' 
    },
  };

  return (
    <Paper
      sx={{
        borderRadius: 4,
        backgroundColor: (theme: any) => 
          theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        boxShadow: (theme: any) => theme.shadows[8],
        border: '1px solid transparent',
        
        overflowY: 'auto',
        height: '100%', 
        
        scrollbarWidth: 'none', // Firefox
        '&::-webkit-scrollbar': {
          display: 'none', // Safari and Chrome
        },
      }}
    >
      {/* --- Sticky Header --- */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          p: { xs: 1.5, sm: 2 },
          backgroundColor: (theme: any) => 
            theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: 1,
          borderColor: 'divider',
          ...scrollbarStyles,
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
        
        <Box sx={{ pr: 5 }}> {/* Padding to avoid overlap with close button */}
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {!data || Object.keys(data).length <= 2 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Data Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isGroup ? 'Group data will be calculated from member companies' : 'Unable to fetch data for this company'}
            </Typography>
          </Box>
        ) : (
          groupedMetrics.map((group) => {
          const availableDirectMetrics = group.directMetrics.filter(metric => {
            if (!data) return false;
            const value = calculateDynamicMetric(metric, data);
            const formatted = formatMetricValue(value, metric.format);
            return formatted !== null;
          });

          const availableSubcategories = Object.entries(group.subcategories)
            .map(([subcategory, metrics]) => {
              const available = metrics.filter(metric => {
                if (!data) return false;
                const isAnnual = subcategory.includes('Annual');
                const originalId = isAnnual
                  ? `annual_${metric.id}` 
                  : `quarterly_${metric.id}`;
                const value = data[originalId] ?? calculateDynamicMetric(metric, data);
                const formatted = formatMetricValue(value, metric.format);
                return formatted !== null;
              });
              return { subcategory, metrics: available };
            })
            .filter(({ metrics }) => metrics.length > 0);

          if (availableDirectMetrics.length === 0 && availableSubcategories.length === 0) {
            return null;
          }

          const isCategoryExpanded = expandedCategories.has(group.category);

          return (
            <Box key={group.category} sx={{ mb: 3 }}>
              <Box
                onClick={() => toggleCategory(group.category)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <IconButton size="small" sx={{ p: 0.5 }}>
                  {isCategoryExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </IconButton>
                <Typography variant="h6" color="primary.light" fontWeight="500" sx={{ flexGrow: 1 }}>
                  {group.category}
                </Typography>
              </Box>

              <Collapse in={isCategoryExpanded} timeout="auto" unmountOnExit>
              
              {availableDirectMetrics.length > 0 && (
                <Box display="flex" flexDirection="column" gap={0.5} sx={{ mb: availableSubcategories.length > 0 ? 2 : 0 }}>
                  {availableDirectMetrics.map(metric => {
                    const value = calculateDynamicMetric(metric, data!);
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
              )}

              {availableSubcategories.map(({ subcategory, metrics }) => {
                const key = `${group.category}_${subcategory}`;
                const isExpanded = expandedSubcategories.has(key);
                
                return (
                  <Box key={subcategory} sx={{ mb: 1 }}>
                    <Box
                      onClick={() => toggleSubcategory(group.category, subcategory)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        mb: 0.5,
                      }}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <Typography variant="subtitle2" fontWeight="600" color="primary.main">
                        {subcategory}
                      </Typography>
                      <Chip label={metrics.length} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box display="flex" flexDirection="column" gap={0.5} sx={{ pl: 3 }}>
                        {metrics.map(metric => {
                          // Use original ID with prefix for lookup
                          const isAnnual = subcategory.includes('Annual');
                          const originalId = isAnnual
                            ? `annual_${metric.id}` 
                            : `quarterly_${metric.id}`;
                          const value = data![originalId] ?? calculateDynamicMetric(metric, data!);
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
                    </Collapse>
                  </Box>
                );
              })}
              </Collapse>
            </Box>
          );
        }))}

        {customMetrics.length > 0 && (() => {
          // Sort custom metrics by priority
          const sortedCustomMetrics = [...customMetrics].sort((a, b) => {
            const priorityA = a.priority || 5;
            const priorityB = b.priority || 5;
            return priorityB - priorityA; // Higher priority first
          });

          return (
            <Box sx={{ mb: 3 }}>
              <Box
                onClick={() => setIsCustomExpanded(!isCustomExpanded)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <IconButton size="small" sx={{ p: 0.5 }}>
                  {isCustomExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </IconButton>
                <Typography variant="h6" color="primary.light" fontWeight="500" sx={{ flexGrow: 1 }}>
                  Custom Metrics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({sortedCustomMetrics.length} metrics)
                </Typography>
              </Box>

              <Collapse in={isCustomExpanded} timeout="auto" unmountOnExit>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {sortedCustomMetrics.map(metric => {
                    const value = data ? calculateCustomMetric(metric, data) : null;
                    const formatted = formatMetricValue(value, metric.format);
                    return (
                      <Box key={metric.id} sx={metricRowSx}>
                        <Typography variant="body2">{metric.name}</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatted ?? 'N/A'}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })()}
      </Box>
    </Paper>
  );
}
