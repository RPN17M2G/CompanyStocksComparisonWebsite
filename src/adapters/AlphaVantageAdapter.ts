import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class AlphaVantageAdapter extends BaseDataAdapter {
  name = 'Alpha Vantage';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    try {
      const [overviewResponse, incomeStatementResponse] = await Promise.all([
        fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`),
        fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`),
      ]);

      if (!overviewResponse.ok) {
        throw new Error(`HTTP error! status: ${overviewResponse.status}`);
      }

      const overviewData = await overviewResponse.json();
      const incomeStatementData = incomeStatementResponse.ok 
        ? await incomeStatementResponse.json() 
        : null;

      if (overviewData.Note || overviewData['Error Message']) {
        throw new Error(overviewData.Note || overviewData['Error Message'] || 'API limit reached or invalid ticker');
      }

      const incomeStatements: any[] = [];
      if (incomeStatementData) {
        if (incomeStatementData.annualReports && Array.isArray(incomeStatementData.annualReports)) {
          incomeStatementData.annualReports.forEach((report: any, index: number) => {
            incomeStatements.push({
              data: report,
              prefix: index === 0 ? 'annual' : `annual_${index}`,
            });
          });
        }
        
        if (incomeStatementData.quarterlyReports && Array.isArray(incomeStatementData.quarterlyReports)) {
          incomeStatementData.quarterlyReports.forEach((report: any, index: number) => {
            incomeStatements.push({
              data: report,
              prefix: index === 0 ? 'quarterly' : `quarterly_${index}`,
            });
          });
        }
      }

      return mergeApiResponses([
        { data: overviewData, excludeFields: ['Note', 'Error Message', 'Symbol'] },
        ...incomeStatements,
      ]);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}
