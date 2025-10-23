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

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Architecture

### Caching Strategy

1. **Cache API (60s TTL)**: First layer cache for quick responses
2. **KV Storage**: Persistent storage of last known good values
3. **Fallback**: If Yahoo Finance fails, returns cached data with `isDelayed: true`

### Error Handling

- Invalid symbols return 400 with error message
- Yahoo Finance failures trigger fallback to cached data
- Complete failures return 503 with error details

### Logging

All logs are structured JSON with the following fields:
- `level`: debug, info, warn, error
- `message`: Log message
- `timestamp`: ISO 8601 timestamp
- Additional contextual metadata

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

## License

MIT
