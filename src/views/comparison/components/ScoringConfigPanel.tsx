/**
 * Scoring Configuration Panel
 * Allows users to configure how scores are calculated
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Theme,
} from '@mui/material';
import { Save, RefreshCw, X, Download, Upload } from 'lucide-react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GlassPaper } from '../../../shared/ui/GlassPaper';
import { GlassDialog } from '../../../shared/ui/GlassDialog';
import { scrollbarStyles } from '../../../app/theme/theme';
import {
  ScoringConfiguration,
  ScoringCategoryConfig,
  getDefaultScoringConfig,
  validateScoringConfig,
} from '../../../engine/scoringConfig';
import { MetricConfig } from '../types';

interface ScoringConfigPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: ScoringConfiguration) => void;
  currentConfig: ScoringConfiguration | null;
  availableMetrics: MetricConfig[];
}

export function ScoringConfigPanel({
  open,
  onClose,
  onSave,
  currentConfig,
  availableMetrics,
}: ScoringConfigPanelProps) {
  const [config, setConfig] = useState<ScoringConfiguration>(
    currentConfig || getDefaultScoringConfig(availableMetrics)
  );
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    } else {
      setConfig(getDefaultScoringConfig(availableMetrics));
    }
  }, [currentConfig, availableMetrics]);

  // Auto-save on close
  const handleClose = () => {
    const validation = validateScoringConfig(config);
    if (validation.valid) {
      onSave(config);
    }
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scoring-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as ScoringConfiguration;
          const validation = validateScoringConfig(imported);
          if (validation.valid) {
            setConfig(imported);
            setErrors([]);
          } else {
            setErrors(validation.errors);
          }
        } catch (error) {
          setErrors(['Failed to parse imported file. Please check the file format.']);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCategoryToggle = (categoryIndex: number) => {
    const newConfig = { ...config };
    newConfig.categories[categoryIndex].enabled = !newConfig.categories[categoryIndex].enabled;
    setConfig(newConfig);
  };

  const handleMetricToggle = (categoryIndex: number, metricIndex: number) => {
    const newConfig = { ...config };
    newConfig.categories[categoryIndex].metrics[metricIndex].enabled =
      !newConfig.categories[categoryIndex].metrics[metricIndex].enabled;
    setConfig(newConfig);
  };

  const handleCategoryWeightChange = (categoryIndex: number, weight: number) => {
    const newConfig = { ...config };
    newConfig.categories[categoryIndex].weight = weight;
    // Normalize other category weights
    normalizeCategoryWeights(newConfig);
    setConfig(newConfig);
  };

  const handleMetricWeightChange = (categoryIndex: number, metricIndex: number, weight: number) => {
    const newConfig = { ...config };
    newConfig.categories[categoryIndex].metrics[metricIndex].weight = weight;
    // Normalize other metric weights in the category
    normalizeMetricWeights(newConfig, categoryIndex);
    setConfig(newConfig);
  };

  const normalizeCategoryWeights = (cfg: ScoringConfiguration) => {
    const enabledCategories = cfg.categories.filter(cat => cat.enabled);
    const totalWeight = enabledCategories.reduce((sum, cat) => sum + cat.weight, 0);
    
    if (totalWeight > 0) {
      enabledCategories.forEach(cat => {
        cat.weight = (cat.weight / totalWeight) * 100;
      });
    }
  };

  const normalizeMetricWeights = (cfg: ScoringConfiguration, categoryIndex: number) => {
    const category = cfg.categories[categoryIndex];
    const enabledMetrics = category.metrics.filter(m => m.enabled);
    const totalWeight = enabledMetrics.reduce((sum, m) => sum + m.weight, 0);
    
    if (totalWeight > 0) {
      enabledMetrics.forEach(metric => {
        metric.weight = (metric.weight / totalWeight) * 100;
      });
    }
  };

  const handleSave = () => {
    const validation = validateScoringConfig(config);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSave(config);
  };

  const handleReset = () => {
    const defaultConfig = getDefaultScoringConfig(availableMetrics);
    setConfig(defaultConfig);
    setErrors([]);
  };

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Scoring Configuration"
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
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={handleReset}
              sx={{ borderRadius: 2 }}
            >
              Reset
            </Button>
          </Box>
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </Box>
      }
    >
      <Box>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.map((error, idx) => (
            <Typography key={idx} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Global Settings */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
          Global Settings
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Normalization Method</InputLabel>
          <Select
            value={config.normalizationMethod}
            label="Normalization Method"
            onChange={(e) => setConfig({ ...config, normalizationMethod: e.target.value as any })}
          >
            <MenuItem value="min-max">Min-Max (0-100 scale)</MenuItem>
            <MenuItem value="percentile">Percentile (relative ranking)</MenuItem>
            <MenuItem value="z-score">Z-Score (statistical normalization)</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={config.includeMissingData}
              onChange={(e) => setConfig({ ...config, includeMissingData: e.target.checked })}
            />
          }
          label="Include metrics with missing data (assigns neutral score)"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Minimum Data Completeness: {(config.minDataCompleteness * 100).toFixed(0)}%
          </Typography>
          <Slider
            value={config.minDataCompleteness}
            min={0}
            max={1}
            step={0.1}
            onChange={(_, value) => setConfig({ ...config, minDataCompleteness: value as number })}
            marks={[
              { value: 0, label: '0%' },
              { value: 0.5, label: '50%' },
              { value: 1, label: '100%' },
            ]}
          />
          <Typography variant="caption" color="text.secondary">
            Metrics must have data for at least this percentage of companies to be included
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Max Metrics Per Category: {config.maxMetricsPerCategory}
          </Typography>
          <Slider
            value={config.maxMetricsPerCategory}
            min={1}
            max={20}
            step={1}
            onChange={(_, value) => setConfig({ ...config, maxMetricsPerCategory: value as number })}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
          />
        </Box>
      </Box>

      {/* Category Configuration */}
      <Box>
        <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
          Category & Metric Weights
        </Typography>

        {config.categories.map((category, catIdx) => {
          const enabledMetrics = category.metrics.filter(m => m.enabled);
          const categoryContribution = category.enabled && enabledMetrics.length > 0
            ? category.weight
            : 0;

          return (
            <Accordion key={catIdx} defaultExpanded={catIdx === 0} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={category.enabled}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleCategoryToggle(catIdx)}
                      />
                    }
                    label=""
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                    {category.category}
                  </Typography>
                  <Chip
                    label={`${category.weight.toFixed(1)}% weight`}
                    size="small"
                    color={category.enabled ? 'primary' : 'default'}
                  />
                  <Chip
                    label={`${enabledMetrics.length} metrics`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {category.enabled && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Category Weight: {category.weight.toFixed(1)}%
                      </Typography>
                      <Slider
                        value={category.weight}
                        min={0}
                        max={100}
                        step={0.1}
                        onChange={(_, value) => handleCategoryWeightChange(catIdx, value as number)}
                        disabled={!category.enabled}
                      />
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                        Metrics ({enabledMetrics.length} enabled)
                      </Typography>
                      {category.metrics.map((metric, metricIdx) => {
                        const metricDef = availableMetrics.find(m => m.id === metric.metricId);
                        return (
                          <Box
                            key={metricIdx}
                            sx={{
                              p: 2,
                              mb: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              backgroundColor: (theme: Theme) =>
                                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={metric.enabled}
                                    onChange={() => handleMetricToggle(catIdx, metricIdx)}
                                    size="small"
                                  />
                                }
                                label={metricDef?.name || metric.metricId}
                              />
                              {metric.enabled && (
                                <Chip
                                  label={`${metric.weight.toFixed(1)}%`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            {metric.enabled && (
                              <Box sx={{ ml: 4 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                  Metric Weight (within category): {metric.weight.toFixed(1)}%
                                </Typography>
                                <Slider
                                  value={metric.weight}
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  onChange={(_, value) => handleMetricWeightChange(catIdx, metricIdx, value as number)}
                                  size="small"
                                />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Summary */}
      <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
          Configuration Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enabled Categories: {config.categories.filter(c => c.enabled).length} / {config.categories.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Enabled Metrics:{' '}
          {config.categories.reduce((sum, cat) => sum + cat.metrics.filter(m => m.enabled).length, 0)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Category Weight:{' '}
          {config.categories
            .filter(c => c.enabled)
            .reduce((sum, cat) => sum + cat.weight, 0)
            .toFixed(1)}%
        </Typography>
      </Box>
      </Box>
    </GlassDialog>
  );
}

