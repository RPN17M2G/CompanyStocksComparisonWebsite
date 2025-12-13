import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class IexCloudAdapter extends BaseDataAdapter {
  name = 'IEX Cloud';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    const symbol = encodeURIComponent(ticker.trim().toUpperCase());
    const baseUrl = `https://cloud.iexapis.com/stable`;

    try {
      const [
        companyRes,
        quoteRes,
        statsRes,
        financialsRes,
        keyStatsRes,
      ] = await Promise.all([
        // Company information
        fetch(`${baseUrl}/stock/${symbol}/company?token=${apiKey}`),
        
        // Quote (real-time or 15-min delayed)
        fetch(`${baseUrl}/stock/${symbol}/quote?token=${apiKey}`),
        
        // Advanced stats
        fetch(`${baseUrl}/stock/${symbol}/stats?token=${apiKey}`),
        
        // Financials
        fetch(`${baseUrl}/stock/${symbol}/financials?period=annual&last=1&token=${apiKey}`),
        
        // Key stats
        fetch(`${baseUrl}/stock/${symbol}/stats/intraday?token=${apiKey}`),
      ]);

      if (!companyRes.ok) {
        const errorText = await companyRes.text();
        throw new Error(`HTTP error: ${companyRes.status} - ${errorText}`);
      }

      const company = await companyRes.json();
      const quote = quoteRes.ok ? await quoteRes.json() : null;
      const stats = statsRes.ok ? await statsRes.json() : null;
      const financials = financialsRes.ok ? await financialsRes.json() : null;
      const keyStats = keyStatsRes.ok ? await keyStatsRes.json() : null;

      if (company.error) {
        throw new Error(company.error);
      }

      const responses: Array<{ data: any; prefix?: string }> = [
        { data: company },
        { data: quote, prefix: 'quote' },
        { data: stats, prefix: 'stats' },
        { data: keyStats, prefix: 'keyStats' },
      ];

      // Add financials if available
      if (financials?.financials && Array.isArray(financials.financials) && financials.financials.length > 0) {
        responses.push({
          data: financials.financials[0],
          prefix: 'financials',
        });
      }

      // Calculate market cap if we have price and shares outstanding
      if (quote?.latestPrice && stats?.sharesOutstanding) {
        const marketCap = quote.latestPrice * stats.sharesOutstanding;
        responses.push({
          data: { marketCap },
        });
      }

      // Add P/E ratio from stats
      if (stats?.peRatio) {
        responses.push({
          data: { peRatio: stats.peRatio },
        });
      }

      return mergeApiResponses(responses.filter(r => r.data && Object.keys(r.data).length > 0));
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}

