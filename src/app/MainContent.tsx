import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import { Plus, Users, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../shared/types/types';
import { CompanyTile } from '../features/company-tile/CompanyTile';
import { CompanySortFilter } from '../features/company-controls/CompanySortFilter';
import { calculateCoreMetric } from '../engine/metricCalculator';
import { getAllAvailableMetrics } from '../engine/dynamicMetrics';
import logo_with_name from '../assets/logo-with-name.png';

type MainContentProps = {
  hasConfig: boolean;
  allItems: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  selectedItems: Set<string>;
  selectedCompaniesCount: number;
  detailItemId: string | null;
  keyMetrics: string[];
  customMetrics: CustomMetric[];
  onShowAddDialog: () => void;
  onShowCreateGroup: () => void;
  onShowComparison: () => void;
  onDeselectAll: () => void;
  onToggleSelect: (id: string) => void;
  onRemoveGroup: (id: string) => void;
  onRemoveCompany: (id: string) => void;
  onShowDetails: (id: string) => void;
  onRefreshCompany?: (ticker: string) => void;
};

export const MainContent = ({
  hasConfig,
  allItems,
  itemsData,
  selectedItems,
  selectedCompaniesCount,
  detailItemId,
  keyMetrics,
  customMetrics,
  onShowAddDialog,
  onShowCreateGroup,
  onShowComparison,
  onDeselectAll,
  onToggleSelect,
  onRemoveGroup,
  onRemoveCompany,
  onShowDetails,
  onRefreshCompany,
}: MainContentProps) => {
  const hasSelection = selectedItems.size >= 2;
  const showDetailView = detailItemId !== null;

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMetric, setFilterMetric] = useState<string | null>(null);
  const [filterOperator, setFilterOperator] = useState<'gt' | 'lt' | 'eq' | 'gte' | 'lte'>('gt');
  const [filterValue, setFilterValue] = useState<string>('');

  const availableMetrics = useMemo(() => {
    const allData = Array.from(itemsData.values()).filter(Boolean) as RawFinancialData[];
    if (allData.length === 0) return [];
    return getAllAvailableMetrics(allData);
  }, [itemsData]);

  const processedItems = useMemo(() => {
    let filtered = [...allItems];

    // Apply filter
    if (filterMetric && filterValue) {
      const filterNum = parseFloat(filterValue);
      if (!isNaN(filterNum)) {
        filtered = filtered.filter(item => {
          const data = itemsData.get(item.id);
          if (!data) return false;
          
          const value = calculateCoreMetric(filterMetric, data);
          if (value === null || typeof value !== 'number') return false;

          switch (filterOperator) {
            case 'gt': return value > filterNum;
            case 'gte': return value >= filterNum;
            case 'eq': return Math.abs(value - filterNum) < 0.01;
            case 'lt': return value < filterNum;
            case 'lte': return value <= filterNum;
            default: return true;
          }
        });
      }
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        const dataA = itemsData.get(a.id);
        const dataB = itemsData.get(b.id);
        
        const valueA = dataA ? calculateCoreMetric(sortBy, dataA) : null;
        const valueB = dataB ? calculateCoreMetric(sortBy, dataB) : null;

        // Handle null values - put them at the end
        if (valueA === null && valueB === null) return 0;
        if (valueA === null) return 1;
        if (valueB === null) return -1;

        // Compare numeric values
        const numA = typeof valueA === 'number' ? valueA : 0;
        const numB = typeof valueB === 'number' ? valueB : 0;

        const comparison = numA - numB;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [allItems, itemsData, sortBy, sortOrder, filterMetric, filterOperator, filterValue]);

  const handleClearFilters = () => {
    setSortBy(null);
    setSortOrder('asc');
    setFilterMetric(null);
    setFilterOperator('gt');
    setFilterValue('');
  };

  return (
    <>
      {!hasConfig && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please configure your data provider in Settings to start adding companies.
        </Alert>
      )}

      {hasSelection && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Users size={20} />}
            onClick={onShowCreateGroup}
            disabled={selectedCompaniesCount < 2}
          >
            Create Group ({selectedCompaniesCount} companies)
          </Button>
          <Button variant="contained" onClick={onShowComparison}>
            Compare Selected ({selectedItems.size})
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<X size={20} />}
            onClick={onDeselectAll}
          >
            Deselect All
          </Button>
        </Box>
      )}

      {allItems.length > 0 && (
        <CompanySortFilter
          items={allItems}
          itemsData={itemsData}
          sortBy={sortBy}
          sortOrder={sortOrder}
          filterMetric={filterMetric}
          filterOperator={filterOperator}
          filterValue={filterValue}
          onSortChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onFilterMetricChange={setFilterMetric}
          onFilterOperatorChange={setFilterOperator}
          onFilterValueChange={setFilterValue}
          onClearFilters={handleClearFilters}
        />
      )}

      {allItems.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            textAlign: 'center',
          }}
        >
          <img src={logo_with_name} alt="PeerCompare Logo" style={{ height: '520px' }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No companies added yet
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {hasConfig
              ? 'Click the + button to add your first company'
              : 'Configure settings first, then add companies'}
          </Typography>
          {hasConfig && (
            <Button
              variant="contained"
              size="large"
              startIcon={<Plus size={24} />}
              onClick={onShowAddDialog}
            >
              Add Company
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {processedItems.map((item) => {
            const isGroup = 'isGroup' in item;
            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={showDetailView ? 6 : 4}
                lg={showDetailView ? 6 : 4}
                key={item.id}
              >
                <CompanyTile
                  item={item}
                  keyMetrics={keyMetrics}
                  customMetrics={customMetrics}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelect={() => onToggleSelect(item.id)}
                  onRemove={
                    isGroup
                      ? () => onRemoveGroup(item.id)
                      : () => onRemoveCompany(item.id)
                  }
                  onShowDetails={() => onShowDetails(item.id)}
                  onRefresh={onRefreshCompany}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
};
