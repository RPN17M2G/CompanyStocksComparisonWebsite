/**
 * Enhanced Full-Screen Comparison View - Dashboard Style
 * REFACTORED VERSION
 */

import { Box, Menu, MenuItem, Popover, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState, useTransition, lazy, Suspense } from 'react';
import { SelectCompanyDialog } from './components/SelectCompanyDialog';
import { getAllTemplates } from '../../services/templateService';
import { ComparisonTemplate } from '../../shared/types/comparisonTemplate';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../../shared/types/types';
import { ComparisonHeader } from './components/ComparisonHeader';
import { ComparisonLayout } from './components/ComparisonLayout';
import { ComparisonSummary } from './components/ComparisonSummary';
import { ComparisonTable } from './components/ComparisonTable/ComparisonTable';
import { CircularProgress } from '@mui/material';
import { scrollbarStyles } from '../../app/theme/theme';
import { Search, X } from 'lucide-react';

// Lazy load the config dialog to prevent freezing
const MetricConfigDialog = lazy(() => import('./components/ConfigPanel/MetricConfigDialog').then(module => ({ default: module.MetricConfigDialog })));
import { useComparisonData } from './hooks/useComparisonData';
import { useImprovedScores } from './hooks/useImprovedScores';
import { useMetricConfig } from './hooks/useMetricConfig';
import { useMetricDefinitions } from './hooks/useMetricDefinitions';
import { MetricConfig } from './types';
import { useComparisonExporter } from './useComparisonExporter';
import { ScoringConfigPanel } from './components/ScoringConfigPanel';
import { saveScoringConfig, loadScoringConfig } from '../../services/scoringStorage';

interface ComparisonViewFullscreenProps {
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  customMetrics: CustomMetric[];
  availableCompanies: Company[];
  onClose: () => void;
  onAddCompany: (ticker: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleSelect: (id: string) => void;
}

export function ComparisonViewFullscreen({
  items,
  itemsData,
  customMetrics,
  availableCompanies,
  onClose,
  onAddCompany,
  onRemoveItem,
  onToggleSelect,
}: ComparisonViewFullscreenProps) {
  // --- State ---
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [loadingTemplateName, setLoadingTemplateName] = useState<string | null>(null);
  const [showScoringConfig, setShowScoringConfig] = useState(false);
  const [scoringConfigVersion, setScoringConfigVersion] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  // --- Hooks ---
  const metricDefinitions = useMetricDefinitions(itemsData, customMetrics);
  const {
    metricConfigs,
    visibleMetrics,
    metricsByCategory,
    updateMetricConfig,
    setMetricConfigs,
    isLoading
  } = useMetricConfig(metricDefinitions);

  // Use deferred values and transitions for heavy computations
  const { allMetricValues, allValueIndicators } = useComparisonData(items, itemsData, metricDefinitions);
  // Force refresh when scoring config changes
  const allScores = useImprovedScores(items, itemsData, visibleMetrics, metricDefinitions, customMetrics, scoringConfigVersion) || [];

  // Filter metrics based on search query
  const filteredMetricsByCategory = useMemo(() => {
    if (!metricSearchQuery.trim()) return metricsByCategory;
    const query = metricSearchQuery.toLowerCase().trim();
    const filtered: Record<string, MetricConfig[]> = {};
    
    Object.entries(metricsByCategory).forEach(([category, metrics]) => {
      const matchingMetrics = metrics.filter(metric => 
        metric.name.toLowerCase().includes(query) ||
        metric.category.toLowerCase().includes(query) ||
        (metric.subcategory && metric.subcategory.toLowerCase().includes(query))
      );
      if (matchingMetrics.length > 0) {
        filtered[category] = matchingMetrics;
      }
    });
    
    return filtered;
  }, [metricsByCategory, metricSearchQuery]);

  // Track when initial load is complete
  useEffect(() => {
    if (!isLoading && items.length > 0 && itemsData.size > 0) {
      // Use transition to mark initial load as complete without blocking
      startTransition(() => {
        setIsInitialLoad(false);
      });
    }
  }, [isLoading, items.length, itemsData.size, startTransition]);

  // --- Exporter ---
  const allMetricsForExport = useMemo(() => {
    return visibleMetrics.map(m => {
      const def = metricDefinitions.get(m.id);
      // Wrap calculateValue to ensure it returns number | null for export
      const calculateValue = def?.calculateValue 
        ? (data: RawFinancialData) => {
            const val = def.calculateValue(data);
            return typeof val === 'number' ? val : null;
          }
        : undefined;
      return {
        id: m.id,
        name: m.name,
        format: m.format,
        category: m.category,
        calculateValue
      };
    });
  }, [visibleMetrics, metricDefinitions]);

  const {
    exportMenuAnchor,
    handleOpenExportMenu,
    handleCloseExportMenu,
    exportHandlers: baseExportHandlers,
  } = useComparisonExporter(items, itemsData, allMetricsForExport);

  // Wrap export handlers with loading state
  const exportHandlers = useMemo(() => ({
    csv: () => {
      setIsExporting(true);
      handleCloseExportMenu();
      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(() => {
        startTransition(() => {
          baseExportHandlers.csv();
          // Clear loading after a brief delay to ensure download starts
          setTimeout(() => setIsExporting(false), 200);
        });
      }, 0);
    },
    json: () => {
      setIsExporting(true);
      handleCloseExportMenu();
      setTimeout(() => {
        startTransition(() => {
          baseExportHandlers.json();
          setTimeout(() => setIsExporting(false), 200);
        });
      }, 0);
    },
    excel: () => {
      setIsExporting(true);
      handleCloseExportMenu();
      setTimeout(() => {
        startTransition(() => {
          baseExportHandlers.excel();
          setTimeout(() => setIsExporting(false), 200);
        });
      }, 0);
    },
  }), [baseExportHandlers, startTransition, handleCloseExportMenu]);

  // --- Handlers ---
  const handleLoadTemplate = useCallback((template: ComparisonTemplate | 'all-metrics') => {
    setTemplateMenuAnchor(null);
    setIsLoadingTemplate(true);
    const templateName = template === 'all-metrics' ? 'All Metrics' : template.name;
    setLoadingTemplateName(templateName);
    
    const startTime = Date.now();
    const MIN_LOADING_TIME = 1500; // Minimum 1500ms to prevent flicker
    
    // Use transition for smooth loading
    startTransition(() => {
      // Batch update all configs based on template
      setMetricConfigs(prev => {
        const next = new Map(prev);
        if (template === 'all-metrics') {
          // Reset to all metrics visible with default priority (like initial state)
          for (const [id, config] of next.entries()) {
            next.set(id, {
              ...config,
              isVisible: true,
              priority: 5
            });
          }
        } else {
          const visibleSet = new Set(template.visibleMetrics);
          for (const [id, config] of next.entries()) {
            next.set(id, {
              ...config,
              isVisible: visibleSet.has(id),
              priority: template.metricPriorities?.[id] ?? 5
            });
          }
        }
        return next;
      });
      
      // Ensure loading screen is visible for at least MIN_LOADING_TIME
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      
      setTimeout(() => {
        setIsLoadingTemplate(false);
        setLoadingTemplateName(null);
      }, remainingTime);
    });
  }, [setMetricConfigs, startTransition]);

  return (
    <ComparisonLayout isLoading={isLoading || isPending} isInitialLoad={isInitialLoad || isPending}>
      <ComparisonHeader
        onClose={onClose}
        onAdd={() => setShowAddDialog(true)}
        onConfigure={() => setShowConfigDialog(true)}
        onTemplates={(el) => setTemplateMenuAnchor(el)}
        onExport={(el) => handleOpenExportMenu({ currentTarget: el } as any)}
        onShowScoringConfig={() => setShowScoringConfig(true)}
        isLoading={isLoading || isPending || isExporting || isLoadingTemplate}
      />

      <Box sx={{ flex: 1, overflow: 'auto', p: 3, ...scrollbarStyles }}>
        {/* Dashboard Section: Scores, High Priority Metrics, and Radar Chart */}
        <ComparisonSummary
          scores={allScores}
          items={items}
          itemsData={itemsData}
          visibleMetrics={visibleMetrics}
          metricDefinitions={metricDefinitions}
          allMetricValues={allMetricValues}
          allValueIndicators={allValueIndicators}
        />

        {/* Search Bar for Metrics */}
        <Box sx={{ mb: 2, mt: 4 }}>
          <TextField
            fullWidth
            placeholder="Search metrics..."
            value={metricSearchQuery}
            onChange={(e) => setMetricSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
              endAdornment: metricSearchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setMetricSearchQuery('')}
                    sx={{ mr: -1 }}
                  >
                    <X size={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                '&:hover': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                },
                '&.Mui-focused': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)',
                },
              },
            }}
          />
          {metricSearchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
              Showing {Object.values(filteredMetricsByCategory).reduce((sum, metrics) => sum + metrics.length, 0)} matching metrics
            </Typography>
          )}
        </Box>

        {/* Full Comparison Table */}
        <ComparisonTable
          items={items}
          metricsByCategory={filteredMetricsByCategory}
          allMetricValues={allMetricValues}
          allValueIndicators={allValueIndicators}
          onRemoveItem={onRemoveItem}
        />
      </Box>

      {/* Dialogs & Menus */}
      {showConfigDialog && (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}>
          <MetricConfigDialog
            open={showConfigDialog}
            onClose={() => setShowConfigDialog(false)}
            metricConfigs={metricConfigs}
            updateMetricConfig={updateMetricConfig}
            setMetricConfigs={setMetricConfigs}
            onTemplateSaved={() => {
              // Template saved successfully - the template will appear in the menu automatically
              // Could add a snackbar notification here if needed
            }}
          />
        </Suspense>
      )}

      <SelectCompanyDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelect={onAddCompany}
        availableCompanies={availableCompanies}
        existingItemIds={new Set(items.map(item => item.id))}
      />

      {showScoringConfig && (
        <ScoringConfigPanel
          key={Date.now()} // Force re-render when opened to refresh config
          open={showScoringConfig}
          onClose={() => setShowScoringConfig(false)}
          onSave={(config) => {
            saveScoringConfig(config);
            // Force scores to recalculate by updating version
            setScoringConfigVersion(prev => prev + 1);
          }}
          currentConfig={loadScoringConfig()}
          availableMetrics={visibleMetrics}
        />
      )}

      <Menu
        open={Boolean(templateMenuAnchor)}
        anchorEl={templateMenuAnchor}
        onClose={() => setTemplateMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => handleLoadTemplate('all-metrics')}
          disabled={isLoadingTemplate}
        >
          {isLoadingTemplate && loadingTemplateName === 'All Metrics' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Loading All Metrics...
            </Box>
          ) : (
            'All Metrics (Default)'
          )}
        </MenuItem>
        {getAllTemplates().map(t => (
          <MenuItem 
            key={t.id} 
            onClick={() => handleLoadTemplate(t)}
            disabled={isLoadingTemplate}
          >
            {isLoadingTemplate && loadingTemplateName === t.name ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                Loading {t.name}...
              </Box>
            ) : (
              t.name
            )}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={Boolean(exportMenuAnchor)}
        anchorEl={exportMenuAnchor}
        onClose={handleCloseExportMenu}
      >
        <MenuItem 
          onClick={exportHandlers.csv}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'CSV'}
        </MenuItem>
        <MenuItem 
          onClick={exportHandlers.json}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'JSON'}
        </MenuItem>
        <MenuItem 
          onClick={exportHandlers.excel}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Excel'}
        </MenuItem>
      </Popover>
    </ComparisonLayout>
  );
}