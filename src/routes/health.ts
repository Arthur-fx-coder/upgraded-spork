import { Env, HealthStatus } from '../types';
import { YahooFinanceAdapter } from '../adapters/yahoo-finance';
import { SHFEAdapter } from '../adapters/shfe-adapter';
import { CacheManager } from '../cache/cache-manager';
import { logger } from '../utils/logger';
import { createCorsResponse } from '../utils/cors';

export async function handleHealthRequest(_request: Request, env: Env): Promise<Response> {
  logger.info('Processing health check request');

  const yahooAdapter = new YahooFinanceAdapter();
  const shfeAdapter = new SHFEAdapter();
  const cacheManager = new CacheManager(env.QUOTES_KV);

  const [yahooHealthy, shfeHealthy, cacheHealth] = await Promise.all([
    yahooAdapter.healthCheck(),
    shfeAdapter.healthCheck(),
    cacheManager.healthCheck(),
  ]);

  const allHealthy = yahooHealthy && shfeHealthy && cacheHealth.cache && cacheHealth.kv;
  const someHealthy = yahooHealthy || shfeHealthy || cacheHealth.cache || cacheHealth.kv;

  let status: HealthStatus['status'];
  let httpStatus: number;

  if (allHealthy) {
    status = 'healthy';
    httpStatus = 200;
  } else if (someHealthy) {
    status = 'degraded';
    httpStatus = 200;
  } else {
    status = 'unhealthy';
    httpStatus = 503;
  }

  const healthStatus: HealthStatus = {
    status,
    timestamp: Date.now(),
    checks: {
      yahoo: yahooHealthy,
      shfe: shfeHealthy,
      cache: cacheHealth.cache,
      kv: cacheHealth.kv,
    },
  };

  logger.info('Health check completed', {
    status,
    checks: healthStatus.checks,
  });

  return createCorsResponse(
    new Response(
      JSON.stringify(healthStatus),
      {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );
}
