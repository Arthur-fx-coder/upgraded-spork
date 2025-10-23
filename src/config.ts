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
  {
    symbol: 'au0',
    name: 'SHFE Gold (Spot)',
    type: 'futures',
  },
  {
    symbol: 'ag0',
    name: 'SHFE Silver (Spot)',
    type: 'futures',
  },
];

export const CACHE_TTL_SECONDS = 60;
export const STALE_DATA_THRESHOLD_MS = 5 * 60 * 1000;

export const KV_KEY_PREFIX = 'quote:';
export const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';

export const SINA_BASE_URL = 'https://hq.sinajs.cn/list=';
export const EASTMONEY_BASE_URL = 'https://push2.eastmoney.com/api/qt/stock/get';
export const SHFE_EXPECTED_DELAY_MS = 15 * 60 * 1000;
export const RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 1000;
