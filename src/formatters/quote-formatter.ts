import { Quote, YahooFinanceQuote, SHFEQuote } from '../types';
import { SUPPORTED_SYMBOLS, STALE_DATA_THRESHOLD_MS, SHFE_EXPECTED_DELAY_MS } from '../config';

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

export function formatSHFEQuote(
  shfeQuote: SHFEQuote,
  source: 'sina' | 'eastmoney'
): Quote {
  const symbolConfig = SUPPORTED_SYMBOLS.find(s => s.symbol === shfeQuote.symbol);
  
  const price = shfeQuote.price ?? 0;
  const change = shfeQuote.change ?? 0;
  const changePercent = shfeQuote.changePercent ?? 0;
  const timestamp = shfeQuote.timestamp ?? Date.now();

  const isStale = Date.now() - timestamp > (STALE_DATA_THRESHOLD_MS + SHFE_EXPECTED_DELAY_MS);

  return {
    symbol: shfeQuote.symbol,
    name: symbolConfig?.name ?? shfeQuote.symbol,
    price,
    change,
    changePercent,
    timestamp,
    source,
    isDelayed: true,
    isStale,
  };
}

export function formatSHFEQuotes(
  shfeQuotes: SHFEQuote[],
  source: 'sina' | 'eastmoney'
): Quote[] {
  return shfeQuotes.map(q => formatSHFEQuote(q, source));
}
