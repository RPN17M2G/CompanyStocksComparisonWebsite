import { ComparisonTemplate, PREDEFINED_TEMPLATES } from '../shared/types/comparisonTemplate';
import { getItem, setItem } from './storageService';

const STORAGE_KEY = 'comparison_templates';

/**
 * Get all templates (predefined + custom)
 */
export function getAllTemplates(): ComparisonTemplate[] {
  const customTemplates = getItem<ComparisonTemplate[]>(STORAGE_KEY, []);
  return [...PREDEFINED_TEMPLATES, ...customTemplates];
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): ComparisonTemplate | undefined {
  const allTemplates = getAllTemplates();
  return allTemplates.find(t => t.id === id);
}

/**
 * Save a custom template
 */
export function saveTemplate(template: ComparisonTemplate): void {
  if (template.isPredefined) {
    throw new Error('Cannot save predefined templates');
  }

  const customTemplates = getItem<ComparisonTemplate[]>(STORAGE_KEY, []);
  const existingIndex = customTemplates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    customTemplates[existingIndex] = template;
  } else {
    customTemplates.push(template);
  }

  setItem(STORAGE_KEY, customTemplates);
}

/**
 * Delete a custom template
 */
export function deleteTemplate(id: string): void {
  const template = getTemplateById(id);
  if (template?.isPredefined) {
    throw new Error('Cannot delete predefined templates');
  }

  const customTemplates = getItem<ComparisonTemplate[]>(STORAGE_KEY, []);
  const filtered = customTemplates.filter(t => t.id !== id);
  setItem(STORAGE_KEY, filtered);
}

/**
 * Create a new template from current grid configuration
 */
export function createTemplateFromGrid(
  name: string,
  description: string | undefined,
  metricIds: string[],
  metricPriorities: Record<string, number>,
  visibleMetrics: string[],
  categories?: string[]
): ComparisonTemplate {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    isPredefined: false,
    metricIds,
    metricPriorities,
    visibleMetrics,
    categories,
  };
}

