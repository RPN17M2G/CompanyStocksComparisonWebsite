import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class TwelveDataAdapter extends BaseDataAdapter {
  name = 'Twelve Data';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    const symbol = encodeURIComponent(ticker.trim().toUpperCase());
    const baseUrl = 'https://api.twelvedata.com';

    try {
      const [
        quoteRes,
        profileRes,
        earningsRes,
        statisticsRes,
      ] = await Promise.all([
        // Real-time quote
        fetch(`${baseUrl}/quote?symbol=${symbol}&apikey=${apiKey}`),
        
        // Company profile
        fetch(`${baseUrl}/profile?symbol=${symbol}&apikey=${apiKey}`),
        
        // Earnings data
        fetch(`${baseUrl}/earnings?symbol=${symbol}&apikey=${apiKey}`),
        
        // Statistics
        fetch(`${baseUrl}/statistics?symbol=${symbol}&apikey=${apiKey}`),
      ]);

      if (!quoteRes.ok) {
        throw new Error(`HTTP error from quote: ${quoteRes.status}`);
      }

      const quote = await quoteRes.json();
      const profile = profileRes.ok ? await profileRes.json() : null;
      const earnings = earningsRes.ok ? await earningsRes.json() : null;
      const statistics = statisticsRes.ok ? await statisticsRes.json() : null;

      if (quote.status === 'error') {
        throw new Error(quote.message || 'API error from Twelve Data');
      }

      const responses: Array<{ data: any; prefix?: string }> = [
        { data: quote, prefix: 'quote' },
        { data: profile, prefix: 'profile' },
        { data: earnings, prefix: 'earnings' },
        { data: statistics, prefix: 'statistics' },
      ];

      // Extract company name from profile or quote
      if (profile?.name) {
        responses.push({
          data: { name: profile.name, ticker: symbol },
        });
      } else if (quote?.name) {
        responses.push({
          data: { name: quote.name, ticker: symbol },
        });
      } else {
        responses.push({
          data: { ticker: symbol, name: symbol },
        });
      }

      // Add market cap if available
      if (quote?.market_cap) {
        responses.push({
          data: { marketCap: parseFloat(quote.market_cap) || undefined },
        });
      } else if (statistics?.MarketCapitalization) {
        responses.push({
          data: { marketCap: parseFloat(statistics.MarketCapitalization) || undefined },
        });
      }

      // Add P/E ratio if available
      if (quote?.pe) {
        responses.push({
          data: { peRatio: parseFloat(quote.pe) || undefined },
        });
      } else if (statistics?.TrailingPE) {
        responses.push({
          data: { peRatio: parseFloat(statistics.TrailingPE) || undefined },
        });
      }

      return mergeApiResponses(responses.filter(r => r.data && Object.keys(r.data).length > 0));
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}

