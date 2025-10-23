import { YahooFinanceQuote } from '../types';
import { YAHOO_FINANCE_BASE_URL } from '../config';
import { logger } from '../utils/logger';

interface YahooFinanceResponse {
  quoteResponse: {
    result: YahooFinanceQuote[];
    error: null | unknown;
  };
}

export class YahooFinanceAdapter {
  async fetchQuotes(symbols: string[]): Promise<YahooFinanceQuote[]> {
    const symbolsParam = symbols.join(',');
    const url = `${YAHOO_FINANCE_BASE_URL}?symbols=${symbolsParam}`;

    logger.info('Fetching quotes from Yahoo Finance', { symbols, url });

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
        },
      });

      if (!response.ok) {
        logger.error('Yahoo Finance API error', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json() as YahooFinanceResponse;

      if (data.quoteResponse.error) {
        logger.error('Yahoo Finance returned error', { error: data.quoteResponse.error });
        throw new Error('Yahoo Finance returned error');
      }

      const quotes = data.quoteResponse.result;
      logger.info('Successfully fetched quotes', { count: quotes.length });

      return quotes;
    } catch (error) {
      logger.error('Failed to fetch quotes from Yahoo Finance', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(YAHOO_FINANCE_BASE_URL, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
        },
      });
      return response.ok || response.status === 400;
    } catch (error) {
      logger.error('Yahoo Finance health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
