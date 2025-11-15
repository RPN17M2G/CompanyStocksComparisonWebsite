import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Company,
  ComparisonGroup,
  CustomMetric,
  DataProviderConfig,
  RawFinancialData,
} from '../shared/types/types';
import { storageService } from '../services/storageService';
import { getAdapter } from '../adapters/AdapterManager';
import { aggregateGroupData } from '../engine/metricCalculator';

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

export const useAppLogic = () => {
  // Core Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [config, setConfig] = useState<DataProviderConfig | null>(null);
  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<string[]>([]);

  // UI State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Modal/Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomMetrics, setShowCustomMetrics] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // FAB Hover State
  const [isFabHovered, setIsFabHovered] = useState(false);
  const fabHoverTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Data Loading Effect ---
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

    const initialCompanies: Company[] = savedTickers.map((ticker) => ({
      id: ticker,
      ticker,
      rawData: null,
      isLoading: false,
      error: null,
    }));

    setCompanies(initialCompanies);

    if (savedConfig) {
      initialCompanies.forEach((company) => {
        fetchCompanyData(company.ticker, savedConfig, false); 
      });
    }
  }, []);

  // --- Core Logic & Handlers ---

  const fetchCompanyData = async (
    ticker: string,
    providerConfig: DataProviderConfig | DataProviderConfig[],
    showError = true
  ) => {
    setCompanies((prev) =>
      prev.map((c) => (c.ticker === ticker ? { ...c, isLoading: true, error: null } : c))
    );

    try {
      let data: RawFinancialData;

      // Check if multiple providers are specified
      if (Array.isArray(providerConfig)) {
        // Multi-API fetch
        const { fetchFromMultipleApis } = await import('../adapters/multiApiFetcher');
        data = await fetchFromMultipleApis(
          ticker,
          providerConfig.map(c => ({ provider: c.provider, apiKey: c.apiKey })),
          'merge'
        );
      } else {
        // Single API fetch
        const adapter = getAdapter(providerConfig.provider);
        if (!adapter) {
          throw new Error('Invalid data provider');
        }
        data = await adapter.fetchCompanyData(ticker, providerConfig.apiKey);
      }

      setCompanies((prev) =>
        prev.map((c) =>
          c.ticker === ticker 
            ? { 
                ...c, 
                rawData: data, 
                isLoading: false, 
                error: null,
                lastUpdated: Date.now(),
              } 
            : c
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCompanies((prev) =>
        prev.map((c) =>
          c.ticker === ticker ? { ...c, isLoading: false, error: errorMessage } : c
        )
      );
      if (showError) {
        setSnackbar({ open: true, message: `Failed to fetch ${ticker}: ${errorMessage}`, severity: 'error' });
      }
    }
  };

  const handleAddCompany = (ticker: string) => {
    if (companies.some((c) => c.ticker === ticker)) {
      setSnackbar({ open: true, message: `${ticker} is already added`, severity: 'error' });
      return;
    }

    if (!config) {
      setSnackbar({
        open: true,
        message: 'Please configure at least one data provider in Settings',
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

    setCompanies((prev) => [...prev, newCompany]);
    storageService.addCompanyTicker(ticker);
    fetchCompanyData(ticker, config);
  };

  const handleRemoveCompany = (ticker: string) => {
    setCompanies((prev) => prev.filter((c) => c.ticker !== ticker));
    storageService.removeCompanyTicker(ticker);
    if (detailItemId === ticker) {
      setDetailItemId(null);
    }
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(ticker);
      return next;
    });
  };

  const handleSaveConfig = (newConfig: DataProviderConfig | DataProviderConfig[]) => {
    // Store as single config if array has one item, otherwise store first as primary
    const primaryConfig = Array.isArray(newConfig) ? newConfig[0] : newConfig;
    setConfig(primaryConfig);
    storageService.saveProviderConfig(primaryConfig);

    // Refresh all companies with new config
    companies.forEach((company) => {
      if (!company.isLoading) {
        fetchCompanyData(company.ticker, newConfig);
      }
    });

    setSnackbar({ 
      open: true, 
      message: Array.isArray(newConfig) 
        ? `Settings saved: ${newConfig.length} API provider(s) configured`
        : 'Settings saved successfully', 
      severity: 'success' 
    });
  };

  const handleAddCustomMetric = (metric: CustomMetric) => {
    setCustomMetrics((prev) => [...prev, metric]);
    storageService.addCustomMetric(metric);
    setSnackbar({ open: true, message: 'Custom metric created', severity: 'success' });
  };

  const handleImportCustomMetrics = (metrics: CustomMetric[]) => {
    setCustomMetrics((prev) => {
      const existingIds = new Set(prev.map(m => m.id));
      const newMetrics = metrics.filter(m => !existingIds.has(m.id));
      const updated = [...prev, ...newMetrics];
      storageService.saveCustomMetrics(updated);
      return updated;
    });
    setSnackbar({ 
      open: true, 
      message: `Imported ${metrics.length} custom metric(s)`, 
      severity: 'success' 
    });
  };

  const handleDeleteCustomMetric = (metricId: string) => {
    setCustomMetrics((prev) => prev.filter((m) => m.id !== metricId));
    storageService.removeCustomMetric(metricId);
  };

  const handleCreateGroup = (group: ComparisonGroup) => {
    setGroups((prev) => [...prev, group]);
    storageService.addComparisonGroup(group);
    setSelectedItems(new Set());
    setSnackbar({ open: true, message: `Group "${group.name}" created`, severity: 'success' });
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    storageService.removeComparisonGroup(groupId);
    if (detailItemId === groupId) {
      setDetailItemId(null);
    }
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- FAB Handlers ---
  const handleFabMouseEnter = () => {
    if (fabHoverTimer.current) {
      clearTimeout(fabHoverTimer.current);
      fabHoverTimer.current = null;
    }
    setIsFabHovered(true);
  };

  const handleFabMouseLeave = () => {
    fabHoverTimer.current = setTimeout(() => {
      setIsFabHovered(false);
    }, 1000); // 1-second delay for reducing jumping back to place when not hovering
  };

  // --- Derived State (Memoized) ---
  const allItems = useMemo(() => [...companies, ...groups], [companies, groups]);
  const hasConfig = useMemo(() => config !== null, [config]);

  const groupData = useMemo(() => {
    const dataMap = new Map<string, RawFinancialData>();
    companies.forEach((company) => {
      if (company.rawData) {
        dataMap.set(company.id, company.rawData);
      }
    });
    groups.forEach((group) => {
      const aggregated = aggregateGroupData(group, companies);
      dataMap.set(group.id, aggregated);
    });
    return dataMap;
  }, [companies, groups]);

  const selectedCompanies = useMemo(
    () => companies.filter((c) => selectedItems.has(c.id)),
    [companies, selectedItems]
  );

  const comparisonItems = useMemo(
    () => allItems.filter((item) => selectedItems.has(item.id)),
    [allItems, selectedItems]
  );

  const detailItem = useMemo(
    () => allItems.find((item) => item.id === detailItemId),
    [detailItemId, allItems]
  );

  const detailItemData = useMemo(
    () => (detailItem ? groupData.get(detailItem.id) : null),
    [detailItem, groupData]
  );

  const handleRemoveItemFromComparison = (itemId: string) => {
    if (selectedItems.has(itemId)) {
      toggleSelected(itemId);
    }
  };

  return {
    // State
    companies,
    groups,
    config,
    customMetrics,
    keyMetrics,
    selectedItems,
    detailItemId,
    snackbar,
    isFabHovered,
    
    // Derived State
    groupData,
    allItems,
    selectedCompanies,
    comparisonItems,
    detailItem,
    detailItemData,
    hasConfig,

    // State Setters
    setDetailItemId,
    setSelectedItems,
    setSnackbar,

    // Modal State
    showAddDialog,
    showSettings,
    showCustomMetrics,
    showCreateGroup,
    showComparison,

    // Modal Handlers
    openAddDialog: () => setShowAddDialog(true),
    closeAddDialog: () => setShowAddDialog(false),
    openSettings: () => setShowSettings(true),
    closeSettings: () => setShowSettings(false),
    openCustomMetrics: () => setShowCustomMetrics(true),
    closeCustomMetrics: () => setShowCustomMetrics(false),
    openCreateGroup: () => setShowCreateGroup(true),
    closeCreateGroup: () => setShowCreateGroup(false),
    openComparison: () => setShowComparison(true),
    closeComparison: () => setShowComparison(false),

    // Core Logic Handlers
    handleAddCompany,
    handleRemoveCompany,
    handleSaveConfig,
    handleAddCustomMetric,
    handleImportCustomMetrics,
    handleDeleteCustomMetric,
    handleCreateGroup,
    handleRemoveGroup,
    toggleSelected,
    handleRemoveItemFromComparison,
    
    // FAB Handlers
    handleFabMouseEnter,
    handleFabMouseLeave,
  };
};
