# Development Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up KV Namespace

For local development, Wrangler will create a local KV namespace automatically.

For production deployment:

```bash
# Create KV namespace
wrangler kv:namespace create "QUOTES_KV"

# Update wrangler.toml with the ID returned
```

### 3. Run Development Server

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

### 4. Test Endpoints

#### Get All Quotes
```bash
curl "http://localhost:8787/api/quotes"
```

#### Get Specific Quotes
```bash
curl "http://localhost:8787/api/quotes?symbols=XAUUSD=X,GC=F"
```

#### Health Check
```bash
curl "http://localhost:8787/api/health"
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Type Checking

```bash
npm run type-check
```

## Deployment

### Deploy to Production

1. Update the KV namespace ID in `wrangler.toml`
2. Deploy:

```bash
npm run deploy
```

### View Logs

```bash
wrangler tail
```

## Project Structure

- **src/adapters/** - External API integrations (Yahoo Finance)
- **src/cache/** - Caching logic (Cache API + KV)
- **src/formatters/** - Data transformation and normalization
- **src/routes/** - HTTP endpoint handlers
- **src/utils/** - Shared utilities (CORS, logging)
- **src/validators/** - Input validation
- **src/config.ts** - Application configuration
- **src/types.ts** - TypeScript type definitions
- **src/index.ts** - Worker entry point

## Adding a New Symbol

1. Add to `SUPPORTED_SYMBOLS` in `src/config.ts`:

```typescript
{
  symbol: 'NEW=X',
  name: 'New Symbol',
  type: 'forex', // or 'futures'
}
```

2. The symbol will automatically be available via the API

## Caching Behavior

- **Cache API**: 60 second TTL per symbol
- **KV Storage**: Indefinite storage of last known good values
- **Fallback**: When Yahoo Finance is unavailable, serves data from KV with `isDelayed: true`
- **Stale Detection**: Data older than 5 minutes is marked as `isStale: true`

## Troubleshooting

### Tests Failing

Ensure you've installed dependencies:
```bash
npm install
```

### Type Errors

Run type check to see specific errors:
```bash
npm run type-check
```

### Local Development Issues

Clear Wrangler cache:
```bash
rm -rf .wrangler
```

### KV Not Working Locally

Wrangler automatically provides a local KV implementation. No setup needed for development.

## Best Practices

1. **Always run tests** before committing
2. **Run type-check** to catch TypeScript errors
3. **Use structured logging** for debugging
4. **Update tests** when adding new features
5. **Keep dependencies updated** regularly

## Monitoring

All logs are structured JSON for easy parsing:

```json
{
  "level": "info",
  "message": "Fetching quotes from Yahoo Finance",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "symbols": ["XAUUSD=X", "XAGUSD=X"]
}
```

Use Cloudflare dashboard or `wrangler tail` to view logs in production.
