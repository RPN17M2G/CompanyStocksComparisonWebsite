import { Box, Button, IconButton, Typography, CircularProgress } from '@mui/material';
import { ArrowLeft, Download, FolderOpen, Plus, Settings } from 'lucide-react';
import { GlassPaper } from '../../../shared/ui/GlassPaper';

interface ComparisonHeaderProps {
    onClose: () => void;
    onAdd: () => void;
    onConfigure: () => void;
    onTemplates: (anchor: HTMLElement) => void;
    onExport: (anchor: HTMLElement) => void;
    isLoading?: boolean;
}

export function ComparisonHeader({
    onClose,
    onAdd,
    onConfigure,
    onTemplates,
    onExport,
    isLoading
}: ComparisonHeaderProps) {
    return (
        <GlassPaper elevation={0} sx={{
            p: 2, borderRadius: 0, display: 'flex',
            justifyContent: 'space-between', zIndex: 1200,
            flexShrink: 0
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onClose}><ArrowLeft /></IconButton>
                <Typography variant="h5">Comparison Dashboard</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={(e) => onTemplates(e.currentTarget)} startIcon={<FolderOpen />}>Templates</Button>
                <Button onClick={(e) => onExport(e.currentTarget)} startIcon={<Download />}>Export</Button>
                <Button 
                    onClick={onConfigure} 
                    startIcon={isLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <Settings />}
                    disabled={isLoading}
                >
                    Grid Control
                </Button>
                <Button variant="contained" onClick={onAdd} startIcon={<Plus />}>Add</Button>
            </Box>
        </GlassPaper>
    );
}
