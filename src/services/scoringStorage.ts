/**
 * Scoring Configuration Storage
 * Manages persistence of scoring settings
 */
import { ScoringConfiguration } from '../engine/scoringConfig';
import { getItem, setItem } from './storageService';

const SCORING_CONFIG_KEY = 'peercompare_scoring_config';

export function saveScoringConfig(config: ScoringConfiguration): void {
  setItem(SCORING_CONFIG_KEY, config);
  // Dispatch custom event immediately to notify other parts of the app
  // Use requestAnimationFrame to ensure it fires after the current execution
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent('scoringConfigUpdated', { detail: config }));
  });
}

export function loadScoringConfig(): ScoringConfiguration | null {
  return getItem<ScoringConfiguration | null>(SCORING_CONFIG_KEY, null);
}

export function clearScoringConfig(): void {
  setItem(SCORING_CONFIG_KEY, null);
}

