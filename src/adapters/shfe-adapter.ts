import { SHFEQuote } from '../types';
import { SINA_BASE_URL, EASTMONEY_BASE_URL, RETRY_ATTEMPTS, RETRY_BACKOFF_MS, SHFE_EXPECTED_DELAY_MS } from '../config';
import { logger } from '../utils/logger';

export class SHFEAdapter {
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempts: number = RETRY_ATTEMPTS,
    backoff: number = RETRY_BACKOFF_MS
  ): Promise<T> {
    let lastError: Error | unknown = null;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < attempts - 1) {
          const delay = backoff * Math.pow(2, i);
          logger.debug('Retry attempt failed, backing off', { 
            attempt: i + 1, 
            delay,
            error: error instanceof Error ? error.message : String(error)
          });
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  private parseJSONP(response: string): string {
    const match = response.match(/var\s+\w+\s*=\s*"(.+)"/);
    if (match && match[1]) {
      return match[1];
    }
    const callbackMatch = response.match(/\w+\((.*)\)/s);
    if (callbackMatch && callbackMatch[1]) {
      return callbackMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    return response;
  }

  private parseSinaResponse(symbol: string, responseText: string): SHFEQuote | null {
    try {
      const data = this.parseJSONP(responseText);
      const fields = data.split(',');
      
      if (fields.length < 8) {
        logger.warn('Sina response has insufficient fields', { symbol, fieldCount: fields.length });
        return null;
      }

      const price = parseFloat(fields[0]);
      const prevClose = parseFloat(fields[1]);
      const change = price - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      const dateStr = fields[fields.length - 3];
      const timeStr = fields[fields.length - 2];
      let timestamp = Date.now();
      
      if (dateStr && timeStr) {
        try {
          const [year, month, day] = dateStr.split('-').map(Number);
          const [hour, minute, second] = timeStr.split(':').map(Number);
          const shanghaiTime = new Date(year, month - 1, day, hour, minute, second);
          timestamp = shanghaiTime.getTime() - (8 * 60 * 60 * 1000);
        } catch (e) {
          logger.warn('Failed to parse Sina timestamp', { symbol, dateStr, timeStr });
        }
      }

      return {
        symbol,
        price: isNaN(price) ? undefined : price,
        change: isNaN(change) ? undefined : change,
        changePercent: isNaN(changePercent) ? undefined : changePercent,
        timestamp,
      };
    } catch (error) {
      logger.error('Failed to parse Sina response', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private parseEastMoneyHTML(symbol: string, html: string): SHFEQuote | null {
    try {
      let jsonStr = html;
      
      if (html.includes('(')) {
        const match = html.match(/\((.*)\)/s);
        if (match && match[1]) {
          jsonStr = match[1];
        }
      }

      const data = JSON.parse(jsonStr);
      
      if (!data.data) {
        logger.warn('EastMoney response missing data field', { symbol });
        return null;
      }

      const quoteData = data.data;
      const price = quoteData.f43 ? quoteData.f43 / 100 : quoteData.f2;
      const change = quoteData.f169 ? quoteData.f169 / 100 : quoteData.f4;
      const changePercent = quoteData.f170 ? quoteData.f170 / 100 : quoteData.f3;
      
      let timestamp = Date.now();
      if (quoteData.f86) {
        try {
          const dateStr = String(quoteData.f86);
          if (dateStr.length === 14) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const hour = parseInt(dateStr.substring(8, 10));
            const minute = parseInt(dateStr.substring(10, 12));
            const second = parseInt(dateStr.substring(12, 14));
            const shanghaiTime = new Date(year, month, day, hour, minute, second);
            timestamp = shanghaiTime.getTime() - (8 * 60 * 60 * 1000);
          }
        } catch (e) {
          logger.warn('Failed to parse EastMoney timestamp', { symbol, timestamp: quoteData.f86 });
        }
      }

      return {
        symbol,
        price: price !== undefined && !isNaN(price) ? price : undefined,
        change: change !== undefined && !isNaN(change) ? change : undefined,
        changePercent: changePercent !== undefined && !isNaN(changePercent) ? changePercent : undefined,
        timestamp,
      };
    } catch (error) {
      logger.error('Failed to parse EastMoney response', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private getSinaSymbol(symbol: string): string {
    return `nf_${symbol}`;
  }

  private getEastMoneySymbol(symbol: string): string {
    return `113.${symbol}`;
  }

  private async fetchFromSina(symbol: string): Promise<SHFEQuote | null> {
    const sinaSymbol = this.getSinaSymbol(symbol);
    const url = `${SINA_BASE_URL}${sinaSymbol}`;
    
    logger.debug('Fetching from Sina', { symbol, url });

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
          'Referer': 'https://finance.sina.com.cn/',
        },
      });

      if (!response.ok) {
        logger.warn('Sina API error', {
          symbol,
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const text = await response.text();
      return this.parseSinaResponse(symbol, text);
    } catch (error) {
      logger.error('Failed to fetch from Sina', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async fetchFromEastMoney(symbol: string): Promise<SHFEQuote | null> {
    const emSymbol = this.getEastMoneySymbol(symbol);
    const url = `${EASTMONEY_BASE_URL}?secid=${emSymbol}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f86,f169,f170,f2,f3,f4`;
    
    logger.debug('Fetching from EastMoney', { symbol, url });

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
          'Referer': 'https://quote.eastmoney.com/',
        },
      });

      if (!response.ok) {
        logger.warn('EastMoney API error', {
          symbol,
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const text = await response.text();
      return this.parseEastMoneyHTML(symbol, text);
    } catch (error) {
      logger.error('Failed to fetch from EastMoney', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async fetchQuote(symbol: string): Promise<SHFEQuote | null> {
    logger.info('Fetching SHFE quote', { symbol });

    try {
      const sinaQuote = await this.retryWithBackoff(async () => {
        const result = await this.fetchFromSina(symbol);
        if (!result || result.price === undefined) {
          throw new Error('Invalid response from Sina');
        }
        return result;
      });
      
      if (sinaQuote && sinaQuote.price !== undefined) {
        logger.info('Successfully fetched quote from Sina', { symbol });
        return sinaQuote;
      }
    } catch (error) {
      logger.warn('Sina fetch failed after retries, trying EastMoney', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const emQuote = await this.retryWithBackoff(async () => {
        const result = await this.fetchFromEastMoney(symbol);
        if (!result || result.price === undefined) {
          throw new Error('Invalid response from EastMoney');
        }
        return result;
      });
      
      if (emQuote && emQuote.price !== undefined) {
        logger.info('Successfully fetched quote from EastMoney', { symbol });
        return emQuote;
      }
    } catch (error) {
      logger.error('Both Sina and EastMoney failed', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return null;
  }

  async fetchQuotes(symbols: string[]): Promise<SHFEQuote[]> {
    const quotes: SHFEQuote[] = [];
    
    for (const symbol of symbols) {
      const quote = await this.fetchQuote(symbol);
      if (quote) {
        quotes.push(quote);
      }
    }
    
    return quotes;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(SINA_BASE_URL + 'nf_au0', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
        },
      });
      return response.ok;
    } catch (error) {
      logger.error('SHFE health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  getExpectedDelayMs(): number {
    return SHFE_EXPECTED_DELAY_MS;
  }
}
