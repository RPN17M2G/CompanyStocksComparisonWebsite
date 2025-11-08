import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';

export class AlphaVantageAdapter extends BaseDataAdapter {
  name = 'Alpha Vantage';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    try {
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
      const response = await fetch(overviewUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.Note || data['Error Message']) {
        throw new Error(data.Note || data['Error Message'] || 'API limit reached or invalid ticker');
      }

      return this.transformData(ticker, data);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }

  private transformData(ticker: string, data: any): RawFinancialData {
    const parseNumber = (value: string | undefined): number | undefined => {
      if (!value || value === 'None' || value === '-') return undefined;
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    };

    return {
      ticker,
      name: data.Name || ticker,
      industry: data.Industry,
      sector: data.Sector,
      marketCap: parseNumber(data.MarketCapitalization),
      price: parseNumber(data['50DayMovingAverage']),
      revenueTTM: parseNumber(data.RevenueTTM),
      netIncome: parseNumber(data.NetIncome),
      eps: parseNumber(data.EPS),
      epsGrowthYoY: parseNumber(data.QuarterlyEarningsGrowthYOY),
      peRatio: parseNumber(data.PERatio),
      pbRatio: parseNumber(data.PriceToBookRatio),
      psRatio: parseNumber(data.PriceToSalesRatioTTM),
      pegRatio: parseNumber(data.PEGRatio),
      grossMargin: parseNumber(data.GrossProfitTTM) && parseNumber(data.RevenueTTM)
        ? (parseNumber(data.GrossProfitTTM)! / parseNumber(data.RevenueTTM)!) * 100
        : undefined,
      operatingMargin: parseNumber(data.OperatingMarginTTM),
      netMargin: parseNumber(data.ProfitMargin),
      roe: parseNumber(data.ReturnOnEquityTTM),
      roa: parseNumber(data.ReturnOnAssetsTTM),
      debtToEquity: parseNumber(data.DebtToEquity),
      dividendYield: parseNumber(data.DividendYield),
      payoutRatio: parseNumber(data.PayoutRatio),
      ebitda: parseNumber(data.EBITDA),
      bookValue: parseNumber(data.BookValue),
      totalAssets: parseNumber(data.TotalAssets),
    };
  }
}
