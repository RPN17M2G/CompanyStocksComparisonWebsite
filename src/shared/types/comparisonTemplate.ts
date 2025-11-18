export interface ComparisonTemplate {
  id: string;
  name: string;
  description?: string;
  isPredefined: boolean;
  metricIds: string[]; // IDs of metrics to include in this template
  metricPriorities: Record<string, number>; // Metric ID -> Priority (1-10)
  visibleMetrics: string[]; // Which metrics are visible in the grid
  columnWidths?: Record<string, number>; // Custom column widths
  categories?: string[]; // Categories to show
}

// Predefined templates
export const PREDEFINED_TEMPLATES: ComparisonTemplate[] = [
  {
    id: 'valuation-overview',
    name: 'Valuation Overview',
    description: 'Key valuation metrics for stock comparison',
    isPredefined: true,
    metricIds: ['peRatio', 'pbRatio', 'psRatio', 'pegRatio', 'evToRevenue', 'evToEbitda'],
    metricPriorities: {
      'peRatio': 9,
      'pbRatio': 8,
      'psRatio': 7,
      'pegRatio': 9,
      'evToRevenue': 6,
      'evToEbitda': 7,
    },
    visibleMetrics: ['peRatio', 'pbRatio', 'psRatio', 'pegRatio'],
    categories: ['Valuation'],
  },
  {
    id: 'profitability',
    name: 'Profitability Analysis',
    description: 'Compare profitability and efficiency metrics',
    isPredefined: true,
    metricIds: ['roe', 'roa', 'profitMargin', 'operatingMargin', 'netMargin', 'grossMargin'],
    metricPriorities: {
      'roe': 10,
      'roa': 9,
      'profitMargin': 9,
      'operatingMargin': 8,
      'netMargin': 8,
      'grossMargin': 7,
    },
    visibleMetrics: ['roe', 'roa', 'profitMargin', 'operatingMargin'],
    categories: ['Profitability'],
  },
  {
    id: 'financial-health',
    name: 'Financial Health',
    description: 'Assess financial stability and leverage',
    isPredefined: true,
    metricIds: ['debtToEquity', 'currentRatio', 'quickRatio', 'debtRatio', 'interestCoverage'],
    metricPriorities: {
      'debtToEquity': 9,
      'currentRatio': 8,
      'quickRatio': 8,
      'debtRatio': 7,
      'interestCoverage': 9,
    },
    visibleMetrics: ['debtToEquity', 'currentRatio', 'quickRatio'],
    categories: ['Financial Health'],
  },
  {
    id: 'dividend-analysis',
    name: 'Dividend Analysis',
    description: 'Compare dividend policies and yields',
    isPredefined: true,
    metricIds: ['dividendYield', 'payoutRatio', 'dividendPerShare'],
    metricPriorities: {
      'dividendYield': 9,
      'payoutRatio': 8,
      'dividendPerShare': 7,
    },
    visibleMetrics: ['dividendYield', 'payoutRatio'],
    categories: ['Dividends'],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Full comparison with all key metrics',
    isPredefined: true,
    metricIds: [
      'peRatio', 'pbRatio', 'roe', 'roa', 'profitMargin',
      'debtToEquity', 'currentRatio', 'dividendYield',
      'revenueGrowth', 'earningsGrowth'
    ],
    metricPriorities: {
      'peRatio': 8,
      'pbRatio': 7,
      'roe': 9,
      'roa': 8,
      'profitMargin': 9,
      'debtToEquity': 8,
      'currentRatio': 7,
      'dividendYield': 7,
      'revenueGrowth': 8,
      'earningsGrowth': 9,
    },
    visibleMetrics: [
      'peRatio', 'pbRatio', 'roe', 'roa', 'profitMargin',
      'debtToEquity', 'currentRatio', 'dividendYield'
    ],
    categories: ['Valuation', 'Profitability', 'Financial Health', 'Dividends', 'Growth'],
  },
];

