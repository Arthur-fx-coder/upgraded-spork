import { Quote, YahooFinanceQuote } from '../types';
import { SUPPORTED_SYMBOLS, STALE_DATA_THRESHOLD_MS } from '../config';

export function formatQuote(
  yahooQuote: YahooFinanceQuote,
  isDelayed: boolean = false
): Quote {
  const symbolConfig = SUPPORTED_SYMBOLS.find(s => s.symbol === yahooQuote.symbol);
  
  const price = yahooQuote.regularMarketPrice ?? 0;
  const change = yahooQuote.regularMarketChange ?? 0;
  const changePercent = yahooQuote.regularMarketChangePercent ?? 0;
  const timestamp = yahooQuote.regularMarketTime 
    ? yahooQuote.regularMarketTime * 1000 
    : Date.now();

  const isStale = Date.now() - timestamp > STALE_DATA_THRESHOLD_MS;

  return {
    symbol: yahooQuote.symbol,
    name: symbolConfig?.name ?? yahooQuote.symbol,
    price,
    change,
    changePercent,
    timestamp,
    source: 'yahoo',
    isDelayed,
    isStale,
  };
}

export function formatQuotes(
  yahooQuotes: YahooFinanceQuote[],
  isDelayed: boolean = false
): Quote[] {
  return yahooQuotes.map(q => formatQuote(q, isDelayed));
}
