import { Env } from './types';
import { handleQuotesRequest } from './routes/quotes';
import { handleHealthRequest } from './routes/health';
import { handleCorsOptions } from './utils/cors';
import { logger } from './utils/logger';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return handleCorsOptions();
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    logger.info('Incoming request', {
      method: request.method,
      path: url.pathname,
    });

    try {
      if (url.pathname === '/api/quotes') {
        return await handleQuotesRequest(request, env);
      }

      if (url.pathname === '/api/health') {
        return await handleHealthRequest(request, env);
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      logger.error('Unhandled error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
