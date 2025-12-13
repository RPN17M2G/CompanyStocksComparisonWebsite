import { BaseDataAdapter } from './BaseAdapter';
import { RawFinancialData } from '../shared/types/types';
import { mergeApiResponses } from './dataTransformer';

export class NasdaqDataLinkAdapter extends BaseDataAdapter {
  name = 'Nasdaq Data Link';

  async fetchCompanyData(ticker: string, apiKey: string): Promise<RawFinancialData> {
    const symbol = encodeURIComponent(ticker.trim().toUpperCase());
    const baseUrl = 'https://data.nasdaq.com/api/v3';

    try {
      // Note: Nasdaq Data Link uses different dataset codes for different data
      // We'll use WIKI dataset for price data and fundamentals
      // Format: DATASET/SYMBOL.json
      
      const [
        wikiRes,
        fundamentalsRes,
        companyRes,
      ] = await Promise.all([
        // WIKI price data (latest)
        fetch(`${baseUrl}/datasets/WIKI/${symbol}/data.json?api_key=${apiKey}&limit=1&order=desc`),
        
        // SF1 fundamentals (if available)
        fetch(`${baseUrl}/datasets/SF1/${symbol}_ARQ_M.json?api_key=${apiKey}&limit=1&order=desc`),
        
        // Company metadata
        fetch(`${baseUrl}/datasets/WIKI/${symbol}/metadata.json?api_key=${apiKey}`),
      ]);

      // Check if we got valid data from any endpoint
      let wikiData = null;
      let fundamentals = null;
      let metadata = null;

      if (wikiRes.ok) {
        const wikiJson = await wikiRes.json();
        if (wikiJson.dataset_data && !wikiJson.quandl_error) {
          wikiData = wikiJson.dataset_data;
        }
      }

      if (fundamentalsRes.ok) {
        const fundJson = await fundamentalsRes.json();
        if (fundJson.dataset_data && !fundJson.quandl_error) {
          fundamentals = fundJson.dataset_data;
        }
      }

      if (companyRes.ok) {
        const metaJson = await companyRes.json();
        if (metaJson.dataset && !metaJson.quandl_error) {
          metadata = metaJson.dataset;
        }
      }

      if (!wikiData && !fundamentals && !metadata) {
        throw new Error('No data found for ticker in Nasdaq Data Link');
      }

      const responses: Array<{ data: any; prefix?: string }> = [];

      // Add metadata (company info)
      if (metadata) {
        responses.push({
          data: {
            name: metadata.name || symbol,
            ticker: symbol,
            description: metadata.description,
          },
        });
      }

      // Add price data from WIKI
      if (wikiData?.data && Array.isArray(wikiData.data) && wikiData.data.length > 0) {
        const latest = wikiData.data[0];
        const columns = wikiData.column_names || [];
        
        const priceData: any = { ticker: symbol };
        latest.forEach((value: any, index: number) => {
          const columnName = columns[index];
          if (columnName && value !== null) {
            // Convert column names to camelCase
            const camelCase = columnName.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            priceData[camelCase] = typeof value === 'string' ? parseFloat(value) || value : value;
          }
        });
        
        responses.push({
          data: priceData,
          prefix: 'price',
        });

        // Extract closing price as 'price'
        const closeIndex = columns.findIndex((col: string) => col.toLowerCase() === 'close');
        if (closeIndex >= 0 && latest[closeIndex] !== null) {
          const closePrice = parseFloat(latest[closeIndex]);
          if (!isNaN(closePrice)) {
            responses.push({
              data: { price: closePrice },
            });
          }
        }
      }

      // Add fundamentals
      if (fundamentals?.data && Array.isArray(fundamentals.data) && fundamentals.data.length > 0) {
        const latest = fundamentals.data[0];
        const columns = fundamentals.column_names || [];
        
        const fundData: any = {};
        latest.forEach((value: any, index: number) => {
          const columnName = columns[index];
          if (columnName && value !== null) {
            const camelCase = columnName.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            fundData[camelCase] = typeof value === 'string' ? parseFloat(value) || value : value;
          }
        });
        
        responses.push({
          data: fundData,
          prefix: 'fundamentals',
        });
      }

      // Ensure we have at least ticker and name
      if (responses.length === 0) {
        responses.push({
          data: { ticker: symbol, name: symbol },
        });
      }

      return mergeApiResponses(responses);
    } catch (error) {
      return this.handleError(error, ticker);
    }
  }
}

