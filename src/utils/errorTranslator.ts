/**
 * Translates technical API errors into user-friendly messages for non-technical users
 */

interface ErrorInfo {
  title: string;
  message: string;
  suggestion: string;
  isApiIssue: boolean;
}

/**
 * Analyzes an error message and converts it to a user-friendly explanation
 */
export function translateApiError(errorMessage: string): ErrorInfo {
  const lowerError = errorMessage.toLowerCase();
  
  // Rate limit / quota exceeded errors
  if (
    lowerError.includes('rate limit') ||
    lowerError.includes('quota') ||
    lowerError.includes('limit reached') ||
    lowerError.includes('too many requests') ||
    lowerError.includes('429') ||
    lowerError.includes('api call volume')
  ) {
    return {
      title: 'API Request Limit Reached',
      message: 'The data service has received too many requests. This is a temporary limitation on their end.',
      suggestion: 'Please wait a few minutes and try refreshing again. You can also try using a different data provider in Settings.',
      isApiIssue: true,
    };
  }

  // Invalid API key errors
  if (
    lowerError.includes('invalid api key') ||
    lowerError.includes('unauthorized') ||
    lowerError.includes('401') ||
    lowerError.includes('authentication') ||
    lowerError.includes('api key') && (lowerError.includes('invalid') || lowerError.includes('missing'))
  ) {
    return {
      title: 'API Key Issue',
      message: 'The API key for your data provider is not valid or may have expired.',
      suggestion: 'Please check your API key in Settings and make sure it\'s correct. You may need to get a new key from your data provider.',
      isApiIssue: true,
    };
  }

  // Invalid ticker / symbol errors
  if (
    lowerError.includes('invalid ticker') ||
    lowerError.includes('symbol not found') ||
    lowerError.includes('no data found') ||
    lowerError.includes('ticker') && lowerError.includes('not found') ||
    lowerError.includes('404') && (lowerError.includes('ticker') || lowerError.includes('symbol'))
  ) {
    return {
      title: 'Stock Symbol Not Found',
      message: 'The stock symbol you entered couldn\'t be found in the data provider\'s database.',
      suggestion: 'Please double-check the stock symbol (ticker) and try again. Make sure you\'re using the correct format (e.g., AAPL for Apple, MSFT for Microsoft).',
      isApiIssue: false,
    };
  }

  // Network / connection errors
  if (
    lowerError.includes('network') ||
    lowerError.includes('connection') ||
    lowerError.includes('failed to fetch') ||
    lowerError.includes('networkerror') ||
    lowerError.includes('timeout') ||
    lowerError.includes('503') ||
    lowerError.includes('502') ||
    lowerError.includes('504')
  ) {
    return {
      title: 'Connection Problem',
      message: 'We couldn\'t reach the data service. This could be due to your internet connection or the service being temporarily unavailable.',
      suggestion: 'Please check your internet connection and try again. If the problem persists, the data provider may be experiencing issues.',
      isApiIssue: true,
    };
  }

  // Service unavailable errors
  if (
    lowerError.includes('service unavailable') ||
    lowerError.includes('503') ||
    lowerError.includes('maintenance') ||
    lowerError.includes('temporarily unavailable')
  ) {
    return {
      title: 'Service Temporarily Unavailable',
      message: 'The data provider\'s service is currently unavailable or undergoing maintenance.',
      suggestion: 'Please wait a few minutes and try again. You can also try using a different data provider in Settings.',
      isApiIssue: true,
    };
  }

  // Forbidden / access denied
  if (
    lowerError.includes('forbidden') ||
    lowerError.includes('403') ||
    lowerError.includes('access denied') ||
    lowerError.includes('permission denied')
  ) {
    return {
      title: 'Access Denied',
      message: 'Access to this data is restricted. Your API key may not have permission to access this information.',
      suggestion: 'Please check your API key permissions or upgrade your data provider subscription plan.',
      isApiIssue: true,
    };
  }

  // API note messages (like Alpha Vantage)
  if (lowerError.includes('note') || lowerError.includes('api call frequency')) {
    return {
      title: 'API Rate Limit Notice',
      message: 'The data provider is limiting how often we can request data. This is normal for free API plans.',
      suggestion: 'Please wait a moment and try refreshing. Consider upgrading your API plan or using multiple data providers for better reliability.',
      isApiIssue: true,
    };
  }

  // All providers failed (multi-API)
  if (lowerError.includes('all api providers failed') || lowerError.includes('all providers failed')) {
    return {
      title: 'All Data Providers Failed',
      message: 'All of your configured data providers are currently unavailable or experiencing issues.',
      suggestion: 'Please check your internet connection and API keys in Settings. You may want to add more data providers for better reliability.',
      isApiIssue: true,
    };
  }

  // Generic API errors that mention the provider
  if (
    lowerError.includes('failed to fetch') ||
    lowerError.includes('api error') ||
    lowerError.includes('provider') ||
    lowerError.includes('http error') ||
    lowerError.includes('500') ||
    lowerError.includes('502')
  ) {
    return {
      title: 'Data Provider Issue',
      message: 'We encountered a problem while getting data from the service provider. This is not something you did wrong.',
      suggestion: 'Please try refreshing the company tile in a moment. If the problem continues, try using a different data provider in Settings.',
      isApiIssue: true,
    };
  }

  // Default fallback - still user-friendly
  return {
    title: 'Unable to Load Data',
    message: `We couldn't retrieve the stock data. This is likely a temporary issue with the data provider.`,
    suggestion: 'Please try refreshing this company tile. If the problem continues, check your Settings or try again later.',
    isApiIssue: true,
  };
}

