import { CoreMetric } from '../shared/types/types';

/**
 * Core metrics - only name and ticker are predefined.
 * All other metrics are dynamically generated from the data.
 */
export const coreMetrics: CoreMetric[] = [
  {
    id: 'ticker',
    name: 'Ticker',
    category: 'Basic Information',
    format: 'text',
    calculate: (data) => data.ticker,
  },
  {
    id: 'name',
    name: 'Company Name',
    category: 'Basic Information',
    format: 'text',
    calculate: (data) => data.name,
  },
];
