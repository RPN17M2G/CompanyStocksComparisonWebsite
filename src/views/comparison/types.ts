import { RawFinancialData } from '../../shared/types/types';

export interface MetricDefinition {
    id: string;
    name: string;
    category: string;
    format: string;
    calculateValue: (data: RawFinancialData) => string | number | null;
    betterDirection?: 'higher' | 'lower';
    isCustom: boolean;
    isAnnual?: boolean;
    isQuarterly?: boolean;
    subcategory?: string;
}

export interface MetricConfig {
    id: string;
    name: string;
    category: string;
    format: string;
    priority: number; // 1-10
    betterDirection?: 'higher' | 'lower';
    isVisible: boolean;
    isCustom: boolean;
    displayOrder?: number;
    tileSize?: 'small' | 'medium' | 'large';
    isAnnual?: boolean;
    isQuarterly?: boolean;
    subcategory?: string;
}
