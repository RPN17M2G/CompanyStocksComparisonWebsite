import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class FmpAdapter extends BaseDataAdapter {
  name = 'Financial Modeling Prep';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    const symbol = encodeURIComponent(ticker.trim().toUpperCase());
    const base = 'https://financialmodelingprep.com/stable';

    try {
      const [
        profileRes,
        latestFsRes,
        incomeTtmRes,
        cashFlowRes,
        fsGrowthRes,
        incomeGrowthRes,
        balanceGrowthRes,
        cashflowGrowthRes,
        financialGrowthRes,
        analystEstimatesRes,
        gradesRes,
      ] = await Promise.all([
        // Main company snapshot
        fetch(`${base}/profile?symbol=${symbol}&apikey=${apiKey}`),

        // Combined latest financial statements
        fetch(`${base}/latest-financial-statements?symbol=${symbol}&limit=1&apikey=${apiKey}`),

        // TTM income statement metrics
        fetch(`${base}/income-statement-ttm?symbol=${symbol}&apikey=${apiKey}`),

        // Latest cash-flow statement
        fetch(`${base}/cash-flow-statement?symbol=${symbol}&limit=1&apikey=${apiKey}`),

        // Aggregate financial-statement growth
        fetch(`${base}/financial-statement-growth?symbol=${symbol}&limit=1&apikey=${apiKey}`),

        // Statement-specific growth APIs
        fetch(`${base}/income-statement-growth?symbol=${symbol}&limit=1&apikey=${apiKey}`),
        fetch(`${base}/balance-sheet-statement-growth?symbol=${symbol}&limit=1&apikey=${apiKey}`),
        fetch(`${base}/cash-flow-statement-growth?symbol=${symbol}&limit=1&apikey=${apiKey}`),

        // Alternate financial growth endpoint
        fetch(`${base}/financial-growth?symbol=${symbol}&limit=1&apikey=${apiKey}`),

        // Analyst EPS / revenue estimates
        fetch(`${base}/analyst-estimates?symbol=${symbol}&period=annual&page=0&limit=10&apikey=${apiKey}`),

        // Stock grades from analysts
        fetch(`${base}/grades?symbol=${symbol}&apikey=${apiKey}`),
      ]);

      if (!profileRes.ok) {
        throw new Error(`HTTP error from profile: ${profileRes.status}`);
      }

      const profileJson = await profileRes.json();

      if (!Array.isArray(profileJson) || profileJson.length === 0) {
        throw new Error('No data found for ticker.');
      }

      const profile = profileJson[0];

      if (profile['Error Message']) {
        throw new Error(profile['Error Message']);
      }

      const [
        latestFs,
        incomeTtm,
        cashFlow,
        fsGrowth,
        incomeGrowth,
        balanceGrowth,
        cashflowGrowth,
        financialGrowth,
        analystEstimates,
        grades,
      ] = await Promise.all([
        latestFsRes.ok ? latestFsRes.json() : null,
        incomeTtmRes.ok ? incomeTtmRes.json() : null,
        cashFlowRes.ok ? cashFlowRes.json() : null,
        fsGrowthRes.ok ? fsGrowthRes.json() : null,
        incomeGrowthRes.ok ? incomeGrowthRes.json() : null,
        balanceGrowthRes.ok ? balanceGrowthRes.json() : null,
        cashflowGrowthRes.ok ? cashflowGrowthRes.json() : null,
        financialGrowthRes.ok ? financialGrowthRes.json() : null,
        analystEstimatesRes.ok ? analystEstimatesRes.json() : null,
        gradesRes.ok ? gradesRes.json() : null,
      ]);

      return mergeApiResponses([
        // Identity / quote-level baseline
        { data: profile, excludeFields: ['Error Message'] },

        // Core financials
        { data: Array.isArray(latestFs) ? latestFs[0] : latestFs, prefix: 'latestFs' },
        { data: Array.isArray(incomeTtm) ? incomeTtm[0] : incomeTtm, prefix: 'incomeTtm' },
        { data: Array.isArray(cashFlow) ? cashFlow[0] : cashFlow, prefix: 'cashFlow' },

        // Growth metrics
        { data: Array.isArray(fsGrowth) ? fsGrowth[0] : fsGrowth, prefix: 'fsGrowth' },
        { data: Array.isArray(incomeGrowth) ? incomeGrowth[0] : incomeGrowth, prefix: 'incomeGrowth' },
        { data: Array.isArray(balanceGrowth) ? balanceGrowth[0] : balanceGrowth, prefix: 'balanceGrowth' },
        { data: Array.isArray(cashflowGrowth) ? cashflowGrowth[0] : cashflowGrowth, prefix: 'cashflowGrowth' },
        { data: Array.isArray(financialGrowth) ? financialGrowth[0] : financialGrowth, prefix: 'financialGrowth' },

        // Forward-looking & sentiment-ish bits
        { data: Array.isArray(analystEstimates) ? analystEstimates : analystEstimates ?? [], prefix: 'analystEstimates' },
        { data: Array.isArray(grades) ? grades : grades ?? [], prefix: 'grades' },
      ]);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}
