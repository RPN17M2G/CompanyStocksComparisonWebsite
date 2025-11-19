import { Box, Button, IconButton, Typography, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { ArrowLeft, Download, FolderOpen, Plus, Settings, Calculator } from 'lucide-react';
import { GlassPaper } from '../../../shared/ui/GlassPaper';

interface ComparisonHeaderProps {
    onClose: () => void;
    onAdd: () => void;
    onConfigure: () => void;
    onTemplates: (anchor: HTMLElement) => void;
    onExport: (anchor: HTMLElement) => void;
    onShowScoringConfig?: () => void;
    isLoading?: boolean;
}

export function ComparisonHeader({
    onClose,
    onAdd,
    onConfigure,
    onTemplates,
    onExport,
    onShowScoringConfig,
    isLoading
}: ComparisonHeaderProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    return (
        <GlassPaper elevation={0} sx={{
            p: { xs: 1, sm: 2 }, 
            borderRadius: 0, 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            zIndex: 1200,
            flexShrink: 0,
            gap: { xs: 1, sm: 0 }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <IconButton onClick={onClose} size={isMobile ? 'small' : 'medium'}>
                    <ArrowLeft size={isMobile ? 18 : 24} />
                </IconButton>
                <Typography 
                    variant="h5"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                >
                    Comparison Dashboard
                </Typography>
            </Box>
            <Box sx={{ 
                display: 'flex', 
                gap: { xs: 0.5, sm: 1 },
                flexWrap: 'wrap',
                justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}>
                {onShowScoringConfig && (
                    <IconButton
                        onClick={onShowScoringConfig}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ display: { xs: 'flex', sm: 'none' } }}
                        title="Score Config"
                    >
                        <Calculator size={16} />
                    </IconButton>
                )}
                {onShowScoringConfig && (
                    <Button
                        onClick={onShowScoringConfig}
                        startIcon={<Calculator size={16} />}
                        variant="outlined"
                        color="secondary"
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                        Score Config
                    </Button>
                )}
                <IconButton
                    onClick={(e) => onTemplates(e.currentTarget)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                    title="Templates"
                >
                    <FolderOpen size={16} />
                </IconButton>
                <Button 
                    onClick={(e) => onTemplates(e.currentTarget)} 
                    startIcon={<FolderOpen />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                    Templates
                </Button>
                <IconButton
                    onClick={(e) => onExport(e.currentTarget)}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                    title="Export"
                >
                    <Download size={16} />
                </IconButton>
                <Button 
                    onClick={(e) => onExport(e.currentTarget)} 
                    startIcon={<Download />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                    Export
                </Button>
                <IconButton
                    onClick={onConfigure}
                    disabled={isLoading}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                    title="Grid Control"
                >
                    {isLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <Settings size={16} />}
                </IconButton>
                <Button 
                    onClick={onConfigure} 
                    startIcon={isLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <Settings />}
                    disabled={isLoading}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ display: { xs: 'none', sm: 'flex' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                    Grid Control
                </Button>
                <Button 
                    variant="contained" 
                    onClick={onAdd} 
                    startIcon={<Plus />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                    Add
                </Button>
            </Box>
        </GlassPaper>
    );
}
