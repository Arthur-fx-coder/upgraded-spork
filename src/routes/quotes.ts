import { Env, Quote } from '../types';
import { YahooFinanceAdapter } from '../adapters/yahoo-finance';
import { CacheManager } from '../cache/cache-manager';
import { formatQuotes } from '../formatters/quote-formatter';
import { parseSymbolsFromUrl, ValidationError } from '../validators/request-validator';
import { logger } from '../utils/logger';
import { createCorsResponse } from '../utils/cors';

export async function handleQuotesRequest(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const symbols = parseSymbolsFromUrl(url);

    logger.info('Processing quotes request', { symbols });

    const yahooAdapter = new YahooFinanceAdapter();
    const cacheManager = new CacheManager(env.QUOTES_KV);

    const quotes: Quote[] = [];

    for (const symbol of symbols) {
      const cachedQuote = await cacheManager.getCachedQuote(symbol);
      
      if (cachedQuote) {
        quotes.push(cachedQuote);
        continue;
      }

      try {
        const yahooQuotes = await yahooAdapter.fetchQuotes([symbol]);
        
        if (yahooQuotes.length > 0) {
          const formattedQuotes = formatQuotes(yahooQuotes, false);
          const quote = formattedQuotes[0];
          
          quotes.push(quote);
          
          await Promise.all([
            cacheManager.setCachedQuote(symbol, quote),
            cacheManager.setLastGoodQuote(symbol, quote),
          ]);
        } else {
          const lastGood = await cacheManager.getLastGoodQuote(symbol);
          if (lastGood) {
            quotes.push({ ...lastGood, isDelayed: true });
            logger.warn('Using last good value for symbol', { symbol });
          } else {
            logger.error('No data available for symbol', { symbol });
          }
        }
      } catch (error) {
        const lastGood = await cacheManager.getLastGoodQuote(symbol);
        if (lastGood) {
          quotes.push({ ...lastGood, isDelayed: true });
          logger.warn('Error fetching symbol, using last good value', {
            symbol,
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          logger.error('Error fetching symbol and no fallback available', {
            symbol,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    if (quotes.length === 0) {
      return createCorsResponse(
        new Response(
          JSON.stringify({ error: 'No quotes available' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }

    logger.info('Returning quotes', { count: quotes.length });

    return createCorsResponse(
      new Response(
        JSON.stringify({
          quotes,
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation error', { error: error.message });
      return createCorsResponse(
        new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }

    logger.error('Unexpected error in quotes handler', {
      error: error instanceof Error ? error.message : String(error),
    });

    return createCorsResponse(
      new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
}
