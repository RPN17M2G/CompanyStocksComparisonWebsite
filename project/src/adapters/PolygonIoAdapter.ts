import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../types';

export class PolygonAdapter extends BaseDataAdapter {
  name = 'Polygon.io';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    // Polygon.io often requires the ticker to be in uppercase
    const upperTicker = ticker.toUpperCase();

    try {
      const profileUrl = `https://api.polygon.io/v3/reference/tickers/${upperTicker}?apiKey=${apiKey}`;
      const priceUrl = `https://api.polygon.io/v2/aggs/ticker/${upperTicker}/prev?apiKey=${apiKey}`;

      const [profileResponse, priceResponse] = await Promise.all([
        fetch(profileUrl),
        fetch(priceUrl)
      ]);

      if (!profileResponse.ok) {
        throw new Error(`Polygon Profile HTTP error! status: ${profileResponse.status}`);
      }
      if (!priceResponse.ok) {
        throw new Error(`Polygon Price HTTP error! status: ${priceResponse.status}`);
      }

      const profileData = await profileResponse.json();
      const priceData = await priceResponse.json();

      // Check for API-level errors
      if (profileData.status !== 'OK' || !profileData.results) {
         throw new Error(profileData.error || 'Failed to fetch Polygon profile');
      }
      if (priceData.status !== 'OK' || !priceData.results) {
         // Not finding a price isn't always a fatal error, but no profile is.
         // We'll allow this to proceed and let transformData handle empty price data.
         console.warn(`Polygon: No previous day price data found for ${upperTicker}`);
      }

      // Pass the nested 'results' object and the first price bar
      return this.transformData(profileData.results, priceData.results?.[0] || {});

    } catch (error) {
      return this.handleError(error, ticker);
    }
  }

  private transformData(profile: any, priceData: any): RawFinancialData {
    const parseNumber = (value: number | string | undefined | null): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const num = parseFloat(String(value));
      return isNaN(num) ? undefined : num;
    };

    return {
      ticker: profile.ticker,
      name: profile.name,
      industry: profile.sic_description, // GICS sector is also a good option: profile.gics_sector
      sector: profile.gics_sector, // More standardized than industry
      marketCap: parseNumber(profile.market_cap),
      price: parseNumber(priceData.c), // 'c' is the closing price from the aggregate bar
      
      // Note: Polygon's reference endpoints do not provide
      // financials like P/E, ROE, or income statement data.
      // That requires their separate Financials API (vX),
      // which has a much more complex quarterly/annual structure.
    };
  }
}
