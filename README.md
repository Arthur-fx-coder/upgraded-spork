# Workers Quotes API

A Cloudflare Worker that provides real-time quote data from Yahoo Finance with intelligent caching and fallback mechanisms.

## Features

- **Yahoo Finance Integration**: Fetches quotes for Gold/Silver spot prices and futures
- **SHFE Integration**: Fetches quotes from Shanghai Futures Exchange (SHFE) with:
  - Sina Finance API (JSONP) with fallback to EastMoney (JSON/HTML)
  - Automatic retry with exponential backoff
  - UTC timestamp normalization with Shanghai time conversion
  - Expected delay indicators for SHFE data
- **Dual-layer Caching**: 
  - Cache API for 60-second per-symbol caching
  - KV storage for last-good values as fallback
- **Health Monitoring**: Built-in health checks for all dependencies
- **CORS Support**: Ready for cross-origin requests
- **Structured Logging**: JSON-formatted logs for easy monitoring
- **Request Validation**: Validates symbols against supported list

## Supported Symbols

- `XAUUSD=X` - Gold/USD spot price
- `XAGUSD=X` - Silver/USD spot price
- `GC=F` - Gold Futures
- `SI=F` - Silver Futures
- `au0` - SHFE Gold (Spot)
- `ag0` - SHFE Silver (Spot)

## API Endpoints

### GET /api/quotes

Fetch quotes for one or more symbols.

**Query Parameters:**
- `symbols` (optional): Comma-separated list of symbols. If not provided, returns all supported symbols.

**Example Request:**
```bash
curl "https://your-worker.workers.dev/api/quotes?symbols=XAUUSD=X,XAGUSD=X"
```

**Example Response:**
```json
{
  "quotes": [
    {
      "symbol": "XAUUSD=X",
      "name": "Gold/USD",
      "price": 2050.50,
      "change": 15.25,
      "changePercent": 0.75,
      "timestamp": 1700000000000,
      "source": "yahoo",
      "isDelayed": false,
      "isStale": false
    }
  ],
  "timestamp": 1700000000000
}
```

**Response Fields:**
- `symbol`: The ticker symbol
- `name`: Human-readable name
- `price`: Current market price
- `change`: Price change
- `changePercent`: Percentage change
- `timestamp`: Quote timestamp in UTC (milliseconds)
- `source`: Data source ("yahoo", "sina", or "eastmoney")
- `isDelayed`: True if using cached fallback data or SHFE data (expected 15 min delay)
- `isStale`: True if data is older than threshold (5 min for Yahoo, 20 min for SHFE)

### GET /api/health

Check the health status of the service and its dependencies.

**Example Request:**
```bash
curl "https://your-worker.workers.dev/api/health"
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": 1700000000000,
  "checks": {
    "yahoo": true,
    "shfe": true,
    "cache": true,
    "kv": true
  }
}
```

**Status Values:**
- `healthy`: All checks passing
- `degraded`: Some checks failing
- `unhealthy`: All checks failing

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd workers-quotes-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a KV namespace:
```bash
wrangler kv:namespace create "QUOTES_KV"
```

4. Update `wrangler.toml` with your KV namespace ID:
```toml
[[kv_namespaces]]
binding = "QUOTES_KV"
id = "your-kv-namespace-id"
```

### Local Development

#### 1. Start Development Server

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

#### 2. Test the API Locally

**Get all quotes:**
```bash
curl "http://localhost:8787/api/quotes"
```

**Get specific quotes:**
```bash
curl "http://localhost:8787/api/quotes?symbols=XAUUSD=X,GC=F"
```

**Health check:**
```bash
curl "http://localhost:8787/api/health"
```

#### 3. View Logs

Logs are automatically displayed in the terminal when running `npm run dev`:
```json
{"level":"info","message":"Fetching quotes from Yahoo Finance","timestamp":"2024-01-01T12:00:00.000Z","symbols":["XAUUSD=X"]}
```

#### 4. Local KV Storage

Wrangler automatically provides a local KV namespace for development. No setup required.

### Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode (for development):
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run type checking:
```bash
npm run type-check
```

### Deployment

#### Prerequisites for Production

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already included in dev dependencies
3. **KV Namespace**: Create production KV namespace

#### Step 1: Create Production KV Namespace

```bash
wrangler kv:namespace create "QUOTES_KV"
```

This will output:
```
🌀 Creating namespace with title "workers-quotes-api-QUOTES_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "QUOTES_KV", id = "abc123..." }
```

#### Step 2: Update wrangler.toml

Update the `id` in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "QUOTES_KV"
id = "abc123..."  # Use the ID from previous step
```

#### Step 3: Deploy

```bash
npm run deploy
```

Output will show your worker URL:
```
Uploaded workers-quotes-api (1.23 sec)
Published workers-quotes-api (0.45 sec)
  https://workers-quotes-api.your-subdomain.workers.dev
```

#### Step 4: Test Production Deployment

```bash
curl "https://workers-quotes-api.your-subdomain.workers.dev/api/quotes?symbols=XAUUSD=X"
```

#### Monitoring Production

**View real-time logs:**
```bash
wrangler tail
```

**View logs with filtering:**
```bash
wrangler tail --format pretty
```

**Access Cloudflare Dashboard:**
- Go to Workers & Pages → workers-quotes-api
- View analytics, logs, and metrics
- Monitor CPU time, requests, and errors

#### Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Triggers
4. Add custom domain or route

#### Environment-specific Deployments

For staging environment:
```bash
wrangler deploy --env staging
```

Add to `wrangler.toml`:
```toml
[env.staging]
name = "workers-quotes-api-staging"
[[env.staging.kv_namespaces]]
binding = "QUOTES_KV"
id = "staging-kv-id"
```

## Architecture

### Overview

This Cloudflare Worker follows a layered architecture:

```
Client Request
     ↓
Request Validator → Request Routing
     ↓
Data Adapters (Yahoo Finance, SHFE)
     ↓
Cache Layer (Cache API + KV Storage)
     ↓
Response Formatter
     ↓
CORS-enabled Response
```

### Components

#### 1. Data Adapters
- **Yahoo Finance Adapter**: Fetches quotes from Yahoo Finance v7 API for spot prices and futures
- **SHFE Adapter**: Multi-source adapter with automatic fallback:
  - Primary: Sina Finance API (JSONP format)
  - Fallback: EastMoney API (JSON format)
  - Includes retry logic with exponential backoff (3 attempts)
  - Converts Shanghai time (UTC+8) to UTC timestamps

#### 2. Caching Strategy

**Two-layer caching for reliability and performance:**

1. **Cache API (60s TTL)**: First layer cache for quick responses
   - Per-symbol caching
   - Reduces external API calls
   - Automatic invalidation after 60 seconds

2. **KV Storage**: Persistent storage of last known good values
   - Acts as fallback when external APIs fail
   - Indefinite storage of last successful fetch
   - Enables graceful degradation

3. **Fallback Mechanism**: If external APIs fail, returns cached data with `isDelayed: true`

#### 3. Request Flow

1. Client makes request to `/api/quotes`
2. Request validator checks symbol validity
3. Check Cache API for fresh data (< 60s old)
4. If cache miss, fetch from appropriate adapter (Yahoo/SHFE)
5. Store fetched data in both Cache API and KV
6. Format and return response with CORS headers

### Data Sources

#### Yahoo Finance API
- **Endpoint**: `https://query1.finance.yahoo.com/v7/finance/quote`
- **Symbols**: `XAUUSD=X`, `XAGUSD=X`, `GC=F`, `SI=F`
- **Update Frequency**: Real-time (during market hours)
- **Rate Limits**: No official limits, but respectful usage recommended
- **Reliability**: High availability, used by millions of users

#### SHFE Data Sources

**Primary: Sina Finance**
- **Endpoint**: `https://hq.sinajs.cn/list=nf_{symbol}`
- **Format**: JSONP
- **Update Frequency**: ~15 minute delay
- **Symbols**: `au0` (gold), `ag0` (silver)

**Fallback: EastMoney**
- **Endpoint**: `https://push2.eastmoney.com/api/qt/stock/get`
- **Format**: JSON
- **Update Frequency**: ~15 minute delay
- **Symbols**: Same as Sina

### Limitations

#### Data Delays
- **Yahoo Finance**: Real-time during market hours, delayed after-hours
- **SHFE Data**: Expected 15-minute delay (indicated by `isDelayed: true`)
- **Stale Detection**: 
  - Yahoo: Data older than 5 minutes marked as `isStale: true`
  - SHFE: Data older than 20 minutes marked as `isStale: true`

#### Rate Limits
- **Worker Limits**: Cloudflare Workers free tier: 100,000 requests/day
- **Cache Hit Rate**: ~95% with 60s TTL, significantly reduces upstream calls
- **Recommended Client Polling**: 60 seconds minimum to align with cache TTL
- **External API Limits**: No official limits, but retry backoff prevents abuse

#### Market Hours
- **SHFE**: Monday-Friday, 9:00-15:00 CST (with breaks)
- **US Markets**: Monday-Friday, 9:30-16:00 EST
- Outside market hours, data may be stale or delayed

#### Symbol Coverage
- Limited to 6 symbols (Gold/Silver spot, futures, and SHFE)
- Not extensible to arbitrary symbols without code changes

### Error Handling

- **Invalid symbols**: Return 400 with error message
- **Yahoo Finance failures**: Trigger fallback to cached data
- **SHFE failures**: Automatic retry (3 attempts) with exponential backoff, then fallback to alternate source
- **Complete failures**: Return 503 with error details
- **Partial failures**: Return available data with error indicators

### Logging

All logs are structured JSON with the following fields:
- `level`: debug, info, warn, error
- `message`: Log message
- `timestamp`: ISO 8601 timestamp
- Additional contextual metadata

**Example log entries:**

```json
{
  "level": "info",
  "message": "Fetching quotes from Yahoo Finance",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "symbols": ["XAUUSD=X", "XAGUSD=X"]
}
```

```json
{
  "level": "error",
  "message": "Failed to fetch quotes from Yahoo Finance",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "error": "Network timeout"
}
```

**Log Levels:**
- `debug`: Detailed debugging information
- `info`: General informational messages (API calls, cache hits)
- `warn`: Warning messages (stale data, fallback usage)
- `error`: Error messages (API failures, validation errors)

## Development

### Project Structure

```
.
├── src/
│   ├── adapters/
│   │   ├── yahoo-finance.ts      # Yahoo Finance API adapter
│   │   ├── shfe-adapter.ts       # SHFE adapter (Sina/EastMoney)
│   │   └── shfe-adapter.test.ts  # SHFE adapter tests
│   ├── cache/
│   │   ├── cache-manager.ts      # Cache and KV management
│   │   └── cache-manager.test.ts # Cache tests
│   ├── formatters/
│   │   ├── quote-formatter.ts    # Quote normalization
│   │   └── quote-formatter.test.ts # Formatter tests
│   ├── routes/
│   │   ├── quotes.ts             # Quotes endpoint handler
│   │   └── health.ts             # Health endpoint handler
│   ├── utils/
│   │   ├── cors.ts               # CORS utilities
│   │   └── logger.ts             # Structured logging
│   ├── validators/
│   │   ├── request-validator.ts  # Request validation
│   │   └── request-validator.test.ts # Validator tests
│   ├── config.ts                 # Configuration
│   ├── types.ts                  # TypeScript types
│   └── index.ts                  # Worker entry point
├── wrangler.toml                 # Cloudflare Workers config
├── package.json
└── tsconfig.json
```

## Client Integration Examples

### JavaScript/TypeScript Frontend

Example implementation with polling:

```javascript
class QuotesClient {
  constructor(baseUrl, pollInterval = 60000) {
    this.baseUrl = baseUrl;
    this.pollInterval = pollInterval;
    this.callbacks = [];
    this.isPolling = false;
  }

  async fetchQuotes(symbols = []) {
    const url = new URL(`${this.baseUrl}/api/quotes`);
    if (symbols.length > 0) {
      url.searchParams.append('symbols', symbols.join(','));
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  startPolling(symbols = []) {
    if (this.isPolling) return;

    this.isPolling = true;
    const poll = async () => {
      try {
        const data = await this.fetchQuotes(symbols);
        this.callbacks.forEach(cb => cb(null, data));
      } catch (error) {
        this.callbacks.forEach(cb => cb(error, null));
      }

      if (this.isPolling) {
        setTimeout(poll, this.pollInterval);
      }
    };

    poll();
  }

  stopPolling() {
    this.isPolling = false;
  }

  onUpdate(callback) {
    this.callbacks.push(callback);
  }
}

// Usage
const client = new QuotesClient('https://your-worker.workers.dev', 60000);

client.onUpdate((error, data) => {
  if (error) {
    console.error('Failed to fetch quotes:', error);
    return;
  }

  data.quotes.forEach(quote => {
    console.log(`${quote.symbol}: ${quote.price} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent}%)`);
    
    if (quote.isStale) {
      console.warn(`Warning: ${quote.symbol} data is stale`);
    }
    if (quote.isDelayed) {
      console.info(`Info: ${quote.symbol} has expected delay`);
    }
  });
});

// Start polling for specific symbols
client.startPolling(['XAUUSD=X', 'XAGUSD=X']);

// Or poll for all symbols
// client.startPolling();

// Stop polling when done
// client.stopPolling();
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface Quote {
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

interface QuotesData {
  quotes: Quote[];
  timestamp: number;
}

export function useQuotes(symbols: string[], pollInterval = 60000) {
  const [data, setData] = useState<QuotesData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchQuotes = async () => {
      try {
        const url = new URL('https://your-worker.workers.dev/api/quotes');
        if (symbols.length > 0) {
          url.searchParams.append('symbols', symbols.join(','));
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbols.join(','), pollInterval]);

  return { data, error, loading };
}

// Usage in component
function QuoteDisplay() {
  const { data, error, loading } = useQuotes(['XAUUSD=X', 'XAGUSD=X'], 60000);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      {data.quotes.map(quote => (
        <div key={quote.symbol}>
          <h3>{quote.name} ({quote.symbol})</h3>
          <p>Price: ${quote.price.toFixed(2)}</p>
          <p>Change: {quote.changePercent > 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</p>
          {quote.isStale && <p className="warning">⚠️ Data is stale</p>}
          {quote.isDelayed && <p className="info">ℹ️ Data has expected delay</p>}
        </div>
      ))}
    </div>
  );
}
```

### Python Client Example

```python
import requests
import time
from typing import List, Optional, Callable

class QuotesClient:
    def __init__(self, base_url: str, poll_interval: int = 60):
        self.base_url = base_url
        self.poll_interval = poll_interval
        self.is_polling = False

    def fetch_quotes(self, symbols: Optional[List[str]] = None):
        url = f"{self.base_url}/api/quotes"
        params = {}
        if symbols:
            params['symbols'] = ','.join(symbols)
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def poll(self, symbols: Optional[List[str]] = None, 
             callback: Optional[Callable] = None):
        self.is_polling = True
        while self.is_polling:
            try:
                data = self.fetch_quotes(symbols)
                if callback:
                    callback(data)
                time.sleep(self.poll_interval)
            except Exception as e:
                print(f"Error fetching quotes: {e}")
                time.sleep(self.poll_interval)

    def stop_polling(self):
        self.is_polling = False

# Usage
client = QuotesClient('https://your-worker.workers.dev', poll_interval=60)

def on_update(data):
    for quote in data['quotes']:
        print(f"{quote['symbol']}: ${quote['price']} ({quote['changePercent']:+.2f}%)")
        if quote['isStale']:
            print(f"  Warning: {quote['symbol']} data is stale")

try:
    client.poll(['XAUUSD=X', 'XAGUSD=X'], callback=on_update)
except KeyboardInterrupt:
    client.stop_polling()
```

## Troubleshooting

### Common Issues

#### 1. "Invalid symbol" Error

**Problem**: API returns 400 with "Invalid symbol" message

**Solution**: Check that you're using supported symbols:
- `XAUUSD=X`, `XAGUSD=X`, `GC=F`, `SI=F`, `au0`, `ag0`

**Example**:
```bash
# Wrong - returns 400
curl "http://localhost:8787/api/quotes?symbols=AAPL"

# Correct
curl "http://localhost:8787/api/quotes?symbols=XAUUSD=X"
```

#### 2. Data Marked as Stale

**Problem**: Responses have `isStale: true`

**Causes**:
- Outside market trading hours
- External API is down
- Network connectivity issues

**Solution**:
- Check market hours (SHFE: 9:00-15:00 CST, US: 9:30-16:00 EST)
- Verify external API health via `/api/health` endpoint
- Data is still returned from cache, but may be outdated

#### 3. SHFE Data Always Delayed

**Problem**: SHFE symbols (`au0`, `ag0`) always show `isDelayed: true`

**Explanation**: This is expected behavior. SHFE data has a ~15 minute delay.

**Solution**: This is normal. Use `isStale` flag to detect truly outdated data (>20 min old).

#### 4. High Response Times

**Problem**: API responses are slow (>1 second)

**Possible Causes**:
- Cache miss (first request for a symbol)
- External API latency
- SHFE retry logic (up to 3 attempts)

**Solutions**:
- Subsequent requests within 60s will be cached (fast)
- Monitor cache hit rate in logs
- Consider implementing client-side caching

#### 5. KV Namespace Errors

**Problem**: "KV namespace not found" or "QUOTES_KV is undefined"

**Local Development**:
- Wrangler should auto-create local KV
- Try: `rm -rf .wrangler && npm run dev`

**Production**:
- Ensure KV namespace is created: `wrangler kv:namespace create "QUOTES_KV"`
- Verify `wrangler.toml` has correct KV ID

#### 6. CORS Errors in Browser

**Problem**: Browser shows CORS policy error

**Common Causes**:
- Preflight (OPTIONS) requests failing
- Custom headers not allowed

**Solution**: The worker includes full CORS support. If issues persist:
```javascript
// Ensure you're not sending unsupported headers
fetch('https://your-worker.workers.dev/api/quotes', {
  headers: {
    'Content-Type': 'application/json',  // Allowed
    // Don't send custom headers
  }
});
```

#### 7. Type Check Errors

**Problem**: `npm run type-check` fails

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for missing types
npm run type-check
```

#### 8. Tests Failing

**Problem**: `npm test` shows failures

**Common Causes**:
- Outdated dependencies
- Node version mismatch

**Solution**:
```bash
# Check Node version (requires 18+)
node --version

# Reinstall dependencies
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

#### 9. Deployment Issues

**Problem**: Deployment fails or worker doesn't work after deployment

**Checklist**:
- [ ] KV namespace created and ID updated in `wrangler.toml`
- [ ] Tests passing: `npm test`
- [ ] Type check passing: `npm run type-check`
- [ ] Logged into Wrangler: `wrangler login`

**Debug**:
```bash
# View deployment logs
wrangler tail

# Test specific endpoint
curl "https://your-worker.workers.dev/api/health"
```

### Logging Best Practices

#### Viewing Logs in Development

```bash
npm run dev
# Logs appear in terminal automatically
```

#### Viewing Production Logs

```bash
# Real-time logs
wrangler tail

# Pretty-printed logs
wrangler tail --format pretty

# Filter by log level
wrangler tail | grep '"level":"error"'
```

#### Understanding Log Entries

```json
{
  "level": "info",
  "message": "Fetching quotes from Yahoo Finance",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "symbols": ["XAUUSD=X", "XAGUSD=X"]
}
```

- `level`: Severity (debug, info, warn, error)
- `message`: Human-readable description
- `timestamp`: When the event occurred (UTC)
- Additional fields: Context-specific metadata

#### Common Log Patterns

**Successful fetch**:
```json
{"level":"info","message":"Successfully fetched quotes","count":2}
```

**Cache hit**:
```json
{"level":"debug","message":"Cache hit","symbol":"XAUUSD=X"}
```

**Fallback to cached data**:
```json
{"level":"warn","message":"Using cached data","reason":"API unavailable"}
```

**API error**:
```json
{"level":"error","message":"Failed to fetch quotes from Yahoo Finance","error":"Network timeout"}
```

### Getting Help

1. **Check existing issues**: Review closed and open issues in the repository
2. **Enable debug logging**: Set higher verbosity in development
3. **Test health endpoint**: `/api/health` shows status of all dependencies
4. **Review Cloudflare Status**: Check [cloudflarestatus.com](https://cloudflarestatus.com)
5. **External API Status**:
   - Yahoo Finance: Test manually with `curl`
   - Sina Finance: May be blocked outside China (use VPN)

## License

MIT
