import React from 'react';
import { 
    Box, 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle, 
    TextField, 
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Collapse,
    Checkbox,
    FormControl,
    Select,
    MenuItem,
    Chip,
    CircularProgress
} from '@mui/material';
import { ChevronDown, ChevronRight, RotateCcw, Info, Save } from 'lucide-react';
import { useMemo, useState, useTransition, useEffect, useDeferredValue, memo, useCallback } from 'react';
import { MetricConfig } from '../../types';
import { scrollbarStyles } from '../../../../app/theme/theme';
import { GlassPaper } from '../../../../shared/ui/GlassPaper';
import { Tooltip } from '@mui/material';
import { GlassDialog } from '../../../../shared/ui/GlassDialog';
import { createTemplateFromGrid, saveTemplate } from '../../../../services/templateService';

// Memoized row component for better performance
const MetricConfigRow = memo(({ config, updateMetricConfig }: { config: MetricConfig; updateMetricConfig: (id: string, updates: Partial<MetricConfig>) => void }) => {
    const handleVisibilityChange = useCallback(() => {
        updateMetricConfig(config.id, { isVisible: !config.isVisible });
    }, [config.id, config.isVisible, updateMetricConfig]);

    const handlePriorityChange = useCallback((e: any) => {
        updateMetricConfig(config.id, { priority: Number(e.target.value) });
    }, [config.id, updateMetricConfig]);

    return (
        <TableRow 
            hover
            sx={{
                backgroundColor: 'transparent',
                '&:hover': {
                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)'
                }
            }}
        >
            <TableCell>
                <Checkbox
                    checked={config.isVisible}
                    onChange={handleVisibilityChange}
                    size="small"
                />
            </TableCell>
            <TableCell>
                <Typography variant="body2">{config.name}</Typography>
            </TableCell>
            <TableCell>
                <Typography variant="caption" color="text.secondary">
                    {config.format}
                </Typography>
            </TableCell>
            <TableCell>
                <FormControl size="small" fullWidth>
                    <Select
                        value={config.priority}
                        onChange={handlePriorityChange}
                    >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                            <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </TableCell>
        </TableRow>
    );
});

MetricConfigRow.displayName = 'MetricConfigRow';

const CONFIG_METRICS_PER_BATCH = 30;

// Memoized category section component
const CategorySection = memo(({ 
    group, 
    isExpanded, 
    onToggle, 
    updateMetricConfig 
}: { 
    group: { category: string; subcategories: Record<string, MetricConfig[]>; directMetrics: MetricConfig[]; allMetrics: MetricConfig[] };
    isExpanded: boolean;
    onToggle: (category: string) => void;
    updateMetricConfig: (id: string, updates: Partial<MetricConfig>) => void;
}) => {
    const [visibleCount, setVisibleCount] = useState(CONFIG_METRICS_PER_BATCH);
    
    useEffect(() => {
        if (isExpanded) {
            setVisibleCount(CONFIG_METRICS_PER_BATCH);
        }
    }, [isExpanded]);

    const handleToggle = useCallback(() => {
        onToggle(group.category);
    }, [group.category, onToggle]);

    const loadMore = useCallback(() => {
        // Use requestIdleCallback for smoother loading
        const scheduleUpdate = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 100 });
            } else {
                setTimeout(callback, 50);
            }
        };

        scheduleUpdate(() => {
            setVisibleCount(prev => Math.min(prev + CONFIG_METRICS_PER_BATCH, group.allMetrics.length));
        });
    }, [group.allMetrics.length]);

    const visibleDirectMetrics = useMemo(() => {
        return group.directMetrics.slice(0, visibleCount);
    }, [group.directMetrics, visibleCount]);

    const visibleSubcategories = useMemo(() => {
        const result: Record<string, MetricConfig[]> = {};
        let currentCount = group.directMetrics.length;
        
        for (const [sub, configs] of Object.entries(group.subcategories)) {
            if (currentCount >= visibleCount) break;
            const remaining = visibleCount - currentCount;
            if (remaining > 0) {
                result[sub] = configs.slice(0, remaining);
                currentCount += Math.min(remaining, configs.length);
            }
        }
        return result;
    }, [group.subcategories, group.directMetrics.length, visibleCount]);

    const totalVisible = visibleDirectMetrics.length + Object.values(visibleSubcategories).reduce((sum, configs) => sum + configs.length, 0);
    const hasMore = totalVisible < group.allMetrics.length;

    return (
        <GlassPaper sx={{ mb: 2, mx: 2, mt: 2, overflow: 'hidden' }}>
            {/* Category Header */}
            <Box 
                sx={{ 
                    p: 1.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: isExpanded ? '1px solid' : 'none',
                    borderColor: 'divider'
                }}
                onClick={handleToggle}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <IconButton size="small" sx={{ p: 0.5 }}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </IconButton>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {group.category}
                    </Typography>
                    <Chip 
                        label={`${group.allMetrics.length} metrics`} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                </Box>
            </Box>

            {/* Category Content */}
            <Collapse in={isExpanded}>
                <TableContainer
                    sx={{
                        backgroundColor: 'transparent',
                        '& .MuiTable-root': {
                            backgroundColor: 'transparent'
                        },
                        '& .MuiTableHead-root': {
                            backgroundColor: 'transparent'
                        },
                        '& .MuiTableBody-root': {
                            backgroundColor: 'transparent'
                        },
                        '& .MuiTableCell-root': {
                            backgroundColor: 'transparent',
                            borderColor: 'divider'
                        }
                    }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 50 }}>Visible</TableCell>
                                <TableCell>Metric Name</TableCell>
                                <TableCell sx={{ width: 100 }}>Format</TableCell>
                                <TableCell sx={{ width: 150 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Priority
                                        <Tooltip 
                                            title={
                                                <Box sx={{ p: 0.5 }}>
                                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                        Priority System Explained:
                                                    </Typography>
                                                    <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                                                        • <strong>Higher priority (10)</strong> = Appears first in the table
                                                    </Typography>
                                                    <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                                                        • <strong>Lower priority (1)</strong> = Appears later in the table
                                                    </Typography>
                                                    <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                                                        • <strong>Priority 0</strong> = Hides the metric completely
                                                    </Typography>
                                                    <Typography variant="body2" component="div">
                                                        Metrics are sorted by priority (high to low), then by category and name.
                                                    </Typography>
                                                </Box>
                                            }
                                            arrow
                                            placement="top"
                                        >
                                            <Info size={16} style={{ cursor: 'help', opacity: 0.7, color: 'inherit' }} />
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Direct metrics */}
                            {visibleDirectMetrics.map(config => (
                                <MetricConfigRow 
                                    key={config.id}
                                    config={config}
                                    updateMetricConfig={updateMetricConfig}
                                />
                            ))}
                            {/* Subcategory metrics */}
                            {Object.entries(visibleSubcategories).map(([sub, configs]) => (
                                <React.Fragment key={sub}>
                                    <TableRow>
                                        <TableCell 
                                            colSpan={4} 
                                            sx={{ 
                                                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.03)' 
                                                    : 'rgba(0, 0, 0, 0.02)',
                                                py: 0.5 
                                            }}
                                        >
                                            <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                                {sub}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    {configs.map(config => (
                                        <MetricConfigRow 
                                            key={config.id}
                                            config={config}
                                            updateMetricConfig={updateMetricConfig}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                            {/* Load More Button */}
                            {hasMore && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={loadMore}
                                        >
                                            Load more ({group.allMetrics.length - totalVisible} remaining)
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Collapse>
        </GlassPaper>
    );
});

CategorySection.displayName = 'CategorySection';

interface MetricConfigDialogProps {
    open: boolean;
    onClose: () => void;
    metricConfigs: Map<string, MetricConfig>;
    updateMetricConfig: (id: string, updates: Partial<MetricConfig>) => void;
    setMetricConfigs: (updater: (prev: Map<string, MetricConfig>) => Map<string, MetricConfig>) => void;
    onTemplateSaved?: () => void;
}

export function MetricConfigDialog({
    open,
    onClose,
    metricConfigs,
    updateMetricConfig,
    setMetricConfigs,
    onTemplateSaved
}: MetricConfigDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const filteredGroupedConfigs = useMemo(() => {
        if (!open) return [];

        const query = deferredSearchQuery.toLowerCase().trim();
        const categoryMap = new Map<string, {
            subcategories: Map<string, MetricConfig[]>;
            directMetrics: MetricConfig[];
        }>();

        for (const config of metricConfigs.values()) {
            if (query) {
                const searchable = `${config.name} ${config.category} ${config.format} ${config.subcategory || ''}`.toLowerCase();
                if (!searchable.includes(query)) continue;
            }

            if (!categoryMap.has(config.category)) {
                categoryMap.set(config.category, { subcategories: new Map(), directMetrics: [] });
            }
            const catGroup = categoryMap.get(config.category)!;

            if (config.subcategory) {
                if (!catGroup.subcategories.has(config.subcategory)) {
                    catGroup.subcategories.set(config.subcategory, []);
                }
                catGroup.subcategories.get(config.subcategory)!.push(config);
            } else {
                catGroup.directMetrics.push(config);
            }
        }

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            subcategories: Object.fromEntries(data.subcategories),
            directMetrics: data.directMetrics,
            allMetrics: [...data.directMetrics, ...Array.from(data.subcategories.values()).flat()]
        }));
    }, [metricConfigs, deferredSearchQuery, open]);

    // Auto-expand categories when searching
    useEffect(() => {
        if (deferredSearchQuery && expandedCategories.size === 0 && filteredGroupedConfigs.length > 0) {
            setExpandedCategories(new Set(filteredGroupedConfigs.map(r => r.category)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deferredSearchQuery]);

    const toggleCategory = useCallback((category: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }, []);

    const handleResetToAllMetrics = () => {
        startTransition(() => {
            setMetricConfigs(prev => {
                const next = new Map(prev);
                for (const [id, config] of next.entries()) {
                    next.set(id, {
                        ...config,
                        isVisible: true,
                        priority: 5
                    });
                }
                return next;
            });
        });
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim()) return;

        const visibleMetrics = Array.from(metricConfigs.values())
            .filter(m => m.isVisible && m.priority > 0)
            .map(m => m.id);
        
        const metricPriorities: Record<string, number> = {};
        const metricIds: string[] = [];
        const categories = new Set<string>();

        metricConfigs.forEach((config, id) => {
            metricIds.push(id);
            metricPriorities[id] = config.priority;
            if (config.category) {
                categories.add(config.category);
            }
        });

        const template = createTemplateFromGrid(
            templateName.trim(),
            templateDescription.trim() || undefined,
            metricIds,
            metricPriorities,
            visibleMetrics,
            Array.from(categories)
        );

        saveTemplate(template);
        setSaveSuccess(true);
        if (onTemplateSaved) {
            onTemplateSaved();
        }
        
        // Close dialog after showing success
        setTimeout(() => {
            setShowSaveDialog(false);
            setTemplateName('');
            setTemplateDescription('');
            setSaveSuccess(false);
        }, 1500);
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            BackdropProps={{
                sx: { backdropFilter: 'blur(5px)' }
            }}
            PaperProps={{
                sx: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                }
            }}
        >
            <Box
                sx={{
                    borderRadius: 4,
                    backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: (theme) => theme.shadows[10],
                    border: '1px solid',
                    borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <DialogTitle sx={{ 
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    pb: 1 
                }}>
                    <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 500 }}>Configure GRID</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={<Save size={16} />}
                            onClick={() => setShowSaveDialog(true)}
                            variant="outlined"
                            size="small"
                            color="primary"
                        >
                            Save as Template
                        </Button>
                        <Button
                            startIcon={<RotateCcw size={16} />}
                            onClick={handleResetToAllMetrics}
                            variant="outlined"
                            size="small"
                            disabled={isPending}
                        >
                            Reset to All Metrics
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ ...scrollbarStyles, flex: 1, overflow: 'auto', p: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                        fullWidth 
                        size="small" 
                        placeholder="Search metrics..." 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        value={searchQuery}
                    />
                </Box>

                {isPending && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {filteredGroupedConfigs.map(group => (
                    <CategorySection
                        key={group.category}
                        group={group}
                        isExpanded={expandedCategories.has(group.category)}
                        onToggle={toggleCategory}
                        updateMetricConfig={updateMetricConfig}
                    />
                ))}
                </DialogContent>
                <DialogActions sx={{ 
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    backgroundColor: (theme) => 
                        theme.palette.mode === 'dark' ? 'rgba(11, 17, 32, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderTop: 1,
                    borderColor: 'divider',
                    p: 2 
                }}>
                    <Button onClick={onClose} variant="contained">Close</Button>
                </DialogActions>
            </Box>
        </Dialog>

        {/* Save Template Dialog */}
        <GlassDialog
            open={showSaveDialog}
            onClose={() => {
                setShowSaveDialog(false);
                setTemplateName('');
                setTemplateDescription('');
            }}
            title={saveSuccess ? "Template Saved Successfully!" : "Save Grid as Template"}
            maxWidth="sm"
            fullWidth
            actions={!saveSuccess ? (
                <>
                    <Button onClick={() => {
                        setShowSaveDialog(false);
                        setTemplateName('');
                        setTemplateDescription('');
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveTemplate} 
                        variant="contained"
                        disabled={!templateName.trim()}
                    >
                        Save Template
                    </Button>
                </>
            ) : undefined}
        >
            {saveSuccess ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    <Typography variant="body1" color="success.main" sx={{ fontWeight: 600 }}>
                        "{templateName}" has been saved and is now available in the Templates menu.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Template Name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., My Custom View"
                        required
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Description (Optional)"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Describe this template..."
                        multiline
                        rows={3}
                    />
                </Box>
            )}
        </GlassDialog>
        </>
    );
}
