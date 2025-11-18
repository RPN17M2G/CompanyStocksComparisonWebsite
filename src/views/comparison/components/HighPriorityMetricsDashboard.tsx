import { Box, Grid, Typography, Theme, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { GlassPaper } from '../../../shared/ui/GlassPaper';
import { MetricRadarChart } from '../../../shared/components/MetricRadarChart';
import { MetricRingChart } from '../../../shared/components/MetricRingChart';
import { Company, ComparisonGroup, RawFinancialData } from '../../../shared/types/types';
import { MetricConfig, MetricDefinition } from '../types';
import { MetricValueDisplay } from './MetricValueDisplay';

interface HighPriorityMetricsDashboardProps {
    items: (Company | ComparisonGroup)[];
    itemsData: Map<string, RawFinancialData>;
    visibleMetrics: MetricConfig[];
    metricDefinitions: Map<string, MetricDefinition>;
    allMetricValues: Map<string, Map<string, string | number | null>>;
    allValueIndicators: Map<string, Map<string, any>>;
    showOnlyCharts?: boolean;
}

export function HighPriorityMetricsDashboard({
    items,
    itemsData,
    visibleMetrics,
    metricDefinitions,
    allMetricValues,
    allValueIndicators,
    showOnlyCharts = false
}: HighPriorityMetricsDashboardProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    
    // Get high priority metrics (priority >= 8)
    const highPriorityMetrics = useMemo(() => {
        if (!visibleMetrics || !Array.isArray(visibleMetrics)) return [];
        return visibleMetrics
            .filter(m => m && m.priority >= 8)
            .sort((a, b) => b.priority - a.priority);
    }, [visibleMetrics]);

    // Separate numeric and string metrics
    const { numericMetrics, stringMetrics } = useMemo(() => {
        const numeric: MetricConfig[] = [];
        const string: MetricConfig[] = [];

        if (!highPriorityMetrics || !Array.isArray(highPriorityMetrics)) {
            return { numericMetrics: [], stringMetrics: [] };
        }

        highPriorityMetrics.forEach(metric => {
            if (!metric) return;
            const def = metricDefinitions?.get(metric.id);
            if (!def) return;

            // Check if format is numeric (currency, percentage, ratio, or number are all numeric)
            const isNumericFormat = ['currency', 'percentage', 'ratio', 'number'].includes(metric.format);
            
            // Also verify there are actual numeric values
            const values = allMetricValues?.get(metric.id);
            const hasNumeric = values && Array.from(values.values()).some(v => typeof v === 'number');

            if (isNumericFormat && hasNumeric) {
                numeric.push(metric);
            } else {
                string.push(metric);
            }
        });

        return { numericMetrics: numeric, stringMetrics: string };
    }, [highPriorityMetrics, metricDefinitions, allMetricValues]);

    // Ensure numericMetrics is always an array
    const safeNumericMetrics = Array.isArray(numericMetrics) ? numericMetrics : [];

    // Prepare radar chart data
    const radarChartMetrics = useMemo(() => {
        if (!safeNumericMetrics || safeNumericMetrics.length === 0 || !metricDefinitions) return [];
        return safeNumericMetrics.map(metric => {
            if (!metric) return null;
            const def = metricDefinitions.get(metric.id);
            if (!def) return null;

            return {
                metricId: metric.id,
                metricName: metric.name,
                calculateValue: (data: RawFinancialData) => {
                    const value = def.calculateValue(data);
                    return typeof value === 'number' ? value : null;
                },
                format: metric.format,
                betterDirection: metric.betterDirection
            };
        }).filter(Boolean) as Array<{
            metricId: string;
            metricName: string;
            calculateValue: (data: RawFinancialData) => number | null;
            format: string;
            betterDirection?: 'higher' | 'lower';
        }>;
    }, [safeNumericMetrics, metricDefinitions]);

    const radarChartItems = useMemo(() => {
        if (!items || !Array.isArray(items) || !itemsData) return [];
        return items
            .map(item => {
                if (!item) return null;
                const data = itemsData.get(item.id);
                if (!data) return null;
                return {
                    id: item.id,
                    name: 'isGroup' in item ? item.name : item.ticker,
                    data: data
                };
            })
            .filter((item): item is { id: string; name: string; data: RawFinancialData } => item !== null);
    }, [items, itemsData]);

    if (!highPriorityMetrics || highPriorityMetrics.length === 0) return null;

    // If showOnlyCharts is true, only show the bar charts without the header and tiles
    if (showOnlyCharts) {
        if (safeNumericMetrics.length === 0) return null;
        return (
            <Grid container spacing={3} justifyContent="center">
                {safeNumericMetrics.slice(0, 3).map(metric => {
                    const def = metricDefinitions?.get(metric.id);
                    if (!def) return null;

                    return (
                        <Grid item xs={12} md={6} lg={4} key={metric.id}>
                            <Box
                                sx={{
                                    p: 0,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 4,
                                    background: isDark
                                        ? 'linear-gradient(135deg, rgba(18, 30, 54, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 252, 0.5) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid',
                                    borderColor: isDark
                                        ? 'rgba(96, 165, 250, 0.15)'
                                        : 'rgba(37, 99, 235, 0.12)',
                                    boxShadow: isDark
                                        ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(96, 165, 250, 0.1)'
                                        : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(37, 99, 235, 0.08)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '3px',
                                        background: isDark
                                            ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.6), rgba(167, 139, 250, 0.6), transparent)'
                                            : 'linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.4), rgba(124, 58, 237, 0.4), transparent)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 3s ease-in-out infinite',
                                        '@keyframes shimmer': {
                                            '0%': { backgroundPosition: '200% 0' },
                                            '100%': { backgroundPosition: '-200% 0' }
                                        },
                                        opacity: 0,
                                        transition: 'opacity 0.3s',
                                    },
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: -50,
                                        right: -50,
                                        width: '150px',
                                        height: '150px',
                                        borderRadius: '50%',
                                        background: isDark
                                            ? 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)'
                                            : 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
                                        pointerEvents: 'none',
                                        transition: 'all 0.4s',
                                    },
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        borderColor: isDark
                                            ? 'rgba(96, 165, 250, 0.4)'
                                            : 'rgba(37, 99, 235, 0.3)',
                                        boxShadow: isDark
                                            ? '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(96, 165, 250, 0.2), 0 0 60px rgba(96, 165, 250, 0.1)'
                                            : '0 16px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(37, 99, 235, 0.15), 0 0 60px rgba(37, 99, 235, 0.08)',
                                        '&::before': {
                                            opacity: 1,
                                        },
                                        '&::after': {
                                            transform: 'scale(1.5)',
                                            opacity: 0.6,
                                        }
                                    }
                                }}
                            >
                                {/* Chart */}
                                <Box sx={{ flex: 1, position: 'relative', zIndex: 1, p: 2 }}>
                                    <MetricRingChart
                                        metricName={metric.name}
                                        metricId={metric.id}
                                        items={items.map(item => ({
                                            id: item.id,
                                            name: 'isGroup' in item ? item.name : item.ticker
                                        }))}
                                        itemsData={itemsData}
                                        calculateValue={(data: RawFinancialData) => {
                                            const value = def.calculateValue(data);
                                            return typeof value === 'number' ? value : null;
                                        }}
                                        format={metric.format}
                                        betterDirection={metric.betterDirection}
                                    />
                                </Box>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        );
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    sx={{
                        width: 4,
                        height: 28,
                        borderRadius: 2,
                        background: (theme: Theme) =>
                            theme.palette.mode === 'dark'
                                ? 'linear-gradient(180deg, #60a5fa 0%, #a78bfa 100%)'
                                : 'linear-gradient(180deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: (theme: Theme) =>
                            theme.palette.mode === 'dark'
                                ? '0 0 12px rgba(96, 165, 250, 0.5)'
                                : '0 0 12px rgba(37, 99, 235, 0.3)'
                    }}
                />
                <Typography variant="h5" fontWeight="700" sx={{ 
                    background: (theme: Theme) => 
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                            : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '1.5rem'
                }}>
                    Key Metrics Dashboard
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Metric Tiles Grid */}
                {highPriorityMetrics.length > 0 && (
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {highPriorityMetrics.map(metric => {
                                const values = allMetricValues?.get(metric.id) || new Map();
                                const indicators = allValueIndicators?.get(metric.id) || new Map();

                                return (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={metric.id}>
                                        <GlassPaper
                                            sx={{
                                                p: 3,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                background: (theme: Theme) =>
                                                    theme.palette.mode === 'dark'
                                                        ? 'rgba(18, 30, 54, 0.85)'
                                                        : 'rgba(255, 255, 255, 0.85)',
                                                border: '1px solid',
                                                borderColor: (theme: Theme) =>
                                                    theme.palette.mode === 'dark'
                                                        ? 'rgba(255, 255, 255, 0.1)'
                                                        : 'rgba(0, 0, 0, 0.1)',
                                                boxShadow: (theme: Theme) => theme.shadows[4],
                                                '&:hover': {
                                                    transform: 'translateY(-8px)',
                                                    boxShadow: (theme: Theme) => theme.shadows[12],
                                                    borderColor: (theme: Theme) =>
                                                        theme.palette.mode === 'dark'
                                                            ? 'rgba(96, 165, 250, 0.3)'
                                                            : 'rgba(37, 99, 235, 0.3)',
                                                },
                                                '&::after': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background: (theme: Theme) =>
                                                        theme.palette.mode === 'dark'
                                                            ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent)'
                                                            : 'linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.3), transparent)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.3s',
                                                },
                                                '&:hover::after': {
                                                    opacity: 1,
                                                }
                                            }}
                                        >
                                            <Typography 
                                                variant="subtitle1" 
                                                fontWeight="700" 
                                                sx={{ 
                                                    mb: 2.5, 
                                                    minHeight: 48,
                                                    fontSize: '1.1rem',
                                                    lineHeight: 1.4
                                                }}
                                            >
                                                {metric.name}
                                            </Typography>
                                            
                                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {items.map(item => {
                                                    const value = values.get(item.id) ?? null;
                                                    const indicator = indicators.get(item.id) ?? null;
                                                    const itemName = 'isGroup' in item ? item.name : item.ticker;

                                                    return (
                                                        <Box
                                                            key={item.id}
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                p: 2,
                                                                borderRadius: 2.5,
                                                                backgroundColor: (theme: Theme) =>
                                                                    theme.palette.mode === 'dark'
                                                                        ? indicator === 'best'
                                                                            ? 'rgba(16, 185, 129, 0.15)'
                                                                            : 'rgba(255, 255, 255, 0.05)'
                                                                        : indicator === 'best'
                                                                            ? 'rgba(16, 185, 129, 0.08)'
                                                                            : 'rgba(0, 0, 0, 0.02)',
                                                                border: '1px solid',
                                                                borderColor: indicator === 'best' 
                                                                    ? 'success.main' 
                                                                    : (theme: Theme) =>
                                                                        theme.palette.mode === 'dark'
                                                                            ? 'rgba(255, 255, 255, 0.08)'
                                                                            : 'rgba(0, 0, 0, 0.08)',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    backgroundColor: (theme: Theme) =>
                                                                        theme.palette.mode === 'dark'
                                                                            ? 'rgba(255, 255, 255, 0.08)'
                                                                            : 'rgba(0, 0, 0, 0.04)',
                                                                    transform: 'translateX(4px)',
                                                                }
                                                            }}
                                                        >
                                                            <Typography 
                                                                variant="body2" 
                                                                fontWeight="600"
                                                                sx={{ fontSize: '0.9rem' }}
                                                            >
                                                                {itemName}
                                                            </Typography>
                                                            <MetricValueDisplay
                                                                value={value}
                                                                indicator={indicator}
                                                                format={metric.format}
                                                            />
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </GlassPaper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

