import { AddCompanyDialog } from '../features/manage-companies/AddCompanyDialog';
import { SettingsDialog }  from '../settings/SettingsDialog';
import { CustomMetricEditor } from '../features/metric-editor/CustomMetricEditor';
import { CreateGroupDialog } from '../features/manage-groups/CreateGroupDialog';
import { ComparisonView } from '../views/comparison/ComparisonView';
import {
  Company,
  ComparisonGroup,
  CustomMetric,
  DataProviderConfig,
  RawFinancialData,
} from '../shared/types/types';

type AppModalsProps = {
  // Add Dialog
  showAddDialog: boolean;
  onCloseAddDialog: () => void;
  onAddCompany: (ticker: string) => void;

  // Settings Dialog
  showSettings: boolean;
  config: DataProviderConfig | null;
  onCloseSettings: () => void;
  onSaveConfig: (config: DataProviderConfig) => void;

  // Custom Metrics Dialog
  showCustomMetrics: boolean;
  customMetrics: CustomMetric[];
  onCloseCustomMetrics: () => void;
  onAddMetric: (metric: CustomMetric) => void;
  onDeleteMetric: (id: string) => void;

  // Create Group Dialog
  showCreateGroup: boolean;
  selectedCompanies: Company[];
  onCloseCreateGroup: () => void;
  onCreateGroup: (group: ComparisonGroup) => void;

  // Comparison Dialog
  showComparison: boolean;
  comparisonItems: (Company | ComparisonGroup)[];
  itemsData: Map<string, RawFinancialData>;
  onCloseComparison: () => void;
  onRemoveItemFromComparison: (id: string) => void;
  onToggleSelect: (id: string) => void;
};

export const AppModals = ({
  showAddDialog,
  onCloseAddDialog,
  onAddCompany,
  showSettings,
  config,
  onCloseSettings,
  onSaveConfig,
  showCustomMetrics,
  customMetrics,
  onCloseCustomMetrics,
  onAddMetric,
  onDeleteMetric,
  showCreateGroup,
  selectedCompanies,
  onCloseCreateGroup,
  onCreateGroup,
  showComparison,
  comparisonItems,
  itemsData,
  onCloseComparison,
  onRemoveItemFromComparison,
  onToggleSelect,
}: AppModalsProps) => {
  return (
    <>
      <AddCompanyDialog
        open={showAddDialog}
        onClose={onCloseAddDialog}
        onAdd={onAddCompany}
      />

      <SettingsDialog
        open={showSettings}
        config={config}
        onClose={onCloseSettings}
        onSave={onSaveConfig}
      />

      <CustomMetricEditor
        open={showCustomMetrics}
        customMetrics={customMetrics}
        onClose={onCloseCustomMetrics}
        onAddMetric={onAddMetric}
        onDeleteMetric={onDeleteMetric}
      />

      <CreateGroupDialog
        open={showCreateGroup}
        selectedCompanies={selectedCompanies}
        onClose={onCloseCreateGroup}
        onCreateGroup={onCreateGroup}
      />

      <ComparisonView
        open={showComparison}
        items={comparisonItems}
        itemsData={itemsData}
        customMetrics={customMetrics}
        onClose={onCloseComparison}
        onAddCompany={onAddCompany} 
        onRemoveItem={onRemoveItemFromComparison}
        onToggleSelect={onToggleSelect}
      />
    </>
  );
};
