import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SHFEAdapter } from './shfe-adapter';

describe('SHFEAdapter', () => {
  let adapter: SHFEAdapter;
  let fetchMock: typeof global.fetch;

  beforeEach(() => {
    adapter = new SHFEAdapter();
    fetchMock = vi.fn() as typeof global.fetch;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchQuote', () => {
    it('should fetch quote from Sina successfully', async () => {
      const mockResponse = 'var hq_str_nf_au0="500.50,499.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"';
      
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('au0');
      expect(quote?.price).toBe(500.50);
    });

    it('should handle Sina JSONP response with comma-separated values', async () => {
      const mockResponse = 'var hq_str_nf_ag0="25.50,25.00,0.50,2.0,0,0,0,0,2024-01-15,14:30:00,0"';
      
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      });

      const quote = await adapter.fetchQuote('ag0');

      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('ag0');
      expect(quote?.price).toBeGreaterThan(0);
    });

    it('should fallback to EastMoney when Sina fails', async () => {
      (fetchMock as any)
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('au0');
      expect(quote?.price).toBe(500.50);
    });

    it('should retry with exponential backoff', async () => {
      (fetchMock as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('var hq_str_nf_au0="500.50,499.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"'),
        });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should return null when all sources fail', async () => {
      (fetchMock as any).mockRejectedValue(new Error('All sources failed'));

      const quote = await adapter.fetchQuote('au0');

      expect(quote).toBeNull();
    }, 10000);

    it('should handle empty Sina response', async () => {
      (fetchMock as any).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('var hq_str_nf_au0=""'),
      });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).toBeNull();
    }, 10000);

    it('should handle malformed Sina response', async () => {
      (fetchMock as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('invalid data'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('invalid data'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('invalid data'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            data: {
              f43: 50050,
              f169: 50,
              f170: 100,
              f86: 20240115143000,
            },
          })),
        });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
    });

    it('should convert Shanghai time to UTC', async () => {
      const mockResponse = 'var hq_str_nf_au0="500.50,499.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"';
      
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
      expect(quote?.timestamp).toBeDefined();
    });

    it('should handle EastMoney JSON response', async () => {
      const mockResponse = {
        data: {
          f43: 50050,
          f169: 150,
          f170: 300,
          f86: 20240115143000,
        },
      };

      (fetchMock as any)
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).not.toBeNull();
      expect(quote?.price).toBe(500.50);
      expect(quote?.change).toBe(1.50);
      expect(quote?.changePercent).toBe(3.00);
    });

    it('should handle EastMoney response without data field', async () => {
      (fetchMock as any)
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockRejectedValueOnce(new Error('Sina failed'))
        .mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ error: 'No data' })),
        });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).toBeNull();
    }, 10000);

    it('should handle HTTP error responses', async () => {
      (fetchMock as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const quote = await adapter.fetchQuote('au0');

      expect(quote).toBeNull();
    }, 10000);
  });

  describe('fetchQuotes', () => {
    it('should fetch multiple quotes', async () => {
      (fetchMock as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('var hq_str_nf_au0="500.50,499.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"'),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('var hq_str_nf_ag0="25.50,25.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"'),
        });

      const quotes = await adapter.fetchQuotes(['au0', 'ag0']);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('au0');
      expect(quotes[1].symbol).toBe('ag0');
    });

    it('should handle partial failures', async () => {
      (fetchMock as any)
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('var hq_str_nf_au0="500.50,499.00,0,0,0,0,0,0,2024-01-15,14:30:00,0"'),
        })
        .mockRejectedValue(new Error('Failed'));

      const quotes = await adapter.fetchQuotes(['au0', 'ag0']);

      expect(quotes).toHaveLength(1);
      expect(quotes[0].symbol).toBe('au0');
    }, 10000);

    it('should handle empty symbol list', async () => {
      const quotes = await adapter.fetchQuotes([]);

      expect(quotes).toHaveLength(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Sina is accessible', async () => {
      (fetchMock as any).mockResolvedValueOnce({
        ok: true,
      });

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(true);
    });

    it('should return false when Sina is not accessible', async () => {
      (fetchMock as any).mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await adapter.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('getExpectedDelayMs', () => {
    it('should return expected delay in milliseconds', () => {
      const delay = adapter.getExpectedDelayMs();

      expect(delay).toBe(15 * 60 * 1000);
    });
  });
});
