import { RawFinancialData } from '../shared/types/types';
import { getAdapter } from './AdapterManager';
import { mergeApiResponses } from './dataTransformer';

/**
 * Fetches data from multiple APIs and merges them
 */
export async function fetchFromMultipleApis(
  ticker: string,
  providers: Array<{ provider: string; apiKey: string }>,
  mergeStrategy: 'merge' | 'first' = 'merge'
): Promise<RawFinancialData> {
  if (providers.length === 0) {
    throw new Error('No API providers specified');
  }

  // Fetch from all providers in parallel
  const fetchPromises = providers.map(async ({ provider, apiKey }) => {
    const adapter = getAdapter(provider);
    if (!adapter) {
      console.warn(`Adapter not found for provider: ${provider}`);
      return null;
    }
    try {
      return await adapter.fetchCompanyData(ticker, apiKey);
    } catch (error) {
      console.warn(`Failed to fetch from ${provider}:`, error);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  const validResults = results.filter((r): r is RawFinancialData => r !== null);

  if (validResults.length === 0) {
    throw new Error('All API providers failed to fetch data');
  }

  // Apply merge strategy
  switch (mergeStrategy) {
    case 'first':
      // Return first successful result
      return validResults[0];
    
    case 'merge':
    default:
      // Merge all results, with later results overriding earlier ones
      return mergeApiResponses(
        validResults.map((data, index) => ({
          data,
          prefix: providers[index]?.provider.toLowerCase().replace(/\s+/g, '_'),
          excludeFields: [],
        }))
      );
  }
}

