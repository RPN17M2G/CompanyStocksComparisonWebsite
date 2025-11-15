import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class PolygonAdapter extends BaseDataAdapter {
  name = 'Polygon.io';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    // Polygon.io often requires the ticker to be in uppercase
    const upperTicker = ticker.toUpperCase();

    try {
      const [profileResponse, priceResponse, detailsResponse] = await Promise.all([
        fetch(`https://api.polygon.io/v3/reference/tickers/${upperTicker}?apiKey=${apiKey}`),
        fetch(`https://api.polygon.io/v2/aggs/ticker/${upperTicker}/prev?apiKey=${apiKey}`),
        fetch(`https://api.polygon.io/v2/snapshot/overview/${upperTicker}?apiKey=${apiKey}`),
      ]);

      if (!profileResponse.ok) {
        throw new Error(`Polygon Profile HTTP error! status: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      const priceData = priceResponse.ok ? await priceResponse.json() : null;
      const detailsData = detailsResponse.ok ? await detailsResponse.json() : null;

      if (profileData.status !== 'OK' || !profileData.results) {
         throw new Error(profileData.error || 'Failed to fetch Polygon profile');
      }
      if (priceData && priceData.status !== 'OK') {
         console.warn(`Polygon: No previous day price data found for ${upperTicker}`);
      }

      // Polygon API wraps data in 'results' objects, so we extract them
      const responses: Array<{ data: any; prefix?: string }> = [
        { data: profileData.results }, // Profile data
      ];

      // Add price data if available (first result from results array)
      if (priceData?.results && Array.isArray(priceData.results) && priceData.results.length > 0) {
        responses.push({
          data: priceData.results[0],
          prefix: 'price',
        });
        // Also add a direct 'price' field from closing price
        if (priceData.results[0]?.c !== undefined) {
          responses.push({
            data: { price: priceData.results[0].c },
          });
        }
      }

      // Add snapshot/overview data if available
      if (detailsData?.results) {
        responses.push({
          data: detailsData.results,
          prefix: 'snapshot',
        });
      }

      return mergeApiResponses(responses);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}
