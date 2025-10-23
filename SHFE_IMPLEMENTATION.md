# SHFE au0/ag0 Data Adapter Implementation

## Overview

This implementation adds support for Shanghai Futures Exchange (SHFE) gold (au0) and silver (ag0) data with comprehensive fallback handling, retry logic, and timestamp normalization.

## Features Implemented

### 1. SHFE Data Adapter (`src/adapters/shfe-adapter.ts`)

#### Primary and Fallback Sources
- **Primary Source**: Sina Finance API (JSONP format)
  - URL: `https://hq.sinajs.cn/list=nf_au0` (or ag0)
  - Response format: JSONP with comma-separated values
  - Provides real-time pricing data with Shanghai timestamps

- **Fallback Source**: EastMoney API (JSON format)
  - URL: `https://push2.eastmoney.com/api/qt/stock/get`
  - Response format: JSON with structured data
  - Activated when Sina fails after retries

#### Retry Mechanism
- Implements exponential backoff with configurable attempts (default: 3)
- Base backoff delay: 1000ms
- Backoff multiplier: 2x (delays: 1s, 2s, 4s)
- Retries on both network errors and invalid responses

#### Response Parsing

**Sina JSONP Parser**:
- Extracts data from JSONP wrapper: `var hq_str_nf_au0="..."`
- Parses comma-separated fields: `price,prevClose,field3,...,date,time,...`
- Calculates change and change percentage from current and previous close
- Handles malformed responses gracefully

**EastMoney JSON Parser**:
- Parses JSON structure with fields: `f43` (price), `f169` (change), `f170` (changePercent)
- Timestamp field: `f86` (format: YYYYMMDDHHmmss)
- Handles both JSONP-wrapped and pure JSON responses

#### Timestamp Normalization
- Shanghai timestamps (UTC+8) are automatically converted to UTC
- Conversion: `UTC = ShanghaiTime - (8 * 60 * 60 * 1000)`
- Expected delay indicator: 15 minutes (SHFE data is typically delayed)
- Stale threshold: 20 minutes (5 min base + 15 min expected delay)

#### Health Check
- Tests connectivity to Sina Finance API
- Returns boolean indicating service availability
- Integrated into overall health endpoint

### 2. Quote Formatter Extensions (`src/formatters/quote-formatter.ts`)

#### New Functions
- `formatSHFEQuote(shfeQuote, source)`: Formats a single SHFE quote
  - Source attribution: 'sina' or 'eastmoney'
  - Always marked as `isDelayed: true` (SHFE data has expected delay)
  - Adjusts stale threshold for SHFE data
  
- `formatSHFEQuotes(shfeQuotes, source)`: Formats multiple SHFE quotes

### 3. Configuration Updates (`src/config.ts`)

#### New Symbols
```typescript
{
  symbol: 'au0',
  name: 'SHFE Gold (Spot)',
  type: 'futures',
},
{
  symbol: 'ag0',
  name: 'SHFE Silver (Spot)',
  type: 'futures',
}
```

#### New Constants
- `SINA_BASE_URL`: Sina Finance API endpoint
- `EASTMONEY_BASE_URL`: EastMoney API endpoint
- `SHFE_EXPECTED_DELAY_MS`: 15 minutes (900,000ms)
- `RETRY_ATTEMPTS`: 3
- `RETRY_BACKOFF_MS`: 1000ms

### 4. Routes Integration (`src/routes/quotes.ts`)

#### SHFE Symbol Detection
- Identifies SHFE symbols (au0, ag0) for special handling
- Routes to SHFE adapter instead of Yahoo Finance

#### Fallback to KV Storage
- When both Sina and EastMoney fail after retries
- Retrieves last known good value from KV storage
- Marks retrieved value as delayed

#### Cache Strategy
- 60-second cache for rapid response
- KV storage for last-good fallback values
- Updates both cache and KV on successful fetch

### 5. Health Check Extensions (`src/routes/health.ts`)

#### Enhanced Health Status
- Added `shfe` check alongside existing checks
- Status calculation considers SHFE availability
- Response includes all data source statuses:
  ```json
  {
    "checks": {
      "yahoo": true,
      "shfe": true,
      "cache": true,
      "kv": true
    }
  }
  ```

### 6. Type Definitions (`src/types.ts`)

#### New Types
```typescript
interface SHFEQuote {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}
```

#### Updated Types
- `HealthStatus.checks` now includes optional `shfe?: boolean`

## Testing

### Test Coverage (`src/adapters/shfe-adapter.test.ts`)

#### Successful Scenarios
- Fetch quote from Sina successfully
- Handle Sina JSONP response with comma-separated values
- Convert Shanghai time to UTC correctly
- Fetch multiple quotes

#### Fallback Scenarios
- Fallback to EastMoney when Sina fails
- Handle EastMoney JSON response
- Retry with exponential backoff

#### Error Handling
- Return null when all sources fail
- Handle empty Sina response
- Handle malformed Sina response
- Handle EastMoney response without data field
- Handle HTTP error responses
- Handle partial failures in batch requests

#### Health Check Tests
- Return true when Sina is accessible
- Return false when Sina is not accessible

### Formatter Tests (`src/formatters/quote-formatter.test.ts`)

#### SHFE Quote Formatting
- Format valid SHFE quote with sina source
- Format with eastmoney source
- Handle missing price data with defaults
- Mark quote as stale when appropriate
- Handle recent quotes (not stale)
- Handle unknown symbols gracefully
- Format multiple SHFE quotes
- Apply source attribution correctly

## API Response Changes

### Quote Response Fields

Updated `source` field values:
- `"yahoo"`: Yahoo Finance data
- `"sina"`: Sina Finance data (SHFE)
- `"eastmoney"`: EastMoney data (SHFE fallback)

Updated `isDelayed` field:
- `true` for all SHFE data (expected 15-minute delay)
- `true` when using cached fallback data

Updated `isStale` calculation:
- Yahoo data: > 5 minutes old
- SHFE data: > 20 minutes old (5 min + 15 min delay)

### Example Response
```json
{
  "quotes": [
    {
      "symbol": "au0",
      "name": "SHFE Gold (Spot)",
      "price": 500.50,
      "change": 1.50,
      "changePercent": 0.30,
      "timestamp": 1700000000000,
      "source": "sina",
      "isDelayed": true,
      "isStale": false
    }
  ],
  "timestamp": 1700000000000
}
```

## Logging Enhancements

### New Log Events
- SHFE quote fetch attempts
- Sina/EastMoney API calls with URLs
- Retry attempts with backoff delays
- Fallback activations
- Parsing errors with context
- Source attribution in success messages

### Log Levels
- `debug`: Cache operations, retry attempts
- `info`: Successful fetches, source identification
- `warn`: Fallback activations, invalid responses
- `error`: Complete failures, parsing errors

## Performance Considerations

### Retry Impact
- Maximum retry time: ~7 seconds (1s + 2s + 4s delays)
- Both Sina and EastMoney retried: ~14 seconds max
- Mitigated by KV fallback for failed requests

### Cache Efficiency
- 60-second cache reduces API calls
- KV storage provides instant fallback
- Parallel cache and KV updates

## Edge Cases Handled

1. **Network Failures**: Retries with backoff
2. **Malformed JSONP**: Falls back to EastMoney
3. **Invalid JSON**: Retries and fallbacks
4. **Missing Data Fields**: Returns null gracefully
5. **Timestamp Parsing Errors**: Uses current time as fallback
6. **Empty Responses**: Treated as failures, triggers fallback
7. **HTTP Errors**: Logged and retried
8. **Concurrent Requests**: Each symbol fetched independently

## Future Enhancements

Potential improvements for future iterations:
1. Batch API calls for multiple SHFE symbols
2. WebSocket support for real-time data
3. Circuit breaker pattern for failing sources
4. Configurable retry strategies per source
5. Historical data caching
6. Rate limiting protection
7. Source preference configuration
8. Additional SHFE contract support
