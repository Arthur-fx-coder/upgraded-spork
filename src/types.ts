export interface Env {
  QUOTES_KV: KVNamespace;
}

export interface SymbolConfig {
  symbol: string;
  name: string;
  type: 'forex' | 'futures';
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: string;
  isDelayed: boolean;
  isStale: boolean;
}

export interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number;
}

export interface SHFEQuote {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    yahoo: boolean;
    shfe?: boolean;
    cache: boolean;
    kv: boolean;
  };
}
