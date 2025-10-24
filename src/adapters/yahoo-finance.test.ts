import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YahooFinanceAdapter } from './yahoo-finance';

describe('YahooFinanceAdapter', () => {
  let adapter: YahooFinanceAdapter;
  let fetchMock: typeof global.fetch;

  beforeEach(() => {
    adapter = new YahooFinanceAdapter();
    fetchMock = vi.fn() as typeof global.fetch;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchQuotes', () => {
    it('should fetch quotes successfully', async () => {
      const mockResponse = {
        quoteResponse: {
          result: [
            {
              symbol: 'XAUUSD=X',
              regularMarketPrice: 2050.50,
              regularMarketChange: 15.25,
              regularMarketChangePercent: 0.75,
              regularMarketTime: 1700000000,
            },
          ],
          error: null,
        },
      };

      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const quotes = await adapter.fetchQuotes(['XAUUSD=X']);

      expect(quotes).toHaveLength(1);
      expect(quotes[0].symbol).toBe('XAUUSD=X');
      expect(quotes[0].regularMarketPrice).toBe(2050.50);
    });

    it('should fetch multiple quotes', async () => {
      const mockResponse = {
        quoteResponse: {
          result: [
            {
              symbol: 'XAUUSD=X',
              regularMarketPrice: 2050.50,
              regularMarketChange: 15.25,
              regularMarketChangePercent: 0.75,
              regularMarketTime: 1700000000,
            },
            {
              symbol: 'XAGUSD=X',
              regularMarketPrice: 25.50,
              regularMarketChange: 0.50,
              regularMarketChangePercent: 2.00,
              regularMarketTime: 1700000000,
            },
          ],
          error: null,
        },
      };

      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const quotes = await adapter.fetchQuotes(['XAUUSD=X', 'XAGUSD=X']);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('XAUUSD=X');
      expect(quotes[1].symbol).toBe('XAGUSD=X');
    });

    it('should throw error on non-ok response', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(adapter.fetchQuotes(['XAUUSD=X'])).rejects.toThrow(
        'Yahoo Finance API error: 500'
      );
    });

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        quoteResponse: {
          result: [],
          error: { description: 'Invalid symbol' },
        },
      };

      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(adapter.fetchQuotes(['INVALID'])).rejects.toThrow(
        'Yahoo Finance returned error'
      );
    });

    it('should throw error on network failure', async () => {
      (fetchMock as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(adapter.fetchQuotes(['XAUUSD=X'])).rejects.toThrow('Network error');
    });

    it('should include User-Agent header', async () => {
      const mockResponse = {
        quoteResponse: {
          result: [],
          error: null,
        },
      };

      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await adapter.fetchQuotes(['XAUUSD=X']);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('symbols=XAUUSD=X'),
        expect.objectContaining({
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
          },
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
      });

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return true when API returns 400 (expected for HEAD without params)', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false when API is not accessible', async () => {
      (fetchMock as any).mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false on server error', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should use HEAD method for health check', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
      });

      await adapter.healthCheck();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'HEAD',
        })
      );
    });
  });
});
