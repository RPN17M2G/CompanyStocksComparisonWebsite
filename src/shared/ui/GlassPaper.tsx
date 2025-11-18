import { Paper, Theme, PaperProps } from '@mui/material';
import { memo } from 'react';

export const GlassPaper = memo(({ children, sx, ...props }: PaperProps) => (
    <Paper
        {...props}
        sx={{
            backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: (theme: Theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            boxShadow: (theme: Theme) => theme.shadows[4],
            transition: 'box-shadow 0.3s ease',
            ...sx,
        }}
    >
        {children}
    </Paper>
));

GlassPaper.displayName = 'GlassPaper';
