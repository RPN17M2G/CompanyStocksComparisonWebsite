import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';

export class FmpAdapter extends BaseDataAdapter {
  name = 'Financial Modeling Prep';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    try {
      const url = `https://financialmodelingprep.com/stable/quote?symbol=${ticker}&apikey=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // FMP returns an array, even for a single ticker
      if (!data || data.length === 0) {
        throw new Error('No data found for ticker.');
      }
      
      const profile = data[0];

      // FMP returns error messages inside a 200 OK response sometimes
      if (profile['Error Message']) {
        throw new Error(profile['Error Message']);
      }

      return this.transformData(profile);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }

  private transformData(data: any): RawFinancialData {
    const parseNumber = (value: number | string | undefined | null): number | undefined => {
      if (value === null || value === undefined || value === "") return undefined;
      const num = parseFloat(String(value));
      return isNaN(num) ? undefined : num;
    };

    return {
      ticker: data.symbol,
      name: data.companyName,
      industry: data.industry,
      sector: data.sector,
      marketCap: parseNumber(data.mktCap),
      price: parseNumber(data.price),
      revenueTTM: parseNumber(data.revenue), // Check FMP docs; 'revenue' on profile is often TTM
      netIncome: parseNumber(data.netIncome),
      eps: parseNumber(data.eps),
      peRatio: parseNumber(data.pe),
      pbRatio: parseNumber(data.pb),
      bookValue: parseNumber(data.bookValue),
      totalAssets: parseNumber(data.assets),
      totalDebt: parseNumber(data.debt),
      ebitda: parseNumber(data.ebitda),
      dividendYield: parseNumber(data.dividend), // FMP 'dividend' is often yield
      payoutRatio: parseNumber(data.payout),
    };
  }
}
