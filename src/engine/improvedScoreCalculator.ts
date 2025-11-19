/**
 * Improved Score Calculator
 * Transparent, category-based scoring with better normalization and user control
 */
import { RawFinancialData } from '../shared/types/types';
import { ScoringConfiguration, validateScoringConfig } from './scoringConfig';
import { MetricScore, ItemScore } from './scoreCalculator';

interface MetricValue {
  itemId: string;
  value: number | null;
}

interface CategoryScore {
  category: string;
  score: number; // 0-100
  weight: number;
  metrics: Array<{
    metricId: string;
    metricName: string;
    score: number;
    weight: number;
    value: number | null;
    contribution: number; // How much this metric contributed to final score
  }>;
}

/**
 * Calculate data completeness for a metric across all items
 */
function calculateDataCompleteness(
  values: MetricValue[]
): number {
  const validCount = values.filter(v => v.value !== null && isFinite(v.value!)).length;
  return values.length > 0 ? validCount / values.length : 0;
}

/**
 * Normalize values using different methods
 */
function normalizeValues(
  values: number[],
  method: 'min-max' | 'percentile' | 'z-score'
): Map<number, number> {
  const normalized = new Map<number, number>();

  if (values.length === 0) return normalized;
  if (values.length === 1) {
    normalized.set(values[0], 50);
    return normalized;
  }

  switch (method) {
    case 'min-max': {
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max === min) {
        values.forEach(v => normalized.set(v, 50));
      } else {
        values.forEach(v => {
          normalized.set(v, ((v - min) / (max - min)) * 100);
        });
      }
      break;
    }

    case 'percentile': {
      const sorted = [...values].sort((a, b) => a - b);
      values.forEach(v => {
        const rank = sorted.findIndex(s => s >= v);
        const percentile = (rank / (sorted.length - 1)) * 100;
        normalized.set(v, percentile);
      });
      break;
    }

    case 'z-score': {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev === 0) {
        values.forEach(v => normalized.set(v, 50));
      } else {
        values.forEach(v => {
          const zScore = (v - mean) / stdDev;
          // Convert z-score to 0-100 scale (assuming normal distribution, 99.7% within 3 std devs)
          const normalizedValue = Math.max(0, Math.min(100, 50 + (zScore / 3) * 50));
          normalized.set(v, normalizedValue);
        });
      }
      break;
    }
  }

  return normalized;
}

/**
 * Improved score calculation with transparency and category-based approach
 */
export function calculateImprovedScores(
  items: Array<{ id: string; name: string; data: RawFinancialData }>,
  config: ScoringConfiguration,
  metricDefinitions: Map<string, {
    name: string;
    calculateValue: (data: RawFinancialData) => number | null;
    betterDirection?: 'higher' | 'lower';
  }>
): Array<ItemScore & { categoryScores: CategoryScore[]; calculationBreakdown: string }> {
  // Validate config
  if (!config) {
    console.error('Scoring configuration is null or undefined');
    return [];
  }

  const validation = validateScoringConfig(config);
  if (!validation.valid) {
    console.error('Invalid scoring configuration:', validation.errors);
    // Return empty array instead of crashing
    return [];
  }

  // Check if there are any enabled categories
  const enabledCategories = config.categories.filter(cat => cat.enabled);
  if (enabledCategories.length === 0) {
    console.error('No enabled categories in scoring configuration');
    return [];
  }

  if (items.length === 0) return [];

  // Collect all enabled metrics with their values
  const enabledMetrics = new Map<string, {
    metricId: string;
    metricName: string;
    category: string;
    weight: number;
    betterDirection?: 'higher' | 'lower';
    calculateValue: (data: RawFinancialData) => number | null;
  }>();

  config.categories.forEach(categoryConfig => {
    if (!categoryConfig.enabled) return;

    categoryConfig.metrics.forEach(metricConfig => {
      if (!metricConfig.enabled) return;

      const def = metricDefinitions.get(metricConfig.metricId);
      if (!def) return;

      enabledMetrics.set(metricConfig.metricId, {
        metricId: metricConfig.metricId,
        metricName: def.name,
        category: categoryConfig.category,
        weight: metricConfig.weight,
        betterDirection: def.betterDirection,
        calculateValue: def.calculateValue,
      });
    });
  });

  // Calculate values for all metrics and items
  const metricValuesMap = new Map<string, MetricValue[]>();
  enabledMetrics.forEach((metric, metricId) => {
    const values: MetricValue[] = items.map(item => ({
      itemId: item.id,
      value: metric.calculateValue(item.data),
    }));
    metricValuesMap.set(metricId, values);
  });

  // Filter metrics by data completeness
  const validMetrics = new Map<string, typeof enabledMetrics extends Map<string, infer V> ? V : never>();
  enabledMetrics.forEach((metric, metricId) => {
    const values = metricValuesMap.get(metricId)!;
    const completeness = calculateDataCompleteness(values);
    
    if (completeness >= config.minDataCompleteness) {
      validMetrics.set(metricId, metric);
    }
  });

  // Calculate category scores for each item
  const itemScores = items.map(item => {
    const categoryScores: CategoryScore[] = [];
    const itemMetricScores: MetricScore[] = [];

    // Process each category
    config.categories.forEach(categoryConfig => {
      if (!categoryConfig.enabled) return;

      const categoryMetrics = categoryConfig.metrics
        .filter(m => m.enabled && validMetrics.has(m.metricId))
        .map(m => ({
          config: m,
          metric: validMetrics.get(m.metricId)!,
        }));

      if (categoryMetrics.length === 0) return;

      // Get values for this category
      const categoryValues: Array<{ metricId: string; value: number | null }> = [];
      // Store normalization maps per metric (each metric normalized independently)
      const metricNormalizationMaps = new Map<string, Map<number, number>>();

      categoryMetrics.forEach(({ metric, config: mConfig }) => {
        const itemValue = metricValuesMap.get(metric.metricId)!.find(v => v.itemId === item.id);
        const value = itemValue?.value ?? null;

        if (value !== null && isFinite(value)) {
          categoryValues.push({ metricId: metric.metricId, value });
        } else {
          categoryValues.push({ metricId: metric.metricId, value: null });
        }

        // Normalize each metric independently (don't mix metrics with different scales)
        if (!metricNormalizationMaps.has(metric.metricId)) {
          const allItemValues = metricValuesMap.get(metric.metricId)!
            .map(v => v.value)
            .filter((v): v is number => v !== null && isFinite(v));
          
          if (allItemValues.length > 0) {
            const normalizedMap = normalizeValues(allItemValues, config.normalizationMethod);
            metricNormalizationMaps.set(metric.metricId, normalizedMap);
          }
        }
      });

      // Calculate weighted score for this category
      let categoryWeightedScore = 0;
      let categoryTotalWeight = 0;
      const metricContributions: CategoryScore['metrics'] = [];

      categoryMetrics.forEach(({ metric, config: mConfig }) => {
        const itemValue = categoryValues.find(v => v.metricId === metric.metricId);
        const value = itemValue?.value;

        if (value === null || !isFinite(value)) {
          if (config.includeMissingData) {
            // Assign neutral score for missing data
            const neutralScore = 50;
            const contribution = (neutralScore * mConfig.weight * categoryConfig.weight) / 10000;
            categoryWeightedScore += contribution;
            categoryTotalWeight += mConfig.weight;
            
            metricContributions.push({
              metricId: metric.metricId,
              metricName: metric.metricName,
              score: neutralScore,
              weight: mConfig.weight,
              value: null,
              contribution,
            });
          }
          return;
        }

        // Get normalized score for this specific metric
        const metricNormalizedMap = metricNormalizationMaps.get(metric.metricId);
        let normalizedScore = metricNormalizedMap?.get(value) ?? 50;

        // Adjust for betterDirection
        if (metric.betterDirection === 'lower') {
          normalizedScore = 100 - normalizedScore;
        }

        // Calculate contribution to final score
        // Formula: (metric_score * metric_weight * category_weight) / 10000
        const contribution = (normalizedScore * mConfig.weight * categoryConfig.weight) / 10000;
        categoryWeightedScore += contribution;
        categoryTotalWeight += mConfig.weight;

        metricContributions.push({
          metricId: metric.metricId,
          metricName: metric.metricName,
          score: normalizedScore,
          weight: mConfig.weight,
          value,
          contribution,
        });

        // Add to item metric scores
        itemMetricScores.push({
          metricId: metric.metricId,
          metricName: metric.metricName,
          score: normalizedScore,
          weight: mConfig.weight,
          value,
          rank: 0, // Will be calculated below
        });
      });

      // Category score is the weighted average
      const categoryScore = categoryTotalWeight > 0
        ? (categoryWeightedScore / categoryTotalWeight) * 100
        : 0;

      categoryScores.push({
        category: categoryConfig.category,
        score: categoryScore,
        weight: categoryConfig.weight,
        metrics: metricContributions,
      });
    });

    // Calculate total score from category scores
    const totalScore = categoryScores.reduce((sum, cat) => {
      return sum + (cat.score * cat.weight / 100);
    }, 0);

    // Generate calculation breakdown
    const breakdown = generateCalculationBreakdown(categoryScores, totalScore);

    return {
      itemId: item.id,
      itemName: item.name,
      totalScore,
      metricScores: itemMetricScores,
      rank: 0, // Will be set below
      categoryScores,
      calculationBreakdown: breakdown,
    };
  });

  // Calculate ranks for each metric
  // Collect all unique metric IDs from all items
  const metricRankMap = new Map<string, Map<string, number>>();
  itemScores.forEach(item => {
    item.metricScores.forEach(ms => {
      if (!metricRankMap.has(ms.metricId)) {
        metricRankMap.set(ms.metricId, new Map());
      }
    });
  });

  metricRankMap.forEach((rankMap, metricId) => {
    const scores = itemScores
      .map(item => ({
        itemId: item.itemId,
        score: item.metricScores.find(ms => ms.metricId === metricId)?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score);

    scores.forEach((s, index) => {
      rankMap.set(s.itemId, index + 1);
    });
  });

  // Update ranks in metric scores
  itemScores.forEach(item => {
    item.metricScores.forEach(ms => {
      ms.rank = metricRankMap.get(ms.metricId)?.get(item.itemId) ?? 0;
    });
  });

  // Sort by total score and assign overall ranks
  itemScores.sort((a, b) => b.totalScore - a.totalScore);
  itemScores.forEach((item, index) => {
    item.rank = index + 1;
  });

  return itemScores;
}

/**
 * Generate human-readable calculation breakdown
 */
function generateCalculationBreakdown(
  categoryScores: CategoryScore[],
  totalScore: number
): string {
  const lines: string[] = [];
  lines.push(`Total Score: ${totalScore.toFixed(2)}`);
  lines.push('');
  lines.push('Breakdown by Category:');
  
  categoryScores.forEach(cat => {
    const contribution = (cat.score * cat.weight) / 100;
    lines.push(`  ${cat.category} (${cat.weight.toFixed(1)}% weight): ${cat.score.toFixed(2)} → ${contribution.toFixed(2)} points`);
    
    if (cat.metrics.length > 0) {
      lines.push('    Metrics:');
      cat.metrics.forEach(metric => {
        lines.push(`      - ${metric.metricName}: ${metric.score.toFixed(2)} (weight: ${metric.weight.toFixed(1)}%, contribution: ${metric.contribution.toFixed(3)} points)`);
      });
    }
  });

  return lines.join('\n');
}

