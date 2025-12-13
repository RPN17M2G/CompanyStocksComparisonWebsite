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
  Theme,
  SxProps,
} from '@mui/material';
import { Trash2, Plus, Download, Upload, Edit } from 'lucide-react';
import { CustomMetric, RawFinancialData } from '../../shared/types/types';
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
  onUpdateMetric?: (metric: CustomMetric) => void;
  onDeleteMetric: (metricId: string) => void;
  onImportMetrics?: (metrics: CustomMetric[]) => void;
  availableData?: RawFinancialData[]; // For dynamic field discovery
}

export function CustomMetricEditor({
  open,
  customMetrics,
  onClose,
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric,
  onImportMetrics,
  availableData = [],
}: CustomMetricEditorProps) {
  const [showCreator, setShowCreator] = useState(false);
  const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null);

  const handleAddAndClose = useCallback((metric: CustomMetric) => {
    if (editingMetric) {
      // Update existing metric
      if (onUpdateMetric) {
        onUpdateMetric(metric);
      } else {
        // Fallback: delete old and add new
        onDeleteMetric(editingMetric.id);
        onAddMetric(metric);
      }
      setEditingMetric(null);
    } else {
      // Add new metric
      onAddMetric(metric);
    }
    setShowCreator(false);
  }, [onAddMetric, onUpdateMetric, onDeleteMetric, editingMetric]);
  
  const handleClose = useCallback(() => {
    setShowCreator(false);
    setEditingMetric(null);
    onClose();
  }, [onClose]);

  const handleEdit = useCallback((metric: CustomMetric) => {
    setEditingMetric(metric);
    setShowCreator(true);
  }, []);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(customMetrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [customMetrics]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = JSON.parse(content) as CustomMetric[];
          
          // Validate imported metrics
          if (!Array.isArray(imported)) {
            throw new Error('Invalid file format');
          }

          const validMetrics = imported.filter(m => 
            m.id && m.name && m.format && m.formula
          );

          if (validMetrics.length === 0) {
            throw new Error('No valid metrics found in file');
          }

          if (onImportMetrics) {
            onImportMetrics(validMetrics);
          } else {
            // Fallback: add each metric individually
            validMetrics.forEach(metric => onAddMetric(metric));
          }
        } catch (error) {
          console.error('Error importing metrics:', error);
          alert('Failed to import metrics. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [onImportMetrics, onAddMetric]);

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Custom Metrics"
      maxWidth="md"
      fullWidth
      actions={
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleExport}
              variant="outlined"
              startIcon={<Download size={18} />}
              sx={{ borderRadius: 2 }}
              disabled={customMetrics.length === 0}
            >
              Export
            </Button>
            <Button
              onClick={handleImport}
              variant="outlined"
              startIcon={<Upload size={18} />}
              sx={{ borderRadius: 2 }}
            >
              Import
            </Button>
          </Box>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </Box>
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
                    onClick={() => handleEdit(metric)}
                    color="primary"
                    sx={{
                      marginRight: 1,
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(37, 99, 235, 0.2)',
                      }
                    }}
                    title="Edit metric"
                  >
                    <Edit size={18} />
                  </IconButton>
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
                    title="Delete metric"
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
          onClick={() => {
            setEditingMetric(null);
            setShowCreator(true);
          }}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, mt: 2 }}
        >
          Create New Custom Metric
        </Button>
      ) : (
        <Box sx={{ ...glassyCardSx, p: 3 }}>
          <MetricCreatorForm
            onAddMetric={handleAddAndClose}
            onCancel={() => {
              setShowCreator(false);
              setEditingMetric(null);
            }}
            availableData={availableData}
            initialMetric={editingMetric || undefined}
          />
        </Box>
      )}
    </GlassDialog>
  );
}
