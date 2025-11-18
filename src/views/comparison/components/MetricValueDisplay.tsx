import { Box, Tooltip, Typography } from '@mui/material';
import { AlertCircle, Award, CheckCircle2, XCircle } from 'lucide-react';
import { memo } from 'react';
import { formatMetricValue } from '../../../engine/metricCalculator';

interface MetricValueDisplayProps {
    value: string | number | null;
    indicator: 'best' | 'worst' | 'good' | 'bad' | null;
    format: string;
}

export const MetricValueDisplay = memo(({ value, indicator, format }: MetricValueDisplayProps) => {
    const formatted = formatMetricValue(value, format);

    const iconProps = { size: 16 };
    let icon = null;
    let color: string | undefined;

    if (indicator === 'best') {
        icon = <Award {...iconProps} />;
        color = 'success.main';
    } else if (indicator === 'worst') {
        icon = <XCircle {...iconProps} />;
        color = 'error.main';
    } else if (indicator === 'good') {
        icon = <CheckCircle2 {...iconProps} />;
        color = 'success.light';
    } else if (indicator === 'bad') {
        icon = <AlertCircle {...iconProps} />;
        color = 'error.light';
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Typography variant="body2" sx={{ fontWeight: indicator === 'best' ? 'bold' : 'normal' }}>
                {formatted ?? '-'}
            </Typography>
            {icon && (
                <Tooltip title={indicator || ''}>
                    <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
                        {icon}
                    </Box>
                </Tooltip>
            )}
        </Box>
    );
});

MetricValueDisplay.displayName = 'MetricValueDisplay';
