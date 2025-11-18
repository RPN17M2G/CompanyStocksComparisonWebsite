import { useState, useEffect, useDeferredValue, useMemo, useCallback } from 'react';
import { MetricConfig, MetricDefinition } from '../types';

export function useMetricConfig(availableMetricDefinitions: Map<string, MetricDefinition>) {
    const [metricConfigs, setMetricConfigs] = useState<Map<string, MetricConfig>>(new Map());
    const deferredMetricConfigs = useDeferredValue(metricConfigs);
    const [isLoading, setIsLoading] = useState(true);

    // Initialization
    useEffect(() => {
        const initialConfigs = new Map<string, MetricConfig>();
        availableMetricDefinitions.forEach((def, id) => {
            initialConfigs.set(id, {
                id,
                name: def.name,
                category: def.category,
                format: def.format,
                priority: 5, // Default
                isVisible: true,
                isCustom: def.isCustom,
                subcategory: def.subcategory,
                tileSize: 'medium'
            });
        });
        setMetricConfigs(initialConfigs);
        setIsLoading(false);
    }, [availableMetricDefinitions]);

    const updateMetricConfig = useCallback((id: string, updates: Partial<MetricConfig>) => {
        setMetricConfigs(prev => {
            const next = new Map(prev);
            const existing = next.get(id);
            if (existing) {
                next.set(id, { ...existing, ...updates });
            }
            return next;
        });
    }, []);

    const visibleMetrics = useMemo(() => {
        return Array.from(deferredMetricConfigs.values())
            .filter(m => m.isVisible && m.priority > 0)
            .sort((a, b) => {
                if (b.priority !== a.priority) return b.priority - a.priority;
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                return a.name.localeCompare(b.name);
            });
    }, [deferredMetricConfigs]);

    const metricsByCategory = useMemo(() => {
        const grouped: Record<string, MetricConfig[]> = {};
        const seenIds = new Set<string>();
        visibleMetrics.forEach(metric => {
            // Deduplicate by metric ID
            if (seenIds.has(metric.id)) return;
            seenIds.add(metric.id);
            
            if (!grouped[metric.category]) grouped[metric.category] = [];
            grouped[metric.category].push(metric);
        });
        return grouped;
    }, [visibleMetrics]);

    return {
        metricConfigs,
        deferredMetricConfigs,
        visibleMetrics,
        metricsByCategory,
        updateMetricConfig,
        setMetricConfigs, // Exposed for template loading
        isLoading
    };
}
