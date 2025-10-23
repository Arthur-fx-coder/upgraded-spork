import { describe, it, expect } from 'vitest';
import { formatQuote, formatQuotes, formatSHFEQuote, formatSHFEQuotes } from './quote-formatter';
import { YahooFinanceQuote } from '../types';

describe('quote-formatter', () => {
  describe('formatQuote', () => {
    it('should format a valid Yahoo Finance quote', () => {
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'XAUUSD=X',
        regularMarketPrice: 2050.50,
        regularMarketChange: 15.25,
        regularMarketChangePercent: 0.75,
        regularMarketTime: 1700000000,
      };

      const result = formatQuote(yahooQuote);

      expect(result).toMatchObject({
        symbol: 'XAUUSD=X',
        name: 'Gold/USD',
        price: 2050.50,
        change: 15.25,
        changePercent: 0.75,
        timestamp: 1700000000000,
        source: 'yahoo',
        isDelayed: false,
      });
      expect(result.isStale).toBe(true);
    });

    it('should handle missing price data with defaults', () => {
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'GC=F',
      };

      const result = formatQuote(yahooQuote);

      expect(result).toMatchObject({
        symbol: 'GC=F',
        name: 'Gold Futures',
        price: 0,
        change: 0,
        changePercent: 0,
        source: 'yahoo',
        isDelayed: false,
      });
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should mark quote as delayed when specified', () => {
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'XAGUSD=X',
        regularMarketPrice: 25.50,
        regularMarketChange: 0.50,
        regularMarketChangePercent: 2.0,
        regularMarketTime: 1700000000,
      };

      const result = formatQuote(yahooQuote, true);

      expect(result.isDelayed).toBe(true);
    });

    it('should mark quote as stale if older than threshold', () => {
      const oldTimestamp = Math.floor((Date.now() - 10 * 60 * 1000) / 1000);
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'SI=F',
        regularMarketPrice: 28.75,
        regularMarketTime: oldTimestamp,
      };

      const result = formatQuote(yahooQuote);

      expect(result.isStale).toBe(true);
    });

    it('should not mark recent quote as stale', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000);
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'SI=F',
        regularMarketPrice: 28.75,
        regularMarketTime: recentTimestamp,
      };

      const result = formatQuote(yahooQuote);

      expect(result.isStale).toBe(false);
    });

    it('should handle unknown symbols gracefully', () => {
      const yahooQuote: YahooFinanceQuote = {
        symbol: 'UNKNOWN=X',
        regularMarketPrice: 100,
      };

      const result = formatQuote(yahooQuote);

      expect(result.symbol).toBe('UNKNOWN=X');
      expect(result.name).toBe('UNKNOWN=X');
    });
  });

  describe('formatQuotes', () => {
    it('should format multiple quotes', () => {
      const yahooQuotes: YahooFinanceQuote[] = [
        {
          symbol: 'XAUUSD=X',
          regularMarketPrice: 2050.50,
          regularMarketChange: 15.25,
          regularMarketChangePercent: 0.75,
          regularMarketTime: Math.floor(Date.now() / 1000),
        },
        {
          symbol: 'XAGUSD=X',
          regularMarketPrice: 25.50,
          regularMarketChange: 0.50,
          regularMarketChangePercent: 2.0,
          regularMarketTime: Math.floor(Date.now() / 1000),
        },
      ];

      const results = formatQuotes(yahooQuotes);

      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('XAUUSD=X');
      expect(results[1].symbol).toBe('XAGUSD=X');
      expect(results[0].isDelayed).toBe(false);
      expect(results[1].isDelayed).toBe(false);
    });

    it('should apply delayed flag to all quotes', () => {
      const yahooQuotes: YahooFinanceQuote[] = [
        {
          symbol: 'GC=F',
          regularMarketPrice: 2048.00,
          regularMarketTime: Math.floor(Date.now() / 1000),
        },
        {
          symbol: 'SI=F',
          regularMarketPrice: 28.75,
          regularMarketTime: Math.floor(Date.now() / 1000),
        },
      ];

      const results = formatQuotes(yahooQuotes, true);

      expect(results).toHaveLength(2);
      expect(results[0].isDelayed).toBe(true);
      expect(results[1].isDelayed).toBe(true);
    });

    it('should handle empty array', () => {
      const results = formatQuotes([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('formatSHFEQuote', () => {
    it('should format a valid SHFE quote', () => {
      const shfeQuote = {
        symbol: 'au0',
        price: 500.50,
        change: 1.50,
        changePercent: 0.30,
        timestamp: Date.now(),
      };

      const result = formatSHFEQuote(shfeQuote, 'sina');

      expect(result).toMatchObject({
        symbol: 'au0',
        name: 'SHFE Gold (Spot)',
        price: 500.50,
        change: 1.50,
        changePercent: 0.30,
        source: 'sina',
        isDelayed: true,
      });
      expect(result.isStale).toBe(false);
    });

    it('should use eastmoney as source', () => {
      const shfeQuote = {
        symbol: 'ag0',
        price: 25.50,
        change: 0.50,
        changePercent: 2.0,
        timestamp: Date.now(),
      };

      const result = formatSHFEQuote(shfeQuote, 'eastmoney');

      expect(result.source).toBe('eastmoney');
      expect(result.isDelayed).toBe(true);
    });

    it('should handle missing price data with defaults', () => {
      const shfeQuote = {
        symbol: 'au0',
      };

      const result = formatSHFEQuote(shfeQuote, 'sina');

      expect(result).toMatchObject({
        symbol: 'au0',
        name: 'SHFE Gold (Spot)',
        price: 0,
        change: 0,
        changePercent: 0,
        source: 'sina',
        isDelayed: true,
      });
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should mark quote as stale if older than threshold + expected delay', () => {
      const oldTimestamp = Date.now() - (25 * 60 * 1000);
      const shfeQuote = {
        symbol: 'au0',
        price: 500.50,
        timestamp: oldTimestamp,
      };

      const result = formatSHFEQuote(shfeQuote, 'sina');

      expect(result.isStale).toBe(true);
    });

    it('should not mark recent quote as stale', () => {
      const recentTimestamp = Date.now() - (2 * 60 * 1000);
      const shfeQuote = {
        symbol: 'au0',
        price: 500.50,
        timestamp: recentTimestamp,
      };

      const result = formatSHFEQuote(shfeQuote, 'sina');

      expect(result.isStale).toBe(false);
    });

    it('should handle unknown symbols gracefully', () => {
      const shfeQuote = {
        symbol: 'unknown',
        price: 100,
      };

      const result = formatSHFEQuote(shfeQuote, 'sina');

      expect(result.symbol).toBe('unknown');
      expect(result.name).toBe('unknown');
    });
  });

  describe('formatSHFEQuotes', () => {
    it('should format multiple SHFE quotes', () => {
      const shfeQuotes = [
        {
          symbol: 'au0',
          price: 500.50,
          change: 1.50,
          changePercent: 0.30,
          timestamp: Date.now(),
        },
        {
          symbol: 'ag0',
          price: 25.50,
          change: 0.50,
          changePercent: 2.0,
          timestamp: Date.now(),
        },
      ];

      const results = formatSHFEQuotes(shfeQuotes, 'sina');

      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('au0');
      expect(results[1].symbol).toBe('ag0');
      expect(results[0].isDelayed).toBe(true);
      expect(results[1].isDelayed).toBe(true);
      expect(results[0].source).toBe('sina');
      expect(results[1].source).toBe('sina');
    });

    it('should apply eastmoney source to all quotes', () => {
      const shfeQuotes = [
        {
          symbol: 'au0',
          price: 500.50,
          timestamp: Date.now(),
        },
        {
          symbol: 'ag0',
          price: 25.50,
          timestamp: Date.now(),
        },
      ];

      const results = formatSHFEQuotes(shfeQuotes, 'eastmoney');

      expect(results).toHaveLength(2);
      expect(results[0].source).toBe('eastmoney');
      expect(results[1].source).toBe('eastmoney');
    });

    it('should handle empty array', () => {
      const results = formatSHFEQuotes([], 'sina');

      expect(results).toHaveLength(0);
    });
  });
});
