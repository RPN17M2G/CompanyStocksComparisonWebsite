import { useMemo, useDeferredValue } from 'react';
import { Company, ComparisonGroup, CustomMetric, RawFinancialData } from '../../../shared/types/types';
import { MetricConfig, MetricDefinition } from '../types';
import { calculateOverallScores } from '../../../engine/scoreCalculator';

export function useComparisonScores(
    items: (Company | ComparisonGroup)[],
    itemsData: Map<string, RawFinancialData>,
    visibleMetrics: MetricConfig[],
    metricDefinitions: Map<string, MetricDefinition>,
    customMetrics: CustomMetric[]
) {
    // Defer heavy computations to avoid blocking UI
    const deferredItems = useDeferredValue(items);
    const deferredItemsData = useDeferredValue(itemsData);
    const deferredVisibleMetrics = useDeferredValue(visibleMetrics);
    const deferredMetricDefinitions = useDeferredValue(metricDefinitions);
    const deferredCustomMetrics = useDeferredValue(customMetrics);
    
    return useMemo(() => {
        const itemsWithData = deferredItems.map(item => ({
            id: item.id,
            name: 'isGroup' in item ? item.name : item.ticker,
            data: deferredItemsData.get(item.id) || { ticker: '', name: '' } as RawFinancialData,
        })).filter(item => item.data && Object.keys(item.data).length > 2);

        if (itemsWithData.length < 2) return [];

        // Map config back to definition for calculation
        const metricsForScoring = deferredVisibleMetrics.map(m => {
            const def = deferredMetricDefinitions.get(m.id);
            return {
                id: m.id,
                name: m.name,
                priority: m.priority,
                betterDirection: def?.betterDirection,
                calculateValue: def?.calculateValue || (() => null),
            };
        });

        // Filter custom metrics that are visible
        const customMetricsForScoring = deferredCustomMetrics.filter(cm => {
            const config = deferredVisibleMetrics.find(vm => vm.id === cm.id);
            return config && config.priority > 0;
        });

        return calculateOverallScores(itemsWithData, metricsForScoring, customMetricsForScoring);
    }, [deferredItems, deferredItemsData, deferredVisibleMetrics, deferredMetricDefinitions, deferredCustomMetrics]);
}
