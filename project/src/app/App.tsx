import { ThemeProvider, Snackbar, Alert, Box } from '@mui/material';
import { useThemeManager } from './theme/useThemeManager';
import { useAppLogic } from './useAppLogic';
import { AppLayout } from './AppLayout';
import { MainContent } from './MainContent';
import { AppModals } from './AppModals';
import { DetailView } from '../views/detail/DetailView';
import { useResizablePanel } from '../shared/hooks/useResizablePanel'; 

const INIT_WIDTH = 35; // Initial width percentage of the detail view panel
const MIN_WIDTH = 15;  // Minimum width percentage of the detail view panel
const MAX_WIDTH = 50;  // Maximum width percentage of the detail view panel

function App() {
  const { theme, mode, toggleTheme } = useThemeManager();
  const logic = useAppLogic();

  const {
    width: detailViewWidth,
    onMouseDown: handleDetailResize,
    isResizing: isDetailViewResizing,
  } = useResizablePanel({
    initialWidth: INIT_WIDTH,
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
  });

  return (
    <ThemeProvider theme={theme}>
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
        />
      </AppLayout>

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
        onDeleteMetric={logic.handleDeleteCustomMetric}
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
