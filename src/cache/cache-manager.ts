import { Quote } from '../types';
import { CACHE_TTL_SECONDS, KV_KEY_PREFIX } from '../config';
import { logger } from '../utils/logger';

export class CacheManager {
  private cache: Cache | null = null;
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async initCache(): Promise<void> {
    if (!this.cache) {
      this.cache = await caches.open('quotes-cache');
    }
  }

  private getCacheKey(symbol: string): string {
    return `https://cache.local/quote/${symbol}`;
  }

  private getKvKey(symbol: string): string {
    return `${KV_KEY_PREFIX}${symbol}`;
  }

  async getCachedQuote(symbol: string): Promise<Quote | null> {
    await this.initCache();

    if (!this.cache) {
      logger.warn('Cache not available');
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(symbol);
      const cachedResponse = await this.cache.match(cacheKey);

      if (cachedResponse) {
        const quote = await cachedResponse.json() as Quote;
        logger.debug('Cache hit', { symbol });
        return quote;
      }

      logger.debug('Cache miss', { symbol });
    } catch (error) {
      logger.error('Error reading from cache', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return null;
  }

  async setCachedQuote(symbol: string, quote: Quote): Promise<void> {
    await this.initCache();

    if (!this.cache) {
      logger.warn('Cache not available');
      return;
    }

    try {
      const cacheKey = this.getCacheKey(symbol);
      const response = new Response(JSON.stringify(quote), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${CACHE_TTL_SECONDS}`,
        },
      });

      await this.cache.put(cacheKey, response);
      logger.debug('Quote cached', { symbol, ttl: CACHE_TTL_SECONDS });
    } catch (error) {
      logger.error('Error writing to cache', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getLastGoodQuote(symbol: string): Promise<Quote | null> {
    try {
      const kvKey = this.getKvKey(symbol);
      const value = await this.kv.get(kvKey, 'json');

      if (value) {
        logger.debug('KV hit', { symbol });
        return value as Quote;
      }

      logger.debug('KV miss', { symbol });
    } catch (error) {
      logger.error('Error reading from KV', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return null;
  }

  async setLastGoodQuote(symbol: string, quote: Quote): Promise<void> {
    try {
      const kvKey = this.getKvKey(symbol);
      await this.kv.put(kvKey, JSON.stringify(quote));
      logger.debug('Quote saved to KV', { symbol });
    } catch (error) {
      logger.error('Error writing to KV', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async healthCheck(): Promise<{ cache: boolean; kv: boolean }> {
    let cacheHealthy = false;
    let kvHealthy = false;

    try {
      await this.initCache();
      cacheHealthy = this.cache !== null;
    } catch (error) {
      logger.error('Cache health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await this.kv.put('health:check', 'ok', { expirationTtl: 60 });
      const value = await this.kv.get('health:check');
      kvHealthy = value === 'ok';
    } catch (error) {
      logger.error('KV health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return { cache: cacheHealthy, kv: kvHealthy };
  }
}
