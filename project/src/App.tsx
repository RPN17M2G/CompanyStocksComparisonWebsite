import { useState, useEffect, useMemo } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Box,
  Fab,
  Alert,
  Snackbar,
} from '@mui/material';
import { Plus, Settings, TrendingUp, Users, Edit3 } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric, DataProviderConfig, RawFinancialData } from './types';
import { storageService } from './services/storageService';
import { getAdapter } from './adapters';
import { aggregateGroupData } from './engine/metricCalculator';
import { CompanyTile } from './components/CompanyTile';
import { AddCompanyDialog } from './components/AddCompanyDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { CustomMetricEditor } from './components/CustomMetricEditor';
import { CreateGroupDialog } from './components/CreateGroupDialog';
import { ComparisonView } from './components/ComparisonView';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Blue
    },
    secondary: {
      main: '#10b981', // Green
    },
    background: {
      default: '#f8fafc', // A very light gray
      paper: '#ffffff',   // White
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2563eb', // Same Blue
    },
    secondary: {
      main: '#10b981', // Same Green
    },
    background: {
      default: '#0b1120', // A very dark blue/gray
      paper: '#121e36',   // A slightly lighter dark blue/gray
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [config, setConfig] = useState<DataProviderConfig | null>(null);
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomMetrics, setShowCustomMetrics] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    const savedConfig = storageService.getProviderConfig();
    const savedTickers = storageService.getCompanyTickers();
    const savedCustomMetrics = storageService.getCustomMetrics();
    const savedGroups = storageService.getComparisonGroups();
    const savedKeyMetrics = storageService.getKeyMetrics();

    setConfig(savedConfig);
    setCustomMetrics(savedCustomMetrics);
    setGroups(savedGroups);
    setKeyMetrics(savedKeyMetrics);

    const initialCompanies: Company[] = savedTickers.map(ticker => ({
      id: ticker,
      ticker,
      rawData: null,
      isLoading: false,
      error: null,
    }));

    setCompanies(initialCompanies);

    if (savedConfig) {
      initialCompanies.forEach(company => {
        fetchCompanyData(company.ticker, savedConfig);
      });
    }
  }, []);

  const fetchCompanyData = async (ticker: string, providerConfig: DataProviderConfig) => {
    setCompanies(prev =>
      prev.map(c => (c.ticker === ticker ? { ...c, isLoading: true, error: null } : c))
    );

    try {
      const adapter = getAdapter(providerConfig.provider);
      if (!adapter) {
        throw new Error('Invalid data provider');
      }

      const data = await adapter.fetchCompanyData(ticker, providerConfig.apiKey);

      setCompanies(prev =>
        prev.map(c =>
          c.ticker === ticker ? { ...c, rawData: data, isLoading: false, error: null } : c
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCompanies(prev =>
        prev.map(c =>
          c.ticker === ticker ? { ...c, isLoading: false, error: errorMessage } : c
        )
      );
    }
  };

  const handleAddCompany = (ticker: string) => {
    if (companies.some(c => c.ticker === ticker)) {
      setSnackbar({
        open: true,
        message: `${ticker} is already added`,
        severity: 'error',
      });
      return;
    }

    if (!config) {
      setSnackbar({
        open: true,
        message: 'Please configure settings first',
        severity: 'error',
      });
      setShowSettings(true);
      return;
    }

    const newCompany: Company = {
      id: ticker,
      ticker,
      rawData: null,
      isLoading: true,
      error: null,
    };

    setCompanies(prev => [...prev, newCompany]);
    storageService.addCompanyTicker(ticker);
    fetchCompanyData(ticker, config);
  };

  const handleRemoveCompany = (ticker: string) => {
    setCompanies(prev => prev.filter(c => c.ticker !== ticker));
    storageService.removeCompanyTicker(ticker);
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(ticker);
      return next;
    });
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(ticker);
      return next;
    });
  };

  const handleSaveConfig = (newConfig: DataProviderConfig) => {
    setConfig(newConfig);
    storageService.saveProviderConfig(newConfig);

    companies.forEach(company => {
      if (!company.rawData && !company.isLoading) {
        fetchCompanyData(company.ticker, newConfig);
      }
    });

    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success',
    });
  };

  const handleAddCustomMetric = (metric: CustomMetric) => {
    setCustomMetrics(prev => [...prev, metric]);
    storageService.addCustomMetric(metric);
    setSnackbar({
      open: true,
      message: 'Custom metric created',
      severity: 'success',
    });
  };

  const handleDeleteCustomMetric = (metricId: string) => {
    setCustomMetrics(prev => prev.filter(m => m.id !== metricId));
    storageService.removeCustomMetric(metricId);
  };

  const handleCreateGroup = (group: ComparisonGroup) => {
    setGroups(prev => [...prev, group]);
    storageService.addComparisonGroup(group);
    setSelectedItems(new Set());
    setSnackbar({
      open: true,
      message: `Group "${group.name}" created`,
      severity: 'success',
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    storageService.removeComparisonGroup(groupId);
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const groupData = useMemo(() => {
    const dataMap = new Map<string, RawFinancialData>();

    companies.forEach(company => {
      if (company.rawData) {
        dataMap.set(company.id, company.rawData);
      }
    });

    groups.forEach(group => {
      const aggregated = aggregateGroupData(group, companies);
      dataMap.set(group.id, aggregated);
    });

    return dataMap;
  }, [companies, groups]);

  const allItems = [...companies, ...groups];
  const selectedCompanies = companies.filter(c => selectedItems.has(c.id));
  const comparisonItems = allItems.filter(item => selectedItems.has(item.id));

  const hasConfig = config !== null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <AppBar position="sticky" elevation={1}>
          <Toolbar>
            <TrendingUp size={28} style={{ marginRight: 12 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stock-to-Metrics Dashboard
            </Typography>
            <Button color="inherit" startIcon={<Edit3 size={20} />} onClick={() => setShowCustomMetrics(true)}>
              Custom Metrics
            </Button>
            <Button color="inherit" startIcon={<Settings size={20} />} onClick={() => setShowSettings(true)}>
              Settings
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {!hasConfig && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Please configure your data provider in Settings to start adding companies.
            </Alert>
          )}

          {selectedItems.size >= 2 && (
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Users size={20} />}
                onClick={() => setShowCreateGroup(true)}
                disabled={selectedCompanies.length < 2}
              >
                Create Group ({selectedCompanies.length} companies)
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowComparison(true)}
              >
                Compare Selected ({selectedItems.size})
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
                  onClick={() => setShowAddDialog(true)}
                >
                  Add Company
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={3}>
              {allItems.map(item => {
                const isGroup = 'isGroup' in item;
                const data = groupData.get(item.id);

                if (isGroup) {
                  const group = item as ComparisonGroup;
                  const groupWithData: ComparisonGroup = { ...group };

                  return (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <CompanyTile
                        item={groupWithData}
                        keyMetrics={keyMetrics}
                        customMetrics={customMetrics}
                        isExpanded={expandedItems.has(item.id)}
                        isSelected={selectedItems.has(item.id)}
                        onToggleExpand={() => toggleExpanded(item.id)}
                        onToggleSelect={() => toggleSelected(item.id)}
                      />
                    </Grid>
                  );
                }

                const company = item as Company;
                const companyWithAggregatedData = data ? { ...company, rawData: data } : company;

                return (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <CompanyTile
                      item={companyWithAggregatedData}
                      keyMetrics={keyMetrics}
                      customMetrics={customMetrics}
                      isExpanded={expandedItems.has(item.id)}
                      isSelected={selectedItems.has(item.id)}
                      onToggleExpand={() => toggleExpanded(item.id)}
                      onToggleSelect={() => toggleSelected(item.id)}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>

        {hasConfig && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={28} />
          </Fab>
        )}

        <AddCompanyDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddCompany}
        />

        <SettingsDialog
          open={showSettings}
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveConfig}
        />

        <CustomMetricEditor
          open={showCustomMetrics}
          customMetrics={customMetrics}
          onClose={() => setShowCustomMetrics(false)}
          onAddMetric={handleAddCustomMetric}
          onDeleteMetric={handleDeleteCustomMetric}
        />

        <CreateGroupDialog
          open={showCreateGroup}
          selectedCompanies={selectedCompanies}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />

        <ComparisonView
          open={showComparison}
          items={comparisonItems}
          itemsData={groupData}
          customMetrics={customMetrics}
          onClose={() => setShowComparison(false)}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
