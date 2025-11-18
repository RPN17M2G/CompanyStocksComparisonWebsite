import { Box, Grid, Typography, Theme } from '@mui/material';
import { Award } from 'lucide-react';
import { GlassPaper } from '../../../shared/ui/GlassPaper';
import { MetricRadarChart } from '../../../shared/components/MetricRadarChart';
import { HighPriorityMetricsDashboard } from './HighPriorityMetricsDashboard';
import { useMemo } from 'react';
import { Company, ComparisonGroup, RawFinancialData } from '../../../shared/types/types';
import { MetricConfig, MetricDefinition } from '../types';

interface ComparisonSummaryProps {
    scores: any[];
    items: (Company | ComparisonGroup)[];
    itemsData: Map<string, RawFinancialData>;
    visibleMetrics: MetricConfig[];
    metricDefinitions: Map<string, MetricDefinition>;
    allMetricValues: Map<string, Map<string, string | number | null>>;
    allValueIndicators: Map<string, Map<string, any>>;
}

export function ComparisonSummary({ 
    scores, 
    items, 
    itemsData, 
    visibleMetrics,
    metricDefinitions,
    allMetricValues,
    allValueIndicators
}: ComparisonSummaryProps) {
    if (scores.length === 0) return null;

    // Prepare radar chart data for high priority numeric metrics
    const radarChartData = useMemo(() => {
        if (!visibleMetrics || !Array.isArray(visibleMetrics) || !metricDefinitions || !items || !itemsData) {
            return { metrics: [], items: [] };
        }

        // Get high priority metrics (priority >= 8)
        const highPriorityMetrics = visibleMetrics
            .filter(m => m && m.priority >= 8)
            .sort((a, b) => b.priority - a.priority);

        // Filter to only numeric metrics (currency, percentage, ratio, and number are all numeric)
        const numericMetrics = highPriorityMetrics
            .filter(metric => {
                // Check if format is numeric (currency, percentage, ratio, or number)
                const isNumericFormat = ['currency', 'percentage', 'ratio', 'number'].includes(metric.format);
                if (!isNumericFormat) return false;
                
                // Also verify there are actual numeric values
                const values = allMetricValues?.get(metric.id);
                return values && Array.from(values.values()).some(v => typeof v === 'number');
            })
            .map(metric => {
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
            })
            .filter(Boolean) as Array<{
                metricId: string;
                metricName: string;
                calculateValue: (data: RawFinancialData) => number | null;
                format: string;
                betterDirection?: 'higher' | 'lower';
            }>;

        const radarItems = items
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

        return { metrics: numericMetrics, items: radarItems };
    }, [visibleMetrics, metricDefinitions, items, itemsData, allMetricValues]);

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 3, position: 'relative', alignItems: 'flex-start', minHeight: '600px' }}>
                {/* Left side: Scores and Key Metrics */}
                <Box sx={{ flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* Left Header */}
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: 40 }}>
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
                            fontSize: '1.5rem',
                            lineHeight: 1.2
                        }}>
                            Overall Performance
                        </Typography>
                    </Box>

                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {scores.map((score) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={score.itemId}>
                                <GlassPaper
                            sx={{
                                p: 3.5,
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: score.rank === 1 ? '2px solid' : '1px solid',
                                borderColor: score.rank === 1 
                                    ? 'success.main' 
                                    : (theme: Theme) => theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(0, 0, 0, 0.1)',
                                background: (theme: Theme) => 
                                    score.rank === 1
                                        ? theme.palette.mode === 'dark'
                                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(18, 30, 54, 0.85) 100%)'
                                            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.85) 100%)'
                                        : theme.palette.mode === 'dark'
                                            ? 'rgba(18, 30, 54, 0.85)'
                                            : 'rgba(255, 255, 255, 0.85)',
                                boxShadow: (theme: Theme) => 
                                    score.rank === 1
                                        ? `0 8px 32px rgba(16, 185, 129, 0.3), ${theme.shadows[4]}`
                                        : theme.shadows[4],
                                '&:hover': {
                                    transform: 'translateY(-8px) scale(1.02)',
                                    boxShadow: (theme: Theme) => 
                                        score.rank === 1
                                            ? `0 12px 40px rgba(16, 185, 129, 0.4), ${theme.shadows[8]}`
                                            : theme.shadows[8],
                                },
                                '&::before': score.rank === 1 ? {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 3s ease-in-out infinite',
                                    '@keyframes shimmer': {
                                        '0%': { backgroundPosition: '200% 0' },
                                        '100%': { backgroundPosition: '-200% 0' }
                                    }
                                } : {}
                            }}
                        >
                            {score.rank === 1 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        backgroundColor: 'success.main',
                                        borderRadius: '50%',
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                                        animation: 'pulse 2s ease-in-out infinite',
                                        '@keyframes pulse': {
                                            '0%, 100%': { transform: 'scale(1)' },
                                            '50%': { transform: 'scale(1.1)' }
                                        }
                                    }}
                                >
                                    <Award size={20} color="white" />
                                </Box>
                            )}
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="600" 
                                noWrap 
                                sx={{ mb: 2, fontSize: '1.1rem' }}
                            >
                                {score.itemName}
                            </Typography>
                            <Typography 
                                variant="h1" 
                                sx={{ 
                                    mb: 1,
                                    fontWeight: '800',
                                    background: (theme: Theme) => 
                                        theme.palette.mode === 'dark'
                                            ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                                            : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' }
                                }}
                            >
                                {score.totalScore.toFixed(1)}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 2,
                                    py: 0.75,
                                    borderRadius: 3,
                                    backgroundColor: (theme: Theme) =>
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                    border: '1px solid',
                                    borderColor: (theme: Theme) =>
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(255, 255, 255, 0.1)'
                                            : 'rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    fontWeight="600"
                                    sx={{
                                        color: (theme: Theme) =>
                                            score.rank === 1
                                                ? 'success.main'
                                                : theme.palette.text.secondary
                                    }}
                                >
                                    Rank #{score.rank}
                                </Typography>
                            </Box>
                                </GlassPaper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Horizontal Separator */}
                    <Box
                        sx={{
                            width: '100%',
                            height: '1px',
                            my: 4,
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), rgba(167, 139, 250, 0.4), transparent)'
                                    : 'linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.3), rgba(124, 58, 237, 0.3), transparent)',
                            opacity: 0.7
                        }}
                    />

                    {/* Key Metrics Dashboard - Also on the left */}
                    <Box>
                        <HighPriorityMetricsDashboard
                            items={items}
                            itemsData={itemsData}
                            visibleMetrics={visibleMetrics}
                            metricDefinitions={metricDefinitions}
                            allMetricValues={allMetricValues}
                            allValueIndicators={allValueIndicators}
                        />
                    </Box>
                </Box>

                {/* Enhanced Animated Light Strip Separator with Special Effects */}
                <Box 
                    sx={{ 
                        display: { xs: 'none', md: 'flex' },
                        width: '4px',
                        alignSelf: 'stretch',
                        position: 'relative',
                        flexShrink: 0,
                        minHeight: '600px',
                        overflow: 'visible',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'linear-gradient(180deg, rgba(96, 165, 250, 0.4), rgba(167, 139, 250, 0.5), rgba(16, 185, 129, 0.4), rgba(167, 139, 250, 0.5), rgba(96, 165, 250, 0.4))'
                                    : 'linear-gradient(180deg, rgba(37, 99, 235, 0.3), rgba(124, 58, 237, 0.4), rgba(16, 185, 129, 0.3), rgba(124, 58, 237, 0.4), rgba(37, 99, 235, 0.3))',
                            backgroundSize: '100% 200%',
                            borderRadius: 2,
                            animation: 'gradientFlow 8s ease-in-out infinite',
                            '@keyframes gradientFlow': {
                                '0%': { backgroundPosition: '0% 0%' },
                                '50%': { backgroundPosition: '0% 100%' },
                                '100%': { backgroundPosition: '0% 0%' }
                            },
                            boxShadow: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? '0 0 20px rgba(96, 165, 250, 0.3), 0 0 40px rgba(167, 139, 250, 0.2), inset 0 0 20px rgba(16, 185, 129, 0.1)'
                                    : '0 0 20px rgba(37, 99, 235, 0.25), 0 0 40px rgba(124, 58, 237, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.08)',
                            zIndex: 1,
                            opacity: 1
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'radial-gradient(circle, rgba(96, 165, 250, 0.8), rgba(167, 139, 250, 0.4))'
                                    : 'radial-gradient(circle, rgba(37, 99, 235, 0.7), rgba(124, 58, 237, 0.3))',
                            boxShadow: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? '0 0 25px rgba(96, 165, 250, 0.6), 0 0 50px rgba(167, 139, 250, 0.3), 0 0 75px rgba(16, 185, 129, 0.2)'
                                    : '0 0 25px rgba(37, 99, 235, 0.5), 0 0 50px rgba(124, 58, 237, 0.25), 0 0 75px rgba(16, 185, 129, 0.15)',
                            animation: 'pulseGlow 4s ease-in-out infinite',
                            '@keyframes pulseGlow': {
                                '0%, 100%': { 
                                    transform: 'translate(-50%, -50%) scale(1)',
                                    opacity: 0.6
                                },
                                '50%': { 
                                    transform: 'translate(-50%, -50%) scale(1.2)',
                                    opacity: 1
                                }
                            },
                            zIndex: 2
                        }
                    }}
                >
                    {/* Floating particles/shapes */}
                    {[...Array(6)].map((_, i) => (
                        <Box
                            key={i}
                            sx={{
                                position: 'absolute',
                                left: '50%',
                                top: `${15 + i * 15}%`,
                                transform: 'translateX(-50%)',
                                width: i % 2 === 0 ? '6px' : '4px',
                                height: i % 2 === 0 ? '6px' : '4px',
                                borderRadius: i % 3 === 0 ? '50%' : '2px',
                                background: (theme: Theme) =>
                                    theme.palette.mode === 'dark'
                                        ? `rgba(${i % 2 === 0 ? '96, 165, 250' : '167, 139, 250'}, ${0.4 + i * 0.1})`
                                        : `rgba(${i % 2 === 0 ? '37, 99, 235' : '124, 58, 237'}, ${0.3 + i * 0.1})`,
                                boxShadow: (theme: Theme) =>
                                    theme.palette.mode === 'dark'
                                        ? `0 0 ${8 + i * 2}px rgba(${i % 2 === 0 ? '96, 165, 250' : '167, 139, 250'}, 0.5)`
                                        : `0 0 ${8 + i * 2}px rgba(${i % 2 === 0 ? '37, 99, 235' : '124, 58, 237'}, 0.4)`,
                                animation: `float${i} ${6 + i * 0.5}s ease-in-out infinite`,
                                [`@keyframes float${i}`]: {
                                    '0%, 100%': {
                                        transform: `translateX(-50%) translateY(${i % 2 === 0 ? '0' : '-10'}px) scale(1)`,
                                        opacity: 0.4
                                    },
                                    '50%': {
                                        transform: `translateX(-50%) translateY(${i % 2 === 0 ? '10' : '0'}px) scale(${1.2 + i * 0.1})`,
                                        opacity: 0.8
                                    }
                                },
                                zIndex: 3
                            }}
                        />
                    ))}
                    
                    {/* Fog/glow effect on sides */}
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '-20px',
                            top: 0,
                            width: '40px',
                            height: '100%',
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'radial-gradient(ellipse at center, rgba(96, 165, 250, 0.15) 0%, transparent 70%)'
                                    : 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                            zIndex: 0,
                            animation: 'fogPulse 6s ease-in-out infinite',
                            '@keyframes fogPulse': {
                                '0%, 100%': { opacity: 0.3 },
                                '50%': { opacity: 0.6 }
                            }
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            right: '-20px',
                            top: 0,
                            width: '40px',
                            height: '100%',
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.15) 0%, transparent 70%)'
                                    : 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                            zIndex: 0,
                            animation: 'fogPulse 6s ease-in-out infinite 3s',
                            '@keyframes fogPulse': {
                                '0%, 100%': { opacity: 0.3 },
                                '50%': { opacity: 0.6 }
                            }
                        }}
                    />
                </Box>

                {/* Right side: Radar Chart and Bar Charts */}
                <Box 
                    sx={{ 
                        flex: '1 1 50%',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        minWidth: 0,
                        gap: 3
                    }}
                >
                    {/* Right Header */}
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: 40, alignSelf: 'flex-start' }}>
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
                            fontSize: '1.5rem',
                            lineHeight: 1.2
                        }}>
                            High Priority Metrics
                        </Typography>
                    </Box>

                    {/* Radar Chart - Always show, displays empty state if < 3 metrics */}
                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                        <MetricRadarChart
                            title=""
                            metrics={radarChartData.metrics.length >= 3 ? radarChartData.metrics : []}
                            items={radarChartData.items}
                            height={500}
                        />
                    </Box>

                    {/* Horizontal Separator */}
                    <Box
                        sx={{
                            width: '100%',
                            height: '1px',
                            my: 3,
                            background: (theme: Theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), rgba(167, 139, 250, 0.4), transparent)'
                                    : 'linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.3), rgba(124, 58, 237, 0.3), transparent)',
                            opacity: 0.7
                        }}
                    />

                    {/* Bar Charts - Below Radar */}
                    <Box sx={{ width: '100%' }}>
                        <HighPriorityMetricsDashboard
                            items={items}
                            itemsData={itemsData}
                            visibleMetrics={visibleMetrics}
                            metricDefinitions={metricDefinitions}
                            allMetricValues={allMetricValues}
                            allValueIndicators={allValueIndicators}
                            showOnlyCharts={true}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
