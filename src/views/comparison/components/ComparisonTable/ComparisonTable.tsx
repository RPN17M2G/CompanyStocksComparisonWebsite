import { Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Theme, useMediaQuery, useTheme } from '@mui/material';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import React, { memo, useState, useEffect, useMemo } from 'react';
import { GlassPaper } from '../../../../shared/ui/GlassPaper';
import { MetricRow } from './MetricRow';
import { MetricConfig } from '../../types';
import { scrollbarStyles } from '../../../../app/theme/theme';

interface ComparisonTableProps {
    items: any[];
    metricsByCategory: Record<string, MetricConfig[]>;
    allMetricValues: Map<string, Map<string, string | number | null>>;
    allValueIndicators: Map<string, Map<string, any>>;
    onRemoveItem: (id: string) => void;
}

const METRICS_PER_BATCH = 20;

export const ComparisonTable = memo(({
    items,
    metricsByCategory,
    allMetricValues,
    allValueIndicators,
    onRemoveItem
}: ComparisonTableProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(Object.keys(metricsByCategory))
    );
    const [visibleMetricsCount, setVisibleMetricsCount] = useState<Map<string, number>>(new Map());

    // Initialize visible counts for each category (throttled for better performance)
    useEffect(() => {
        const scheduleUpdate = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 200 });
            } else {
                setTimeout(callback, 100);
            }
        };

        scheduleUpdate(() => {
            const initialCounts = new Map<string, number>();
            Object.entries(metricsByCategory).forEach(([category, metrics]) => {
                initialCounts.set(category, Math.min(METRICS_PER_BATCH, metrics.length));
            });
            setVisibleMetricsCount(initialCounts);
        });
    }, [metricsByCategory]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
                // Reset visible count when expanding
                setVisibleMetricsCount(prevCounts => {
                    const nextCounts = new Map(prevCounts);
                    const totalMetrics = metricsByCategory[category]?.length || 0;
                    nextCounts.set(category, Math.min(METRICS_PER_BATCH, totalMetrics));
                    return nextCounts;
                });
            }
            return next;
        });
    };

    // Load more metrics for a category (throttled for better performance)
    const loadMoreMetrics = (category: string) => {
        // Use requestIdleCallback if available, otherwise setTimeout for smoother loading
        const scheduleUpdate = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 100 });
            } else {
                setTimeout(callback, 50);
            }
        };

        scheduleUpdate(() => {
            setVisibleMetricsCount(prev => {
                const next = new Map(prev);
                const current = next.get(category) || 0;
                const total = metricsByCategory[category]?.length || 0;
                next.set(category, Math.min(current + METRICS_PER_BATCH, total));
                return next;
            });
        });
    };

    // Memoize visible metrics per category
    const visibleMetricsByCategory = useMemo(() => {
        const result: Record<string, MetricConfig[]> = {};
        Object.entries(metricsByCategory).forEach(([category, metrics]) => {
            const visibleCount = visibleMetricsCount.get(category) || METRICS_PER_BATCH;
            result[category] = metrics.slice(0, visibleCount);
        });
        return result;
    }, [metricsByCategory, visibleMetricsCount]);

    const headerCellSx = {
        fontWeight: 'bold',
        minWidth: 150,
        backgroundColor: (theme: Theme) =>
            theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
        borderBottom: '2px solid',
        borderColor: 'divider'
    };

    return (
        <Box sx={{ pb: 4 }}>
            <GlassPaper sx={{ overflow: 'hidden' }}>
                <TableContainer 
                    sx={{
                        ...scrollbarStyles,
                        overflowX: 'auto',
                        maxWidth: '100%',
                        '&::-webkit-scrollbar': {
                            height: { xs: 8, sm: 12 },
                        },
                    }}
                >
                    <Table size="small" sx={{ minWidth: { xs: 600, sm: 'auto' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ 
                                    ...headerCellSx, 
                                    left: 0, 
                                    zIndex: 11, 
                                    position: 'sticky', 
                                    minWidth: { xs: 150, sm: 200 }, 
                                    borderRight: '1px solid divider' 
                                }}>
                                    Metric
                                </TableCell>
                                {items.map(item => (
                                    <TableCell 
                                        key={item.id} 
                                        align="right" 
                                        sx={{ 
                                            ...headerCellSx,
                                            minWidth: { xs: 120, sm: 150 }
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'flex-end', 
                                            gap: { xs: 0.5, sm: 1 } 
                                        }}>
                                            <Typography 
                                                noWrap 
                                                variant="subtitle2"
                                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                            >
                                                {'isGroup' in item ? item.name : item.ticker}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => onRemoveItem(item.id)}
                                                sx={{ 
                                                    opacity: 0.7, 
                                                    '&:hover': { opacity: 1, color: 'error.main' },
                                                    padding: { xs: '4px', sm: '8px' }
                                                }}
                                            >
                                                <X size={isMobile ? 12 : 14} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(metricsByCategory).map(([category, allMetrics]) => {
                                const isExpanded = expandedCategories.has(category);
                                const visibleMetrics = visibleMetricsByCategory[category] || [];
                                const totalMetrics = allMetrics.length;
                                const visibleCount = visibleMetrics.length;
                                const hasMore = visibleCount < totalMetrics;

                                return (
                                    <React.Fragment key={category}>
                                        {/* Category Header Row */}
                                        <TableRow 
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                            onClick={() => toggleCategory(category)}
                                        >
                                            <TableCell 
                                                colSpan={items.length + 1}
                                                sx={{ 
                                                    bgcolor: 'transparent',
                                                    py: 1,
                                                    borderBottom: '2px solid',
                                                    borderColor: 'divider',
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 10
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconButton size="small" sx={{ p: 0.5 }}>
                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </IconButton>
                                                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                                        {category}
                                                    </Typography>
                                                    {isExpanded && hasMore && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            ({visibleCount} / {totalMetrics})
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        {/* Metrics in this category - lazy loaded */}
                                        {isExpanded && visibleMetrics.map(metric => {
                                            // Calculate min/max for row visualization (only for numeric values)
                                            const rowValues = items
                                                .map(item => allMetricValues.get(metric.id)?.get(item.id) ?? null)
                                                .filter((v): v is number => typeof v === 'number' && v !== null);
                                            const max = rowValues.length > 0 ? Math.max(...rowValues) : undefined;
                                            const min = rowValues.length > 0 ? Math.min(...rowValues) : undefined;

                                            return (
                                                <MetricRow
                                                    key={metric.id}
                                                    metric={metric}
                                                    items={items}
                                                    values={allMetricValues.get(metric.id) || new Map()}
                                                    indicators={allValueIndicators.get(metric.id) || new Map()}
                                                    onRemoveItem={onRemoveItem}
                                                    maxValue={max}
                                                    minValue={min}
                                                />
                                            );
                                        })}
                                        {/* Load More Button */}
                                        {isExpanded && hasMore && (
                                            <TableRow>
                                                <TableCell colSpan={items.length + 1} align="center" sx={{ py: 2 }}>
                                                    <Box
                                                        component="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            loadMoreMetrics(category);
                                                        }}
                                                        sx={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: 'primary.main',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline',
                                                            fontSize: '0.875rem',
                                                            '&:hover': { color: 'primary.dark' }
                                                        }}
                                                    >
                                                        Load more ({totalMetrics - visibleCount} remaining)
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassPaper>
        </Box>
    );
});

ComparisonTable.displayName = 'ComparisonTable';
