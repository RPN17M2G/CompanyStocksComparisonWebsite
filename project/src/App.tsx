import { useState, useEffect, useMemo } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Box,
  Fab,
  Alert,
  Snackbar,
  IconButton,
  GlobalStyles,
  Paper,
  Divider, // <-- Import Divider
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Plus, Settings, TrendingUp, Users, Edit3, X } from 'lucide-react';
import { Company, ComparisonGroup, CustomMetric, DataProviderConfig, RawFinancialData } from './types';
import { storageService } from './services/storageService';
import { getAdapter } from './adapters';
// Import metric functions needed for DetailView
import { aggregateGroupData } from './engine/metricCalculator';
import { CompanyTile } from './components/CompanyTile';
import { AddCompanyDialog } from './components/AddCompanyDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { CustomMetricEditor } from './components/CustomMetricEditor';
import { CreateGroupDialog } from './components/CreateGroupDialog';
import { ComparisonView } from './components/ComparisonView';
import { DetailView } from './components/DetailView'; // Import the new component

// --- Theme Palettes ---
export const lightTheme = {
    mode: 'light',
    primary: {
      main: '#5c87e4ff', // Blue (Updated)
    },
    secondary: {
      main: '#10b981', // Green
    },
    background: {
      default: '#f8fafc', // A very light gray
      paper: '#ffffff',   // White
    }
  }

export const darkTheme = {
  mode: 'dark',
  primary: {
    main: '#2563eb', // Same Blue
  },
  secondary: {
    main: '#10b981', // Green
  },
  background: {
    default: '#0b1120', // A very dark blue/gray
    paper: '#121e36',   // A slightly lighter dark blue/gray
  }
}

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
};

// --- 1. Define the Global Styles for the Animation ---
const animatedBackgroundStyles = (theme: any) => ({
  '@keyframes gradientAnimation': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  'body': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(-45deg, 
          ${theme.palette.background.default}, 
          ${theme.palette.background.paper}, 
          ${theme.palette.primary.dark}, 
          ${theme.palette.secondary.dark})`
      : `linear-gradient(-45deg, 
          ${theme.palette.background.default}, 
          ${theme.palette.background.paper}, 
          ${theme.palette.primary.light}, 
          ${theme.palette.secondary.light})`,
    backgroundSize: '400% 400%',
    animation: 'gradientAnimation 20s ease infinite',
    transition: 'background 300ms ease-in-out',
  },
});


function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [config, setConfig] = useState<DataProviderConfig | null>(null);
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // --- New State for Master-Detail ---
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  // ------------------------------------

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
    if (detailItemId === ticker) { // Added
      setDetailItemId(null);
    }
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
    if (detailItemId === groupId) { // Added
      setDetailItemId(null);
    }
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(groupId);
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

  // --- Get data for the detail view ---
  const detailItem = useMemo(() =>
    allItems.find(item => item.id === detailItemId),
    [detailItemId, allItems]
  );
  const detailItemData = useMemo(() =>
    detailItem ? groupData.get(detailItem.id) : null,
    [detailItem, groupData]
  );
  // ------------------------------------

  const hasConfig = config !== null;

  const [mode, setMode] = useState('dark');
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === 'light' ? lightTheme : darkTheme,
        typography: typography,
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={animatedBackgroundStyles} />

      {/* --- Updated Layout for Master-Detail --- */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'transparent' }}>
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
            <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* --- Content Area --- */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* --- Master View (Grid) --- */}
          <Box
            component="main"
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 4,
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              width: detailItem ? '60%' : '100%',
              boxSizing: 'border-box',
            }}
          >
            {!hasConfig && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Please configure your data provider in Settings to start adding companies.
              </Alert>
            )}

            {selectedItems.size >= 2 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<X size={20} />}
                  onClick={() => setSelectedItems(new Set())}
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
                      <Grid item xs={12} sm={6} md={detailItem ? 6 : 4} lg={detailItem ? 6 : 4} key={item.id}>
                        <CompanyTile
                          item={groupWithData}
                          keyMetrics={keyMetrics}
                          customMetrics={customMetrics}
                          isSelected={selectedItems.has(item.id)}
                          onToggleSelect={() => toggleSelected(item.id)}
                          onRemove={() => handleRemoveGroup(item.id)}
                          onShowDetails={() => setDetailItemId(item.id)}
                        />
                      </Grid>
                    );
                  }

                  const company = item as Company;
                  const companyWithAggregatedData = data ? { ...company, rawData: data } : company;

                  return (
                    // Update Grid breakpoints to be responsive
                    <Grid item xs={12} sm={6} md={detailItem ? 6 : 4} lg={detailItem ? 6 : 4} key={item.id}>
                      <CompanyTile
                        item={companyWithAggregatedData}
                        keyMetrics={keyMetrics}
                        customMetrics={customMetrics}
                        isSelected={selectedItems.has(item.id)}
                        onToggleSelect={() => toggleSelected(item.id)}
                        onRemove={() => handleRemoveCompany(item.id)}
                        onShowDetails={() => setDetailItemId(item.id)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
          
          {/* --- UPDATED DISTINGUISHED SEPARATOR --- */}
          {detailItem && (
            <Divider 
              orientation="vertical" 
              flexItem 
              sx={{ 
                borderWidth: 0,
                width: '3px', // Made it thicker
                // Made gradient more visible
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))'
                  : 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.2), rgba(0,0,0,0))',
                height: '75%', // Shortened it a bit
                my: 'auto',
                borderRadius: '2px', // Rounded edges
                boxShadow: (theme) => `0 0 10px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` // Added shadow
              }} 
            />
          )}
          {/* ------------------------------------- */}
          
          {/* --- Detail View (Panel) --- */}
          {detailItem && detailItemData && (
            <Box // This is the floating container
              sx={{
                height: '100%',
                width: '40%',
                transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                p: 3, 
                boxSizing: 'border-box',
                overflow: 'hidden', 
              }}
            >
              <DetailView
                item={detailItem}
                data={detailItemData}
                customMetrics={customMetrics}
                onClose={() => setDetailItemId(null)}
              />
            </Box>
          )}
        </Box>
        {/* --------------------------- */}

        {/* --- UPDATED "ADD COMPANY" BUTTON (ICON ONLY) --- */}
        {hasConfig && (
          <Fab
            color="default" // Use default, not primary, for glass effect
            aria-label="add"
            onClick={() => setShowAddDialog(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              
              // --- Pinned State (Half out of screen) ---
              right: -28, // Partially hidden circle (half of 56)
              width: 56, // Standard Fab size
              height: 56,
              borderRadius: '50%', // Always a circle
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transition
              
              // Glassmorphism
              backgroundColor: (theme) => 
                theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              boxShadow: (theme) => theme.shadows[8],
              color: 'text.primary',
              
              // --- Expanded (Hover) state ---
              '&:hover': {
                right: 24, // Slide IN to view
                boxShadow: (theme) => theme.shadows[12], // "Pop" more
                // Need to override default hover color
                backgroundColor: (theme) => 
                  theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            {/* Icon only */}
            <Plus size={28} />
          </Fab>
        )}
        {/* ---------------------------------- */}


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

