import { RawFinancialData, CustomMetric, CoreMetric, DynamicMetric } from '../shared/types/types';
import {
  calculateCoreMetric,
  calculateCustomMetric,
  calculateDynamicMetric,
  parseNumericValue,
} from './metricCalculator';
import { coreMetrics } from './coreMetrics';

export interface MetricScore {
  metricId: string;
  metricName: string;
  score: number; // 0-100
  weight: number; // Priority weight
  value: number | null;
  rank: number; // 1 = best
}

export interface ItemScore {
  itemId: string;
  itemName: string;
  totalScore: number; // 0-100
  metricScores: MetricScore[];
  rank: number; // 1 = best overall
}

interface MetricConfig {
  id: string;
  name: string;
  priority: number; // 1-10
  betterDirection?: 'higher' | 'lower';
  calculateValue: (data: RawFinancialData) => number | null;
}

/**
 * Calculate overall scores for all items based on metrics with priorities
 */
export function calculateOverallScores(
  items: Array<{ id: string; name: string; data: RawFinancialData }>,
  metrics: MetricConfig[],
  customMetrics: CustomMetric[]
): ItemScore[] {
  if (items.length === 0 || (metrics.length === 0 && customMetrics.length === 0)) {
    return [];
  }

  // Combine all metrics
  const allMetricConfigs: MetricConfig[] = [
    ...metrics,
    ...customMetrics.map(cm => ({
      id: cm.id,
      name: cm.name,
      priority: cm.priority || 5,
      betterDirection: cm.betterDirection,
      calculateValue: (data: RawFinancialData) => calculateCustomMetric(cm, data),
    })),
  ].filter(m => m.priority > 0); // Only include metrics with priority > 0

  if (allMetricConfigs.length === 0) {
    return [];
  }

  // For each metric, calculate scores for all items
  const metricScoresMap = new Map<string, Array<{ itemId: string; value: number | null; score: number }>>();

  allMetricConfigs.forEach(metricConfig => {
    const values: Array<{ itemId: string; value: number | null }> = items.map(item => ({
      itemId: item.id,
      value: metricConfig.calculateValue(item.data),
    }));

    // Filter out null/invalid values for normalization
    const validValues = values
      .filter(v => v.value !== null && isFinite(v.value!))
      .map(v => v.value!);

    if (validValues.length === 0) {
      // No valid values, all get 0
      metricScoresMap.set(
        metricConfig.id,
        values.map(v => ({ itemId: v.itemId, value: v.value, score: 0 }))
      );
      return;
    }

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);

    const scores: Array<{ itemId: string; value: number | null; score: number }> = values.map(({ itemId, value }) => {
      if (value === null || !isFinite(value)) {
        return { itemId, value, score: 0 };
      }

      // Normalize to 0-100
      let normalized: number;
      if (max === min) {
        normalized = 50; // All same values = middle score
      } else {
        normalized = ((value - min) / (max - min)) * 100;
      }

      // Adjust based on betterDirection
      if (metricConfig.betterDirection === 'lower') {
        // Lower is better - invert the score
        normalized = 100 - normalized;
      }

      return { itemId, value, score: normalized };
    });

    metricScoresMap.set(metricConfig.id, scores);
  });

  // Calculate weighted total scores for each item
  const itemScores: ItemScore[] = items.map((item, itemIndex) => {
    const metricScores: MetricScore[] = [];

    let totalWeightedScore = 0;
    let totalWeight = 0;

    allMetricConfigs.forEach(metricConfig => {
      const metricScoreData = metricScoresMap.get(metricConfig.id)?.[itemIndex];
      if (!metricScoreData) return;

      const weight = metricConfig.priority; // Priority is the weight
      totalWeightedScore += metricScoreData.score * weight;
      totalWeight += weight;

      // Calculate rank for this metric (1 = best)
      const allScoresForMetric = metricScoresMap.get(metricConfig.id) || [];
      const sortedScores = [...allScoresForMetric]
        .sort((a, b) => b.score - a.score);
      const rank = sortedScores.findIndex(s => s.itemId === item.id) + 1;

      metricScores.push({
        metricId: metricConfig.id,
        metricName: metricConfig.name,
        score: metricScoreData.score,
        weight,
        value: metricScoreData.value,
        rank,
      });
    });

    const totalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      itemId: item.id,
      itemName: item.name,
      totalScore,
      metricScores,
      rank: 0, // Will be set below
    };
  });

  // Sort by total score and assign ranks
  itemScores.sort((a, b) => b.totalScore - a.totalScore);
  itemScores.forEach((item, index) => {
    item.rank = index + 1;
  });

  return itemScores;
}

/**
 * Get best/worst indicator for a metric value
 * Returns: 'best' | 'worst' | 'good' | 'bad' | null
 */
export function getValueIndicator(
  value: number | null,
  allValues: (number | null)[],
  betterDirection?: 'higher' | 'lower'
): 'best' | 'worst' | 'good' | 'bad' | null {
  if (value === null || !isFinite(value)) return null;

  const validValues = allValues.filter(v => v !== null && isFinite(v!)) as number[];
  if (validValues.length === 0) return null;

  const sorted = [...validValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Determine best and worst based on betterDirection
  const bestValue = betterDirection === 'lower' ? min : max;
  const worstValue = betterDirection === 'lower' ? max : min;

  // Check for exact matches (best/worst)
  if (Math.abs(value - bestValue) < 0.0001) {
    return 'best';
  }
  if (Math.abs(value - worstValue) < 0.0001) {
    return 'worst';
  }

  // Check if in top 30% (good) or bottom 30% (bad)
  const thresholdTop = sorted[Math.floor(sorted.length * 0.3)];
  const thresholdBottom = sorted[Math.ceil(sorted.length * 0.7)];

  if (betterDirection === 'lower') {
    if (value <= thresholdTop) return 'good';
    if (value >= thresholdBottom) return 'bad';
  } else {
    if (value >= thresholdBottom) return 'good';
    if (value <= thresholdTop) return 'bad';
  }

  return null;
}

