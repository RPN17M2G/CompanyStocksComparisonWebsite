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
} from '@mui/material';
import { X, Plus, Download } from 'lucide-react';
import React, { useState } from 'react'; // Added React
import { Company, ComparisonGroup, CoreMetric, CustomMetric, RawFinancialData } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';
import { GlassDialog } from './GlassDialog'; // Import the new component
import * as XLSX from 'xlsx'; // Added for Excel export. Run 'npm install xlsx'
import { AddCompanyDialog } from './AddCompanyDialog'; 

interface ComparisonViewProps {
  open: boolean;
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  customMetrics: CustomMetric[];
  onClose: () => void;
  onAddCompany: (ticker: string) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleSelect: (id: string) => void; // <-- 1. Added new prop
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
  onToggleSelect, // <-- 1. Get new prop
}: ComparisonViewProps) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const groupedMetrics = coreMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof coreMetrics>);

  const getItemName = (item: Company | ComparisonGroup) =>
    'isGroup' in item ? item.name : item.ticker;

  const getItemData = (item: Company | ComparisonGroup): RawFinancialData | null =>
    itemsData.get(item.id) || null;

  // --- Data Collation for Export ---
  const getAllMetrics = (): (CoreMetric | CustomMetric)[] => {
    const allMetrics: (CoreMetric | CustomMetric)[] = [];
    Object.values(groupedMetrics).forEach(metrics => allMetrics.push(...metrics));
    allMetrics.push(...customMetrics);
    return allMetrics;
  };
  
  const getFormattedData = () => {
    const allMetrics = getAllMetrics();
    const data = allMetrics.map(metric => {
      const row: Record<string, any> = { Metric: metric.name };
      items.forEach(item => {
        const itemData = getItemData(item);
        const value = itemData
          ? 'formula' in metric
            ? calculateCustomMetric(metric, itemData)
            : calculateCoreMetric(metric.id, itemData)
          : null;
        row[getItemName(item)] = formatMetricValue(value, metric.format);
      });
      return row;
    });
    return data;
  };
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleExportJSON = () => {
    const data = getFormattedData();
    downloadFile(JSON.stringify(data, null, 2), 'comparison.json', 'application/json');
    setExportMenuAnchor(null);
  };
  
  const handleExportCSV = () => {
    const data = getFormattedData();
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        if (typeof cell === 'string' && cell.includes(',')) {
          cell = `"${cell}"`;
        }
        return cell;
      });
      csvContent += values.join(',') + '\n';
    });
    
    downloadFile(csvContent, 'comparison.csv', 'text/csv;charset=utf-8;');
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    const data = getFormattedData();
    if (data.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');
    XLSX.writeFile(wb, 'comparison.xlsx');
    
    setExportMenuAnchor(null);
  };
  
  // 2. New handler to add company to main list AND selection
  const handleAddAndSelect = (ticker: string) => {
    onAddCompany(ticker); // Adds company to main list
    onToggleSelect(ticker); // Adds company to selection (and thus this grid)
    // We let the AddCompanyDialog close itself
  };
  // ---------------------------------

  const headerCellSx = {
    fontWeight: 'bold',
    minWidth: 150,
    backgroundColor: (theme: any) =>
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
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          variant="outlined"
          startIcon={<Download size={18} />}
          sx={{ borderRadius: 2, mr: 1 }}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
          <MenuItem onClick={handleExportJSON}>Export as JSON</MenuItem>
          <MenuItem onClick={handleExportExcel}>Export as Excel (.xlsx)</MenuItem>
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
        {/* --- Single Table Container --- */}
        <TableContainer
          sx={{
            ...scrollbarStyles,
            overflowX: 'auto',
            borderRadius: 2,
            backgroundColor: (theme: any) =>
              theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(5px)',
            border: '1px solid',
            borderColor: (theme: any) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table size="small" stickyHeader>
            {/* --- Single Table Head --- */}
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
            {/* --- Single Table Body --- */}
            <TableBody>
              {Object.entries(groupedMetrics).map(([category, metrics]) => (
                // Use React.Fragment to group rows by category
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <TableRow>
                    <TableCell
                      colSpan={items.length + 1}
                      sx={{
                        backgroundColor: 'rgba(120, 120, 120, 0.1)',
                        backdropFilter: 'blur(3px)',
                        py: 1.5,
                      }}
                    >
                      <Typography variant="h6" color="primary.light">
                        {category}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {/* Metric Rows */}
                  {metrics.map((metric) => (
                    <TableRow
                      key={metric.id}
                      hover
                      sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell
                        sx={{
                          ...stickyColumnBaseSx,
                          zIndex: 1,
                          backgroundColor: 'transparent',
                          'tr:hover &': {
                            backgroundColor: (theme: any) =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        {metric.name}
                      </TableCell>
                      {items.map((item) => {
                        const data = getItemData(item);
                        const value = data ? calculateCoreMetric(metric.id, data) : null;
                        const formatted = formatMetricValue(value, metric.format);
                        return (
                          <TableCell key={item.id} align="right">
                            {formatted}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}

              {customMetrics.length > 0 && (
                <React.Fragment>
                  {/* Custom Metrics Header Row */}
                  <TableRow>
                    <TableCell
                      colSpan={items.length + 1}
                      sx={{
                        backgroundColor: 'rgba(120, 120, 120, 0.1)',
                        backdropFilter: 'blur(3px)',
                        py: 1.5,
                      }}
                    >
                      <Typography variant="h6" color="primary.light">
                        Custom Metrics
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {/* Custom Metric Rows */}
                  {customMetrics.map((metric) => (
                    <TableRow
                      key={metric.id}
                      hover
                      sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell
                        sx={{
                          ...stickyColumnBaseSx,
                          zIndex: 1,
                          backgroundColor: 'transparent',
                          'tr:hover &': {
                            backgroundColor: (theme: any) =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        {metric.name}
                      </TableCell>
                      {items.map((item) => {
                        const data = getItemData(item);
                        const value = data ? calculateCustomMetric(metric, data) : null;
                        const formatted = formatMetricValue(value, metric.format);
                        return (
                          <TableCell key={item.id} align="right">
                            {formatted}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassDialog>

      <AddCompanyDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddAndSelect} // <-- 3. Use new handler
      />
    </>
  );
}

