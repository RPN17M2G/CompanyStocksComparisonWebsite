import { useMemo } from 'react';
import { CustomMetric, RawFinancialData } from '../../../shared/types/types';
import { MetricDefinition } from '../types';
import { coreMetrics } from '../../../engine/coreMetrics';
import { getAllAvailableMetrics } from '../../../engine/dynamicMetrics';
import {
    calculateCoreMetric,
    calculateCustomMetric,
    calculateDynamicMetric,
} from '../../../engine/metricCalculator';

export function useMetricDefinitions(
    itemsData: Map<string, RawFinancialData>,
    customMetrics: CustomMetric[]
) {
    return useMemo(() => {
        const definitions = new Map<string, MetricDefinition>();
        // Collect data from ALL companies in the comparison to ensure complete metric discovery
        const allData = Array.from(itemsData.values()).filter(Boolean) as RawFinancialData[];

        const detectTimePeriod = (metricId: string, metricName: string) => {
            const fieldName = metricId.toLowerCase();
            const nameLower = metricName.toLowerCase();
            if (fieldName.startsWith('annual_') || nameLower.startsWith('annual ')) {
                return { isAnnual: true, isQuarterly: false, subcategory: 'Annual' };
            } else if (fieldName.startsWith('quarterly_') || nameLower.startsWith('quarterly ')) {
                return { isAnnual: false, isQuarterly: true, subcategory: 'Quarterly' };
            }
            return { isAnnual: false, isQuarterly: false, subcategory: undefined };
        };

        // Core
        coreMetrics.forEach(m => {
            definitions.set(m.id, {
                ...m,
                ...detectTimePeriod(m.id, m.name),
                isCustom: false,
                calculateValue: (data) => calculateCoreMetric(m.id, data) as number | null,
            });
        });

        // Dynamic - collect metrics from ALL companies to ensure complete comparison
        // This ensures that if Company A has field "X" and Company B has field "Y",
        // both metrics will appear in the comparison table
        const dynamicMetrics = getAllAvailableMetrics(allData);
        // Create a case-insensitive map to check for duplicates
        const normalizedIds = new Map<string, string>(); // normalized -> original
        definitions.forEach((_, id) => {
            normalizedIds.set(id.toLowerCase(), id);
        });
        
        dynamicMetrics.forEach(m => {
            const normalizedId = m.id.toLowerCase();
            // Skip if a core metric with the same normalized ID already exists
            if (!normalizedIds.has(normalizedId)) {
                definitions.set(m.id, {
                    ...m,
                    ...detectTimePeriod(m.id, m.name),
                    isCustom: false,
                    calculateValue: (data) => calculateDynamicMetric(m, data) as number | null,
                });
                normalizedIds.set(normalizedId, m.id);
            }
        });

        // Custom
        customMetrics.forEach(m => {
            definitions.set(m.id, {
                ...m,
                ...detectTimePeriod(m.id, m.name),
                category: 'Custom Metrics',
                isCustom: true,
                calculateValue: (data) => calculateCustomMetric(m, data),
            });
        });

        return definitions;
    }, [itemsData, customMetrics]);
}
