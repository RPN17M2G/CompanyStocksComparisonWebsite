import { Box, Chip, TableCell, TableRow, Theme, Tooltip } from '@mui/material';
import { memo } from 'react';
import { MetricConfig } from '../../types';
import { MetricValueDisplay } from '../MetricValueDisplay';

interface MetricRowProps {
    metric: MetricConfig;
    items: any[];
    values: Map<string, string | number | null>;
    indicators: Map<string, any>;
    onRemoveItem?: (id: string) => void;
    maxValue?: number;
    minValue?: number;
}

export const MetricRow = memo(({
    metric,
    items,
    values,
    indicators,
    maxValue,
    minValue
}: MetricRowProps) => {
    return (
        <TableRow
            sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                transition: 'background-color 0.2s ease',
            }}
        >
            <TableCell sx={{
                fontWeight: metric.priority >= 8 ? '600' : 'normal',
                position: 'sticky',
                left: 0,
                zIndex: 9,
                backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRight: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={metric.category}>
                        <Box component="span">{metric.name}</Box>
                    </Tooltip>
                    {metric.priority >= 8 && (
                        <Chip label={`P${metric.priority}`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    )}
                </Box>
            </TableCell>
            {items.map((item) => {
                const value = values.get(item.id) ?? null;
                const indicator = indicators.get(item.id) ?? null;

                // Simple bar visualization (only for numeric values)
                let barWidth = 0;
                if (typeof value === 'number' && value !== null && maxValue !== undefined && minValue !== undefined && maxValue !== minValue) {
                    // Normalize between 0 and 100
                    barWidth = ((value - minValue) / (maxValue - minValue)) * 100;
                    // Clamp
                    barWidth = Math.max(0, Math.min(100, barWidth));
                }

                return (
                    <TableCell key={item.id} align="right" sx={{ position: 'relative' }}>
                        {/* Background Bar (only for numeric values) */}
                        {typeof value === 'number' && value !== null && (
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '4px',
                                width: `${barWidth}%`,
                                bgcolor: indicator === 'best' ? 'success.main' : indicator === 'worst' ? 'error.main' : 'primary.main',
                                opacity: 0.3,
                                transition: 'width 0.5s ease'
                            }} />
                        )}
                        <MetricValueDisplay value={value} indicator={indicator} format={metric.format} />
                    </TableCell>
                );
            })}
        </TableRow>
    );
}, (prev, next) => {
    return prev.metric === next.metric &&
        prev.items === next.items &&
        prev.values === next.values &&
        prev.indicators === next.indicators;
});

MetricRow.displayName = 'MetricRow';
