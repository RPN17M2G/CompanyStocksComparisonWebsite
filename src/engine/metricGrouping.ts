import { DynamicMetric } from '../shared/types/types';

export interface NestedMetricGroup {
  category: string;
  subcategories: Record<string, DynamicMetric[]>;
  directMetrics: DynamicMetric[]; // Metrics that don't belong to any subcategory
}

/**
 * Groups metrics by category, with special handling for Annual/Quarterly subcategories
 */
export function groupMetricsWithSubcategories(metrics: DynamicMetric[]): NestedMetricGroup[] {
  const categoryMap = new Map<string, {
    subcategories: Map<string, DynamicMetric[]>;
    directMetrics: DynamicMetric[];
  }>();

  metrics.forEach(metric => {
    const fieldName = metric.id.toLowerCase();
    
    // Check if metric belongs to Annual or Quarterly subcategory
    let subcategory: string | null = null;
    let metricName = metric.name;
    let metricId = metric.id;

    if (fieldName.startsWith('annual_') || fieldName.startsWith('annual ')) {
      subcategory = 'Annual';
      metricName = metric.name.replace(/^Annual\s+/i, '');
      metricId = metric.id.replace(/^annual_/, '');
    } else if (fieldName.startsWith('quarterly_') || fieldName.startsWith('quarterly ')) {
      subcategory = 'Quarterly';
      metricName = metric.name.replace(/^Quarterly\s+/i, '');
      metricId = metric.id.replace(/^quarterly_/, '');
    }

    // Get or create category entry
    if (!categoryMap.has(metric.category)) {
      categoryMap.set(metric.category, {
        subcategories: new Map(),
        directMetrics: [],
      });
    }

    const categoryData = categoryMap.get(metric.category)!;

    if (subcategory) {
      // Add to subcategory
      if (!categoryData.subcategories.has(subcategory)) {
        categoryData.subcategories.set(subcategory, []);
      }
      // Create a modified metric without the prefix for display
      categoryData.subcategories.get(subcategory)!.push({
        ...metric,
        name: metricName,
        id: metricId, // Keep original ID for data lookup, but display name is cleaned
      });
    } else {
      // Add to direct metrics
      categoryData.directMetrics.push(metric);
    }
  });

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    subcategories: Object.fromEntries(data.subcategories),
    directMetrics: data.directMetrics,
  }));
}

