import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class FinnhubAdapter extends BaseDataAdapter {
  name = 'Finnhub';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    const symbol = encodeURIComponent(ticker.trim().toUpperCase());

    try {
      const [
        profileRes,
        quoteRes,
        financialsRes,
        recommendationRes,
        targetRes,
      ] = await Promise.all([
        // Company profile
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
        
        // Real-time quote
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
        
        // Financials (basic)
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`),
        
        // Analyst recommendations
        fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`),
        
        // Price target
        fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${apiKey}`),
      ]);

      if (!profileRes.ok) {
        throw new Error(`HTTP error from profile: ${profileRes.status}`);
      }

      const profile = await profileRes.json();
      const quote = quoteRes.ok ? await quoteRes.json() : null;
      const financials = financialsRes.ok ? await financialsRes.json() : null;
      const recommendations = recommendationRes.ok ? await recommendationRes.json() : null;
      const target = targetRes.ok ? await targetRes.json() : null;

      if (profile.error) {
        throw new Error(profile.error);
      }

      const responses: Array<{ data: any; prefix?: string }> = [
        { data: profile },
        { data: quote, prefix: 'quote' },
        { data: financials, prefix: 'financials' },
        { data: recommendations, prefix: 'recommendations' },
        { data: target, prefix: 'target' },
      ];

      // Add market cap if we have price and shares outstanding
      if (profile.marketCapitalization) {
        responses.push({
          data: { marketCap: profile.marketCapitalization },
        });
      } else if (quote?.c && profile.shareOutstanding) {
        // Calculate market cap from price * shares
        const marketCap = quote.c * profile.shareOutstanding;
        responses.push({
          data: { marketCap },
        });
      }

      // Add P/E ratio if available from financials
      if (financials?.metric?.peNormalizedAnnual) {
        responses.push({
          data: { peRatio: financials.metric.peNormalizedAnnual },
        });
      }

      return mergeApiResponses(responses.filter(r => r.data && Object.keys(r.data).length > 0));
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}

