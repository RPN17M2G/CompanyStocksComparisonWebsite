import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Typography } from '@mui/material';
import { memo } from 'react';
import { MetricConfig } from '../../types';

interface MetricConfigItemProps {
    config: MetricConfig;
    onToggleVisibility: () => void;
    onUpdatePriority: (priority: number) => void;
}

export const MetricConfigItem = memo(({
    config,
    onToggleVisibility,
    onUpdatePriority,
}: MetricConfigItemProps) => {
    return (
        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    <Button
                        size="small"
                        variant={config.isVisible ? 'contained' : 'outlined'}
                        onClick={onToggleVisibility}
                        sx={{ minWidth: 80 }}
                    >
                        {config.isVisible ? 'Visible' : 'Hidden'}
                    </Button>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="500" noWrap>{config.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {config.category} {config.subcategory ? `• ${config.subcategory}` : ''}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                            value={config.priority}
                            label="Priority"
                            onChange={(e) => onUpdatePriority(Number(e.target.value))}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                                <MenuItem key={p} value={p}>{p}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        </Paper>
    );
});

MetricConfigItem.displayName = 'MetricConfigItem';
