import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class FmpAdapter extends BaseDataAdapter {
  name = 'Financial Modeling Prep';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    try {
      // Fetch quote, key metrics, and financial growth in parallel to get all available data
      const [quoteResponse, keyMetricsResponse, financialGrowthResponse] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`),
        fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${apiKey}`),
        fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${ticker}?apikey=${apiKey}`),
      ]);

      if (!quoteResponse.ok) {
        throw new Error(`HTTP error! status: ${quoteResponse.status}`);
      }

      const quoteData = await quoteResponse.json();
      const keyMetricsData = keyMetricsResponse.ok ? await keyMetricsResponse.json() : null;
      const financialGrowthData = financialGrowthResponse.ok ? await financialGrowthResponse.json() : null;

      // FMP returns an array, even for a single ticker
      if (!quoteData || quoteData.length === 0) {
        throw new Error('No data found for ticker.');
      }
      
      const profile = quoteData[0];

      // FMP returns error messages inside a 200 OK response sometimes
      if (profile['Error Message']) {
        throw new Error(profile['Error Message']);
      }

      // Automatically merge all responses - completely generic, captures ALL fields
      return mergeApiResponses([
        { data: profile, excludeFields: ['Error Message'] },
        { data: keyMetricsData?.[0], prefix: 'keyMetrics' },
        { data: financialGrowthData?.[0], prefix: 'growth' },
      ]);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}
