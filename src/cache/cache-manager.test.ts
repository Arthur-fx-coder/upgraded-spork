import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from './cache-manager';
import { Quote } from '../types';

class MockKVNamespace {
  private store = new Map<string, string>();

  async get(key: string, type?: string): Promise<string | null | unknown> {
    const value = this.store.get(key) || null;
    if (type === 'json' && value) {
      return JSON.parse(value);
    }
    return value;
  }

  async put(key: string, value: string, _options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('CacheManager', () => {
  let mockKV: MockKVNamespace;
  let cacheManager: CacheManager;

  beforeEach(() => {
    mockKV = new MockKVNamespace();
    cacheManager = new CacheManager(mockKV as unknown as KVNamespace);
  });

  describe('KV operations', () => {
    it('should store and retrieve last good quote', async () => {
      const quote: Quote = {
        symbol: 'XAUUSD=X',
        name: 'Gold/USD',
        price: 2050.50,
        change: 15.25,
        changePercent: 0.75,
        timestamp: Date.now(),
        source: 'yahoo',
        isDelayed: false,
        isStale: false,
      };

      await cacheManager.setLastGoodQuote('XAUUSD=X', quote);
      const retrieved = await cacheManager.getLastGoodQuote('XAUUSD=X');

      expect(retrieved).toEqual(quote);
    });

    it('should return null for non-existent quote', async () => {
      const retrieved = await cacheManager.getLastGoodQuote('NONEXISTENT');

      expect(retrieved).toBeNull();
    });

    it('should overwrite existing quote', async () => {
      const quote1: Quote = {
        symbol: 'XAUUSD=X',
        name: 'Gold/USD',
        price: 2050.50,
        change: 15.25,
        changePercent: 0.75,
        timestamp: Date.now(),
        source: 'yahoo',
        isDelayed: false,
        isStale: false,
      };

      const quote2: Quote = {
        ...quote1,
        price: 2055.00,
        change: 20.00,
      };

      await cacheManager.setLastGoodQuote('XAUUSD=X', quote1);
      await cacheManager.setLastGoodQuote('XAUUSD=X', quote2);
      const retrieved = await cacheManager.getLastGoodQuote('XAUUSD=X');

      expect(retrieved?.price).toBe(2055.00);
      expect(retrieved?.change).toBe(20.00);
    });

    it('should store multiple symbols independently', async () => {
      const goldQuote: Quote = {
        symbol: 'XAUUSD=X',
        name: 'Gold/USD',
        price: 2050.50,
        change: 15.25,
        changePercent: 0.75,
        timestamp: Date.now(),
        source: 'yahoo',
        isDelayed: false,
        isStale: false,
      };

      const silverQuote: Quote = {
        symbol: 'XAGUSD=X',
        name: 'Silver/USD',
        price: 25.50,
        change: 0.50,
        changePercent: 2.0,
        timestamp: Date.now(),
        source: 'yahoo',
        isDelayed: false,
        isStale: false,
      };

      await cacheManager.setLastGoodQuote('XAUUSD=X', goldQuote);
      await cacheManager.setLastGoodQuote('XAGUSD=X', silverQuote);

      const retrievedGold = await cacheManager.getLastGoodQuote('XAUUSD=X');
      const retrievedSilver = await cacheManager.getLastGoodQuote('XAGUSD=X');

      expect(retrievedGold?.symbol).toBe('XAUUSD=X');
      expect(retrievedSilver?.symbol).toBe('XAGUSD=X');
    });
  });

  describe('healthCheck', () => {
    it('should check KV health', async () => {
      const health = await cacheManager.healthCheck();

      expect(health).toHaveProperty('kv');
      expect(health).toHaveProperty('cache');
      expect(typeof health.kv).toBe('boolean');
      expect(typeof health.cache).toBe('boolean');
    });

    it('should report KV as healthy when operations succeed', async () => {
      const health = await cacheManager.healthCheck();

      expect(health.kv).toBe(true);
    });
  });

  describe('cache key generation', () => {
    it('should use correct prefix for KV keys', async () => {
      const quote: Quote = {
        symbol: 'TEST=X',
        name: 'Test',
        price: 100,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        source: 'yahoo',
        isDelayed: false,
        isStale: false,
      };

      await cacheManager.setLastGoodQuote('TEST=X', quote);
      
      const kvKey = 'quote:TEST=X';
      const directValue = await mockKV.get(kvKey, 'json') as Quote;
      
      expect(directValue).toBeTruthy();
      expect(directValue.symbol).toBe('TEST=X');
    });
  });
});
