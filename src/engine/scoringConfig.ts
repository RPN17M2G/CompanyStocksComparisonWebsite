/**
 * Scoring Configuration
 * Defines how scores are calculated with user control and transparency
 */

export interface ScoringMetricConfig {
  metricId: string;
  enabled: boolean;
  weight: number; // 0-100, relative weight within category
  category: string;
}

export interface ScoringCategoryConfig {
  category: string;
  enabled: boolean;
  weight: number; // 0-100, relative weight for the category
  metrics: ScoringMetricConfig[];
}

export interface ScoringConfiguration {
  categories: ScoringCategoryConfig[];
  normalizationMethod: 'min-max' | 'percentile' | 'z-score';
  includeMissingData: boolean;
  minDataCompleteness: number; // 0-1, minimum % of items that must have data for metric to be included
  maxMetricsPerCategory: number; // Limit metrics per category to avoid overload
}

export const DEFAULT_SCORING_CONFIG: ScoringConfiguration = {
  categories: [],
  normalizationMethod: 'percentile',
  includeMissingData: false,
  minDataCompleteness: 0.5, // At least 50% of items must have data
  maxMetricsPerCategory: 10, // Max 10 metrics per category
};

/**
 * Get default scoring configuration based on available metrics
 */
export function getDefaultScoringConfig(
  availableMetrics: Array<{ id: string; name: string; category: string; priority: number }>
): ScoringConfiguration {
  // If no metrics provided, return empty config
  if (!availableMetrics || availableMetrics.length === 0) {
    console.warn('getDefaultScoringConfig: No metrics provided');
    return {
      ...DEFAULT_SCORING_CONFIG,
      categories: [],
    };
  }

  // Group metrics by category
  const categoryMap = new Map<string, Array<{ id: string; name: string; priority: number }>>();
  
  availableMetrics.forEach(metric => {
    if (!categoryMap.has(metric.category)) {
      categoryMap.set(metric.category, []);
    }
    categoryMap.get(metric.category)!.push({
      id: metric.id,
      name: metric.name,
      priority: metric.priority,
    });
  });

  // Create category configs with only high-priority metrics
  let categories: ScoringCategoryConfig[] = Array.from(categoryMap.entries())
    .map(([category, metrics]) => {
      // Filter to only high-priority metrics (priority >= 7) and limit count
      const highPriorityMetrics = metrics
        .filter(m => m.priority >= 7)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, DEFAULT_SCORING_CONFIG.maxMetricsPerCategory);

      // Calculate weights based on priority
      const totalPriority = highPriorityMetrics.reduce((sum, m) => sum + m.priority, 0);
      
      const metricConfigs: ScoringMetricConfig[] = highPriorityMetrics.map(metric => ({
        metricId: metric.id,
        enabled: true,
        weight: totalPriority > 0 ? (metric.priority / totalPriority) * 100 : 100 / highPriorityMetrics.length,
        category,
      }));

      // Category weight based on number of important metrics
      const categoryWeight = highPriorityMetrics.length > 0 ? 100 : 0;

      return {
        category,
        enabled: highPriorityMetrics.length > 0,
        weight: categoryWeight,
        metrics: metricConfigs,
      };
    })
    .filter(cat => cat.enabled && cat.metrics.length > 0);

  // Ensure at least one category is enabled
  if (categories.length === 0) {
    // If no high-priority metrics, use all metrics with priority >= 5
    const fallbackCategories: ScoringCategoryConfig[] = Array.from(categoryMap.entries())
      .map(([category, metrics]) => {
        const mediumPriorityMetrics = metrics
          .filter(m => m.priority >= 5)
          .sort((a, b) => b.priority - a.priority)
          .slice(0, DEFAULT_SCORING_CONFIG.maxMetricsPerCategory);

        if (mediumPriorityMetrics.length === 0) return null;

        const totalPriority = mediumPriorityMetrics.reduce((sum, m) => sum + m.priority, 0);
        
        const metricConfigs: ScoringMetricConfig[] = mediumPriorityMetrics.map(metric => ({
          metricId: metric.id,
          enabled: true,
          weight: totalPriority > 0 ? (metric.priority / totalPriority) * 100 : 100 / mediumPriorityMetrics.length,
          category,
        }));

        return {
          category,
          enabled: true,
          weight: 100,
          metrics: metricConfigs,
        };
      })
      .filter((cat): cat is ScoringCategoryConfig => cat !== null);

    if (fallbackCategories.length > 0) {
      categories = fallbackCategories;
    }
  }

  // Normalize category weights
  const totalCategoryWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  if (totalCategoryWeight > 0) {
    categories.forEach(cat => {
      cat.weight = (cat.weight / totalCategoryWeight) * 100;
    });
  }

  // Final safety check - ensure at least one category
  // If still no categories, use ALL available metrics regardless of priority
  if (categories.length === 0 && availableMetrics.length > 0) {
    console.warn('No high/medium priority metrics found, using all available metrics');
    categories = Array.from(categoryMap.entries())
      .map(([category, metrics]) => {
        const allMetrics = metrics
          .sort((a, b) => b.priority - a.priority)
          .slice(0, DEFAULT_SCORING_CONFIG.maxMetricsPerCategory);

        if (allMetrics.length === 0) return null;

        const totalPriority = allMetrics.reduce((sum, m) => sum + (m.priority || 1), 0);
        
        const metricConfigs: ScoringMetricConfig[] = allMetrics.map(metric => ({
          metricId: metric.id,
          enabled: true,
          weight: totalPriority > 0 ? ((metric.priority || 1) / totalPriority) * 100 : 100 / allMetrics.length,
          category,
        }));

        return {
          category,
          enabled: true,
          weight: 100,
          metrics: metricConfigs,
        };
      })
      .filter((cat): cat is ScoringCategoryConfig => cat !== null);
  }

  // Final check - if still no categories, return empty
  if (categories.length === 0) {
    console.warn('No metrics available for scoring configuration');
    return {
      ...DEFAULT_SCORING_CONFIG,
      categories: [],
    };
  }

  return {
    ...DEFAULT_SCORING_CONFIG,
    categories,
  };
}

/**
 * Validate scoring configuration
 */
export function validateScoringConfig(config: ScoringConfiguration | null): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config) {
    errors.push('Configuration is null or undefined');
    return { valid: false, errors };
  }

  if (!config.categories || config.categories.length === 0) {
    errors.push('At least one category must be enabled');
    return { valid: false, errors };
  }

  config.categories.forEach((category, catIdx) => {
    if (category.enabled) {
      const enabledMetrics = category.metrics.filter(m => m.enabled);
      if (enabledMetrics.length === 0) {
        errors.push(`Category "${category.category}" has no enabled metrics`);
      }

      const totalWeight = enabledMetrics.reduce((sum, m) => sum + m.weight, 0);
      if (totalWeight === 0) {
        errors.push(`Category "${category.category}" has zero total weight`);
      }
    }
  });

  const enabledCategories = config.categories.filter(cat => cat.enabled);
  if (enabledCategories.length > 0) {
    const totalCategoryWeight = enabledCategories.reduce((sum, cat) => sum + cat.weight, 0);
    if (Math.abs(totalCategoryWeight - 100) > 0.01) {
      errors.push(`Category weights must sum to 100% (currently ${totalCategoryWeight.toFixed(2)}%)`);
    }
  }

  if (config.minDataCompleteness < 0 || config.minDataCompleteness > 1) {
    errors.push('minDataCompleteness must be between 0 and 1');
  }

  if (config.maxMetricsPerCategory < 1) {
    errors.push('maxMetricsPerCategory must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

