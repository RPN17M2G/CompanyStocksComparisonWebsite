import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Theme, // <-- Fixed 'any'
} from '@mui/material';
import { X, Plus, Download } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react'; // <-- Added hooks
import {
  Company,
  ComparisonGroup,
  CustomMetric,
  RawFinancialData,
} from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { GlassDialog } from './GlassDialog';
import { AddCompanyDialog } from './AddCompanyDialog';
import { useComparisonExporter } from './useComparisonExporter'; // <-- 1. IMPORTED HOOK
import { MetricCategorySection } from './MetricCategorySection'; // <-- 2. IMPORTED COMPONENT

// Note: calculateCoreMetric, calculateCustomMetric, and XLSX are no longer imported here

interface ComparisonViewProps {
  open: boolean;
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  customMetrics: CustomMetric[];
  onClose: () => void;
  onAddCompany: (ticker: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleSelect: (id: string) => void;
}

const scrollbarStyles = {
  '&::-webkit-scrollbar': { display: 'none' },
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none',
};

export function ComparisonView({
  open,
  items,
  itemsData,
  customMetrics,
  onClose,
  onAddCompany,
  onRemoveItem,
  onToggleSelect,
}: ComparisonViewProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  // 1. All export logic is now in this hook
  const {
    exportMenuAnchor,
    handleOpenExportMenu,
    handleCloseExportMenu,
    exportHandlers,
  } = useComparisonExporter(items, itemsData, customMetrics);

  // 2. Memoize expensive calculations
  const groupedMetrics = useMemo(() => {
    return coreMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof coreMetrics>);
  }, []); // coreMetrics is static, so empty array is fine

  // 3. Stabilize helper functions with useCallback
  const getItemName = useCallback((item: Company | ComparisonGroup) =>
    'isGroup' in item ? item.name : item.ticker,
  []);

  const getItemData = useCallback((item: Company | ComparisonGroup): RawFinancialData | null =>
    itemsData.get(item.id) || null,
  [itemsData]);

  const handleAddAndSelect = useCallback((ticker: string) => {
    onAddCompany(ticker);
    onToggleSelect(ticker);
  }, [onAddCompany, onToggleSelect]);

  // --- All export-related functions (getFormattedData, handleExport..., etc.) are now GONE ---

  // --- Styling Constants ---
  const headerCellSx = {
    fontWeight: 'bold',
    minWidth: 150,
    backgroundColor: (theme: Theme) => // <-- Fixed 'any'
      theme.palette.mode === 'dark' ? 'rgba(18, 30, 54, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
  };

  const stickyColumnBaseSx = {
    fontWeight: 'bold',
    minWidth: 200,
    position: 'sticky',
    left: 0,
    borderRight: 1,
    borderColor: 'divider',
  };

  // --- Define Title and Actions for GlassDialog ---
  // (These could also be extracted to their own components in a future refactor)
  const dialogTitle = (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="h6" fontWeight="600">
        Detailed Comparison
      </Typography>
      <Chip label={`${items.length} items`} color="primary" size="small" />
    </Box>
  );

  const dialogActions = (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
      <Box>
        <Button
          onClick={handleOpenExportMenu} // <-- Use handler from hook
          variant="outlined"
          startIcon={<Download size={18} />}
          sx={{ borderRadius: 2, mr: 1 }}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleCloseExportMenu} // <-- Use handler from hook
        >
          <MenuItem onClick={exportHandlers.csv}>Export as CSV</MenuItem>
          <MenuItem onClick={exportHandlers.json}>Export as JSON</MenuItem>
          <MenuItem onClick={exportHandlers.excel}>Export as Excel (.xlsx)</MenuItem>
        </Menu>

        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outlined"
          startIcon={<Plus size={18} />}
          sx={{ borderRadius: 2 }}
        >
          Add Company
        </Button>
      </Box>

      <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2 }}>
        Close
      </Button>
    </Box>
  );
  // ---------------------------------------------

  return (
    <>
      <GlassDialog
        open={open}
        onClose={onClose}
        title={dialogTitle}
        actions={dialogActions}
        maxWidth="xl"
        fullWidth
      >
        <TableContainer
          sx={{
            ...scrollbarStyles,
            overflowX: 'auto',
            borderRadius: 2,
            backgroundColor: (theme: Theme) => // <-- Fixed 'any'
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(5px)',
            border: '1px solid',
            borderColor: (theme: Theme) => // <-- Fixed 'any'
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table size="small" stickyHeader>
            {/* --- Table Head --- */}
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    ...stickyColumnBaseSx,
                    ...headerCellSx,
                    zIndex: 11,
                  }}
                >
                  Metric
                </TableCell>
                {items.map((item) => (
                  <TableCell
                    key={item.id}
                    align="right"
                    sx={{ ...headerCellSx, zIndex: 10 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography component="span" noWrap>
                        {getItemName(item)}
                      </Typography>
                      {'isGroup' in item && (
                        <Chip label="Group" size="small" sx={{ ml: 1 }} />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(item.id)}
                        color="error"
                        sx={{
                          ml: 0.5,
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.2)',
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <X size={14} />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* --- 4. REFACTORED TABLE BODY --- */}
            <TableBody>
              {Object.entries(groupedMetrics).map(([category, metrics]) => (
                <MetricCategorySection
                  key={category}
                  title={category}
                  metrics={metrics}
                  items={items}
                  itemsData={itemsData}
                  isCustom={false}
                  stickyColumnBaseSx={stickyColumnBaseSx}
                  getItemData={getItemData}
                />
              ))}

              {customMetrics.length > 0 && (
                <MetricCategorySection
                  key="custom-metrics"
                  title="Custom Metrics"
                  metrics={customMetrics}
                  items={items}
                  itemsData={itemsData}
                  isCustom={true}
                  stickyColumnBaseSx={stickyColumnBaseSx}
                  getItemData={getItemData}
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassDialog>

      <AddCompanyDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddAndSelect}
      />
    </>
  );
}
