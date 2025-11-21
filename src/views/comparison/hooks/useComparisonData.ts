import { useMemo, useDeferredValue } from 'react';
import { Company, ComparisonGroup, RawFinancialData } from '../../../shared/types/types';
import { MetricDefinition } from '../types';
import { getValueIndicator } from '../../../engine/scoreCalculator';

export function useComparisonData(
    items: (Company | ComparisonGroup)[],
    itemsData: Map<string, RawFinancialData>,
    metricDefinitions: Map<string, MetricDefinition>
) {
    // Defer heavy computations to avoid blocking UI
    const deferredItems = useDeferredValue(items);
    const deferredItemsData = useDeferredValue(itemsData);
    const deferredMetricDefinitions = useDeferredValue(metricDefinitions);
    
    return useMemo(() => {
        const values = new Map<string, Map<string, string | number | null>>();
        const indicators = new Map<string, Map<string, any>>();

        if (deferredItems.length === 0) return { allMetricValues: values, allValueIndicators: indicators };

        // For every known metric definition
        for (const [metricId, def] of deferredMetricDefinitions.entries()) {
            const itemValues = new Map<string, string | number | null>();
            const rawValuesArray: number[] = [];

            // Calculate Value
            for (const item of deferredItems) {
                const data = deferredItemsData.get(item.id);
                const val = data ? def.calculateValue(data) : null;

                // Preserve strings, validate numbers
                // Handle null/undefined explicitly, preserve 0 and other valid numbers
                let safeVal: string | number | null = null;
                if (val === null || val === undefined) {
                    safeVal = null;
                } else if (typeof val === 'string') {
                    safeVal = val;
                } else if (typeof val === 'number') {
                    // Accept 0, finite numbers, but reject NaN, Infinity, -Infinity
                    if (isFinite(val)) {
                        safeVal = val;
                        rawValuesArray.push(val);
                    } else {
                        // NaN, Infinity, or -Infinity - set to null
                        safeVal = null;
                    }
                }

                itemValues.set(item.id, safeVal);
            }
            values.set(metricId, itemValues);

            // Calculate Indicators (Batch) - only for numeric values
            const itemIndicators = new Map<string, any>();
            for (const item of deferredItems) {
                const val = itemValues.get(item.id);
                if (val === null || val === undefined || typeof val === 'string') {
                    itemIndicators.set(item.id, null);
                } else {
                    itemIndicators.set(item.id, getValueIndicator(val, rawValuesArray, def.betterDirection));
                }
            }
            indicators.set(metricId, itemIndicators);
        }

        return { allMetricValues: values, allValueIndicators: indicators };
    }, [deferredItems, deferredItemsData, deferredMetricDefinitions]);
}
