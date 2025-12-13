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

        coreMetrics.forEach(m => {
            definitions.set(m.id, {
                ...m,
                ...detectTimePeriod(m.id, m.name),
                isCustom: false,
                calculateValue: (data) => calculateCoreMetric(m.id, data) as number | null,
            });
        });

        const dynamicMetrics = getAllAvailableMetrics(allData);
        const normalizedIds = new Map<string, string>();
        definitions.forEach((_, id) => {
            normalizedIds.set(id.toLowerCase(), id);
        });
        
        dynamicMetrics.forEach(m => {
            const normalizedId = m.id.toLowerCase();
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
