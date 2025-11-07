// src/hooks/useComparisonExporter.ts
import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Company, ComparisonGroup, CoreMetric, CustomMetric, RawFinancialData } from '../types';
import { coreMetrics } from '../engine/coreMetrics';
import { calculateCoreMetric, calculateCustomMetric, formatMetricValue } from '../engine/metricCalculator';

/**
 * A utility function to trigger a browser download.
 */
function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * A hook to manage all data exporting logic for the comparison table.
 */
export function useComparisonExporter(
  items: (Company | ComparisonGroup)[],
  itemsData: Map<string, RawFinancialData>,
  customMetrics: CustomMetric[]
) {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenExportMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseExportMenu = useCallback(() => {
    setExportMenuAnchor(null);
  }, []);

  // --- Helper Functions (Memoized) ---
  
  const allMetrics = useMemo((): (CoreMetric | CustomMetric)[] => {
    // This grouping logic is needed by getFormattedData
    const groupedMetrics = coreMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) acc[metric.category] = [];
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<string, typeof coreMetrics>);

    const metrics: (CoreMetric | CustomMetric)[] = [];
    Object.values(groupedMetrics).forEach(m => metrics.push(...m));
    metrics.push(...customMetrics);
    return metrics;
  }, [customMetrics]); // Only depends on customMetrics

  const getItemData = useCallback((item: Company | ComparisonGroup): RawFinancialData | null => {
    return itemsData.get(item.id) || null;
  }, [itemsData]);

  const getItemName = useCallback((item: Company | ComparisonGroup) =>
    'isGroup' in item ? item.name : item.ticker,
  []);

  /**
   * Generates the structured data for exporting.
   * This is the core logic, memoized for performance.
   */
  const getFormattedData = useCallback(() => {
    return allMetrics.map(metric => {
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
  }, [allMetrics, items, getItemData, getItemName]);

  
  // --- Export Handlers ---

  const handleExportJSON = useCallback(() => {
    const data = getFormattedData();
    downloadFile(JSON.stringify(data, null, 2), 'comparison.json', 'application/json');
    handleCloseExportMenu();
  }, [getFormattedData, handleCloseExportMenu]);

  const handleExportCSV = useCallback(() => {
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
    handleCloseExportMenu();
  }, [getFormattedData, handleCloseExportMenu]);

  const handleExportExcel = useCallback(() => {
    const data = getFormattedData();
    if (data.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');
    XLSX.writeFile(wb, 'comparison.xlsx');
    
    handleCloseExportMenu();
  }, [getFormattedData, handleCloseExportMenu]);

  
  return {
    exportMenuAnchor,
    handleOpenExportMenu,
    handleCloseExportMenu,
    exportHandlers: {
      csv: handleExportCSV,
      json: handleExportJSON,
      excel: handleExportExcel,
    },
  };
}
