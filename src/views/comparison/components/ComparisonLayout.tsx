import { Box, CircularProgress, Fade, LinearProgress, Theme, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { scrollbarStyles } from '../../../app/theme/theme';

interface ComparisonLayoutProps {
    children: ReactNode;
    isLoading?: boolean;
    isInitialLoad?: boolean;
}

export function ComparisonLayout({ children, isLoading, isInitialLoad }: ComparisonLayoutProps) {
    return (
        <Box sx={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: (theme: Theme) => theme.palette.mode === 'dark'
                ? `linear-gradient(-45deg, ${theme.palette.background.default}, #1e40af)`
                : `linear-gradient(-45deg, ${theme.palette.background.default}, #93c5fd)`,
            backgroundSize: 'cover',
        }}>
            {isInitialLoad ? (
                <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                }}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" color="text.secondary">
                        Loading comparison data...
                    </Typography>
                </Box>
            ) : isLoading ? (
                <Box sx={{ width: '100%', mt: '64px' }}>
                    <LinearProgress />
                </Box>
            ) : (
                <Fade in={!isLoading}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {children}
                    </Box>
                </Fade>
            )}
        </Box>
    );
}
