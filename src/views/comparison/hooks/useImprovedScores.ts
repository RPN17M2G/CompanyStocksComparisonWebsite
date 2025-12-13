import { useMemo, useDeferredValue, useState, useEffect } from 'react';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../../../shared/types/types';
import { MetricConfig, MetricDefinition } from '../types';
import { calculateImprovedScores } from '../../../engine/improvedScoreCalculator';
import { getDefaultScoringConfig, validateScoringConfig, DEFAULT_SCORING_CONFIG } from '../../../engine/scoringConfig';
import { loadScoringConfig } from '../../../services/scoringStorage';
import { calculateCustomMetric } from '../../../engine/metricCalculator';

export function useImprovedScores(
  items: (Company | ComparisonGroup)[],
  itemsData: Map<string, RawFinancialData>,
  visibleMetrics: MetricConfig[],
  metricDefinitions: Map<string, MetricDefinition>,
  customMetrics: CustomMetric[],
  externalConfigVersion?: number
) {
  const deferredItems = useDeferredValue(items);
  const deferredItemsData = useDeferredValue(itemsData);
  const deferredVisibleMetrics = useDeferredValue(visibleMetrics);
  const deferredMetricDefinitions = useDeferredValue(metricDefinitions);
  const deferredCustomMetrics = useDeferredValue(customMetrics);

  const [configVersion, setConfigVersion] = useState(0);
  
  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfigVersion(prev => prev + 1);
    };
    
    window.addEventListener('scoringConfigUpdated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('scoringConfigUpdated', handleConfigUpdate);
    };
  }, []);

  useEffect(() => {
    if (externalConfigVersion !== undefined && externalConfigVersion > 0) {
      setConfigVersion(externalConfigVersion);
    }
  }, [externalConfigVersion]);

  const scoringConfig = useMemo(() => {
    let config = loadScoringConfig();
    
    const metricsForConfig = deferredVisibleMetrics
      .map(m => {
        const def = deferredMetricDefinitions.get(m.id);
        if (!def) return null;
        return {
          id: m.id,
          name: m.name,
          category: m.category,
          priority: m.priority,
        };
      })
      .filter((m): m is { id: string; name: string; category: string; priority: number } => m !== null);

    if (metricsForConfig.length === 0) {
      console.warn('No metrics available for scoring configuration');
      return {
        ...DEFAULT_SCORING_CONFIG,
        categories: [],
      };
    }

    if (config && config.categories && config.categories.length > 0) {
      const validation = validateScoringConfig(config);
      if (validation.valid) {
        const savedMetricIds = new Set(
          config.categories.flatMap(cat => cat.metrics.map(m => m.metricId))
        );
        const hasNewMetrics = metricsForConfig.some(m => !savedMetricIds.has(m.id));
        
        if (hasNewMetrics) {
          const updatedConfig = getDefaultScoringConfig(metricsForConfig);
          const mergedCategories = updatedConfig.categories.map(newCat => {
            const existingCat = config!.categories.find(c => c.category === newCat.category);
            if (existingCat) {
              const existingMetricIds = new Set(existingCat.metrics.map(m => m.metricId));
              const newMetrics = newCat.metrics.filter(m => !existingMetricIds.has(m.metricId));
              
              return {
                ...newCat,
                enabled: existingCat.enabled,
                weight: existingCat.weight,
                metrics: [...existingCat.metrics, ...newMetrics],
              };
            }
            return newCat;
          });
          
          config = {
            ...config,
            categories: mergedCategories,
          };
          
          const revalidation = validateScoringConfig(config);
          if (!revalidation.valid) {
            console.warn('Config invalid after merge, using saved config as-is:', revalidation.errors);
            config = loadScoringConfig();
          }
        }
        return config;
      } else {
        console.warn('Invalid scoring config, using default:', validation.errors);
        config = getDefaultScoringConfig(metricsForConfig);
      }
    } else {
      config = getDefaultScoringConfig(metricsForConfig);
    }

    if (config.categories.length === 0 || !config.categories.some(cat => cat.enabled)) {
      console.warn('No enabled categories found, creating default config');
      config = getDefaultScoringConfig(metricsForConfig);
      
      if (config.categories.length === 0 || !config.categories.some(cat => cat.enabled)) {
        console.error('Failed to create valid scoring config - no metrics available');
        return {
          ...DEFAULT_SCORING_CONFIG,
          categories: [],
        };
      }
    }

    return config;
  }, [deferredVisibleMetrics, deferredMetricDefinitions, configVersion]);

  return useMemo(() => {
    const itemsWithData = deferredItems.map(item => ({
      id: item.id,
      name: 'isGroup' in item ? item.name : item.ticker,
      data: deferredItemsData.get(item.id) || { ticker: '', name: '' } as RawFinancialData,
    })).filter(item => item.data && Object.keys(item.data).length > 2);

    if (itemsWithData.length < 2) return [];

    if (!scoringConfig || !scoringConfig.categories || scoringConfig.categories.length === 0) {
      console.warn('No scoring configuration available, returning empty scores');
      return [];
    }

    const enabledCategories = scoringConfig.categories.filter(cat => cat.enabled);
    if (enabledCategories.length === 0) {
      console.warn('No enabled categories in scoring configuration, returning empty scores');
      return [];
    }

    const metricDefsForScoring = new Map<string, {
      name: string;
      calculateValue: (data: RawFinancialData) => number | null;
      betterDirection?: 'higher' | 'lower';
    }>();

    deferredVisibleMetrics.forEach(m => {
      const def = deferredMetricDefinitions.get(m.id);
      if (def) {
        metricDefsForScoring.set(m.id, {
          name: def.name,
          calculateValue: (data: RawFinancialData) => {
            const result = def.calculateValue(data);
            if (typeof result === 'string') {
              const num = parseFloat(result);
              return isNaN(num) ? null : num;
            }
            return result;
          },
          betterDirection: def.betterDirection,
        });
      }
    });

    deferredCustomMetrics.forEach(cm => {
      const config = deferredVisibleMetrics.find(vm => vm.id === cm.id);
      if (config && config.priority > 0) {
        metricDefsForScoring.set(cm.id, {
          name: cm.name,
          calculateValue: (data: RawFinancialData) => {
            return calculateCustomMetric(cm, data);
          },
          betterDirection: cm.betterDirection,
        });
      }
    });

    return calculateImprovedScores(itemsWithData, scoringConfig, metricDefsForScoring);
  }, [
    deferredItems,
    deferredItemsData,
    deferredVisibleMetrics,
    deferredMetricDefinitions,
    deferredCustomMetrics,
    scoringConfig,
  ]);
}

