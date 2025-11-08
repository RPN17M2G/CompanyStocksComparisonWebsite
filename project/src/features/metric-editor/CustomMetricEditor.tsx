import { useState, useCallback } from 'react'; 
import {
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItemText,
  ListItemSecondaryAction,
  Theme, // <-- Import Theme
  SxProps,
} from '@mui/material';
import { Trash2, Plus } from 'lucide-react';
import { CustomMetric } from '../../shared/types/types';
import { GlassDialog } from '../../shared/ui/GlassDialog';
import { MetricCreatorForm } from './MetricCreatorForm'; 

const glassyCardSx: SxProps<Theme> = {
  p: 2,
  mb: 1.5,
  borderRadius: 3, // 12px
  backgroundColor: (theme) => 
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  backdropFilter: 'blur(5px)',
  border: '1px solid',
  borderColor: (theme) => 
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
};

interface CustomMetricEditorProps {
  open: boolean;
  customMetrics: CustomMetric[];
  onClose: () => void;
  onAddMetric: (metric: CustomMetric) => void;
  onDeleteMetric: (metricId: string) => void;
}

export function CustomMetricEditor({
  open,
  customMetrics,
  onClose,
  onAddMetric,
  onDeleteMetric,
}: CustomMetricEditorProps) {
  const [showCreator, setShowCreator] = useState(false);

  const handleAddAndClose = useCallback((metric: CustomMetric) => {
    onAddMetric(metric);
    setShowCreator(false);
  }, [onAddMetric]);
  
  const handleClose = useCallback(() => {
    setShowCreator(false);
    onClose();
  }, [onClose]);

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Custom Metrics"
      maxWidth="md"
      fullWidth
      actions={
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      }
    >
      {customMetrics.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" mb={2} color="text.secondary">
            Existing Metrics
          </Typography>
          <List sx={{ p: 0 }}>
            {customMetrics.map(metric => (
              <Box key={metric.id} sx={glassyCardSx}>
                <ListItemText
                  primary={metric.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        Formula: {metric.formula}
                      </Typography>
                      <br />
                      <Chip 
                        label={metric.format} 
                        size="small" 
                        sx={{ 
                          mt: 0.5, 
                          borderRadius: 1.5,
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          opacity: 0.8
                        }} 
                      />
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => onDeleteMetric(metric.id)} 
                    color="error"
                    sx={{
                      marginRight: 2,
                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.2)',
                      }
                    }}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </ListItemSecondaryAction>
              </Box>
            ))}
          </List>
        </Box>
      )}

      {!showCreator ? (
        <Button
          variant="outlined"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreator(true)}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, mt: 2 }}
        >
          Create New Custom Metric
        </Button>
      ) : (
        <Box sx={{ ...glassyCardSx, p: 3 }}>
          <MetricCreatorForm
            onAddMetric={handleAddAndClose}
            onCancel={() => setShowCreator(false)}
          />
        </Box>
      )}
    </GlassDialog>
  );
}
