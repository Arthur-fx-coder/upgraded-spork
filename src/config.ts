import { SymbolConfig } from './types';

export const SUPPORTED_SYMBOLS: SymbolConfig[] = [
  {
    symbol: 'XAUUSD=X',
    name: 'Gold/USD',
    type: 'forex',
  },
  {
    symbol: 'XAGUSD=X',
    name: 'Silver/USD',
    type: 'forex',
  },
  {
    symbol: 'GC=F',
    name: 'Gold Futures',
    type: 'futures',
  },
  {
    symbol: 'SI=F',
    name: 'Silver Futures',
    type: 'futures',
  },
];

export const CACHE_TTL_SECONDS = 60;
export const STALE_DATA_THRESHOLD_MS = 5 * 60 * 1000;

export const KV_KEY_PREFIX = 'quote:';
export const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';
