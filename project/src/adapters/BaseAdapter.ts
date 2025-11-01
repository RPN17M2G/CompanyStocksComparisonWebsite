import { IDataAdapter, RawFinancialData } from '../types';

export abstract class BaseDataAdapter implements IDataAdapter {
  abstract name: string;

  abstract fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData>;

  protected handleError(error: unknown, ticker: string): never {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch data for ${ticker}: ${error.message}`);
    }
    throw new Error(`Failed to fetch data for ${ticker}`);
  }
}
