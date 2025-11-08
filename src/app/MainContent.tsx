import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import { Plus, Users, X } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric } from '../shared/types/types';
import { CompanyTile } from '../features/company-tile/CompanyTile';

type MainContentProps = {
  hasConfig: boolean;
  allItems: (Company | ComparisonGroup)[];
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
};

export const MainContent = ({
  hasConfig,
  allItems,
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
}: MainContentProps) => {
  const hasSelection = selectedItems.size >= 2;
  const showDetailView = detailItemId !== null;

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
          {allItems.map((item) => {
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
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
};
