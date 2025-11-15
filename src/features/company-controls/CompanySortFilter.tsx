import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
  Chip,
  IconButton,
} from '@mui/material';
import { X, ArrowUpDown } from 'lucide-react';
import { useMemo } from 'react';
import { Company, ComparisonGroup, RawFinancialData } from '../../shared/types/types';
import { getAllAvailableMetrics } from '../../engine/dynamicMetrics';

interface CompanySortFilterProps {
  items: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  filterMetric: string | null;
  filterOperator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  filterValue: string;
  onSortChange: (metricId: string | null) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onFilterMetricChange: (metricId: string | null) => void;
  onFilterOperatorChange: (operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte') => void;
  onFilterValueChange: (value: string) => void;
  onClearFilters: () => void;
}

export function CompanySortFilter({
  items,
  itemsData,
  sortBy,
  sortOrder,
  filterMetric,
  filterOperator,
  filterValue,
  onSortChange,
  onSortOrderChange,
  onFilterMetricChange,
  onFilterOperatorChange,
  onFilterValueChange,
  onClearFilters,
}: CompanySortFilterProps) {
  // Get all available metrics from all companies
  const availableMetrics = useMemo(() => {
    const allData = Array.from(itemsData.values()).filter(Boolean) as RawFinancialData[];
    if (allData.length === 0) return [];
    return getAllAvailableMetrics(allData);
  }, [itemsData]);

  const hasActiveFilters = sortBy !== null || filterMetric !== null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        mb: 3,
        p: 2,
        borderRadius: 2,
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Sort Controls */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy || ''}
          label="Sort By"
          onChange={(e: SelectChangeEvent) => onSortChange(e.target.value || null)}
          endAdornment={
            sortBy && (
              <IconButton
                size="small"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                sx={{ mr: 1 }}
              >
                <ArrowUpDown size={16} />
              </IconButton>
            )
          }
        >
          <MenuItem value="">None</MenuItem>
          {availableMetrics.map((metric) => (
            <MenuItem key={metric.id} value={metric.id}>
              {metric.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {sortBy && (
        <Chip
          label={`${sortOrder === 'asc' ? '↑' : '↓'} ${availableMetrics.find(m => m.id === sortBy)?.name || sortBy}`}
          onDelete={() => onSortChange(null)}
          size="small"
        />
      )}

      {/* Filter Controls */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Filter By</InputLabel>
        <Select
          value={filterMetric || ''}
          label="Filter By"
          onChange={(e: SelectChangeEvent) => onFilterMetricChange(e.target.value || null)}
        >
          <MenuItem value="">None</MenuItem>
          {availableMetrics.map((metric) => (
            <MenuItem key={metric.id} value={metric.id}>
              {metric.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filterMetric && (
        <>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Operator</InputLabel>
            <Select
              value={filterOperator}
              label="Operator"
              onChange={(e: SelectChangeEvent) =>
                onFilterOperatorChange(e.target.value as 'gt' | 'lt' | 'eq' | 'gte' | 'lte')
              }
            >
              <MenuItem value="gt">Greater Than</MenuItem>
              <MenuItem value="gte">Greater or Equal</MenuItem>
              <MenuItem value="eq">Equal</MenuItem>
              <MenuItem value="lt">Less Than</MenuItem>
              <MenuItem value="lte">Less or Equal</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Value"
            type="number"
            value={filterValue}
            onChange={(e) => onFilterValueChange(e.target.value)}
            sx={{ minWidth: 120 }}
          />
        </>
      )}

      {hasActiveFilters && (
        <IconButton size="small" onClick={onClearFilters} color="error">
          <X size={18} />
        </IconButton>
      )}
    </Box>
  );
}

