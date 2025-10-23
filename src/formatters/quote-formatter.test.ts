import { describe, it, expect } from 'vitest';
import { formatQuote, formatQuotes } from './quote-formatter';
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
});
