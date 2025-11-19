import { ThemeProvider, Snackbar, Alert, Box } from '@mui/material';
import { useTransition } from 'react';
import { useThemeManager } from './theme/useThemeManager';
import { useAppLogic } from './useAppLogic';
import { AppLayout } from './AppLayout';
import { MainContent } from './MainContent';
import { AppModals } from './AppModals';
import { DetailView } from '../views/detail/DetailView';
import { ComparisonViewFullscreen } from '../views/comparison/ComparisonViewFullscreen';
import { useResizablePanel } from '../shared/hooks/useResizablePanel';
import { RawFinancialData } from '../shared/types/types'; 

const INIT_WIDTH = 35; // Initial width percentage of the detail view panel
const MIN_WIDTH = 15;  // Minimum width percentage of the detail view panel
const MAX_WIDTH = 50;  // Maximum width percentage of the detail view panel

function App() {
  const { theme, mode, toggleTheme } = useThemeManager();
  const logic = useAppLogic();
  const [isPending, startTransition] = useTransition();

  const {
    width: detailViewWidth,
    onMouseDown: handleDetailResize,
    isResizing: isDetailViewResizing,
  } = useResizablePanel({
    initialWidth: INIT_WIDTH,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
  });

  // Optimize comparison view opening with transition
  const shouldShowComparison = logic.showComparison && logic.comparisonItems.length > 0;

  return (
    <ThemeProvider theme={theme}>
      {/* Show full-screen comparison view when comparison is open */}
      {shouldShowComparison ? (
        <ComparisonViewFullscreen
          items={logic.comparisonItems}
          itemsData={logic.groupData}
          customMetrics={logic.customMetrics}
          availableCompanies={logic.companies}
          onClose={logic.closeComparison}
          onAddCompany={logic.handleAddCompanyToComparison}
          onRemoveItem={logic.handleRemoveItemFromComparison}
          onToggleSelect={logic.toggleSelected}
        />
      ) : (
        <AppLayout
          mode={mode}
          hasConfig={logic.hasConfig}
          isFabHovered={logic.isFabHovered}
          toggleTheme={toggleTheme}
          onShowCustomMetrics={logic.openCustomMetrics}
          onShowSettings={logic.openSettings}
          onShowAddDialog={logic.openAddDialog}
          onFabMouseEnter={logic.handleFabMouseEnter}
          onFabMouseLeave={logic.handleFabMouseLeave}
          detailView={
            logic.detailItem && logic.detailItemData ? (
              // 1. This is the OUTER container AppLayout receives.
              <Box
                sx={{
                  height: '100%',
                  width: `${detailViewWidth}%`, 
                  display: 'flex',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                {/* 2. The Resize Handle */}
                <Box
                  onMouseDown={handleDetailResize}
                  sx={{
                    width: '5px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: 'divider',
                    flexShrink: 0, 
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    ...(isDetailViewResizing && {
                      backgroundColor: 'primary.dark',
                    }),
                  }}
                />

                {/* 3. The Content Wrapper */}
                <Box
                  sx={{
                    height: '100%',
                    flexGrow: 1, // Allow content to fill remaining space
                    p: 3,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    // Prevent mouse events from being "lost" on the content
                    ...(isDetailViewResizing && {
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }),
                  }}
                >
                  <DetailView
                    item={logic.detailItem}
                    data={logic.detailItemData}
                    customMetrics={logic.customMetrics}
                    onClose={() => logic.setDetailItemId(null)}
                  />
                </Box>
              </Box>
            ) : null
          }
        >
          <MainContent
            hasConfig={logic.hasConfig}
            allItems={logic.allItems}
            itemsData={logic.groupData}
            selectedItems={logic.selectedItems}
            selectedCompaniesCount={logic.selectedCompanies.length}
            detailItemId={logic.detailItemId}
            keyMetrics={logic.keyMetrics}
            customMetrics={logic.customMetrics}
            onShowAddDialog={logic.openAddDialog}
            onShowCreateGroup={logic.openCreateGroup}
            onShowComparison={logic.openComparison}
            onDeselectAll={() => logic.setSelectedItems(new Set())}
            onToggleSelect={logic.toggleSelected}
            onRemoveGroup={logic.handleRemoveGroup}
            onRemoveCompany={logic.handleRemoveCompany}
            onShowDetails={logic.setDetailItemId}
            onRefreshCompany={logic.handleRefreshCompany}
          />
        </AppLayout>
      )}

      <AppModals
        // Add
        showAddDialog={logic.showAddDialog}
        onCloseAddDialog={logic.closeAddDialog}
        onAddCompany={logic.handleAddCompany}
        // Settings
        showSettings={logic.showSettings}
        config={logic.config}
        onCloseSettings={logic.closeSettings}
        onSaveConfig={logic.handleSaveConfig}
        // Custom Metrics
        showCustomMetrics={logic.showCustomMetrics}
        customMetrics={logic.customMetrics}
        onCloseCustomMetrics={logic.closeCustomMetrics}
        onAddMetric={logic.handleAddCustomMetric}
        onUpdateMetric={logic.handleUpdateCustomMetric}
        onImportMetrics={logic.handleImportCustomMetrics}
        onDeleteMetric={logic.handleDeleteCustomMetric}
        availableData={Array.from(logic.groupData.values()).filter(Boolean) as RawFinancialData[]}
        // Create Group
        showCreateGroup={logic.showCreateGroup}
        selectedCompanies={logic.selectedCompanies}
        onCloseCreateGroup={logic.closeCreateGroup}
        onCreateGroup={logic.handleCreateGroup}
        // Comparison
        showComparison={logic.showComparison}
        comparisonItems={logic.comparisonItems}
        itemsData={logic.groupData}
        onCloseComparison={logic.closeComparison}
        onRemoveItemFromComparison={logic.handleRemoveItemFromComparison}
        onToggleSelect={logic.toggleSelected}
      />

      <Snackbar
        open={logic.snackbar.open}
        autoHideDuration={4000}
        onClose={() => logic.setSnackbar({ ...logic.snackbar, open: false })}
      >
        <Alert severity={logic.snackbar.severity} sx={{ width: '100%' }}>
          {logic.snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
