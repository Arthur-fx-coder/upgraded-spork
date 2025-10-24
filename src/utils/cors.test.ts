import { describe, it, expect } from 'vitest';
import { getCorsHeaders, createCorsResponse, handleCorsOptions } from './cors';

describe('CORS utilities', () => {
  describe('getCorsHeaders', () => {
    it('should return correct CORS headers', () => {
      const headers = getCorsHeaders();

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should return all required CORS headers', () => {
      const headers = getCorsHeaders();

      expect(Object.keys(headers)).toHaveLength(4);
      expect(headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(headers).toHaveProperty('Access-Control-Max-Age');
    });
  });

  describe('createCorsResponse', () => {
    it('should add CORS headers to response', () => {
      const originalResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const corsResponse = createCorsResponse(originalResponse);

      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(corsResponse.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
      expect(corsResponse.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should preserve original response body', async () => {
      const body = JSON.stringify({ data: 'test' });
      const originalResponse = new Response(body, {
        status: 200,
      });

      const corsResponse = createCorsResponse(originalResponse);
      const responseBody = await corsResponse.text();

      expect(responseBody).toBe(body);
    });

    it('should preserve original response status', () => {
      const originalResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

      const corsResponse = createCorsResponse(originalResponse);

      expect(corsResponse.status).toBe(404);
      expect(corsResponse.statusText).toBe('Not Found');
    });

    it('should preserve existing headers', () => {
      const originalResponse = new Response('test', {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      });

      const corsResponse = createCorsResponse(originalResponse);

      expect(corsResponse.headers.get('Content-Type')).toBe('application/json');
      expect(corsResponse.headers.get('X-Custom-Header')).toBe('custom-value');
    });

    it('should override conflicting CORS headers', () => {
      const originalResponse = new Response('test', {
        headers: {
          'Access-Control-Allow-Origin': 'https://example.com',
        },
      });

      const corsResponse = createCorsResponse(originalResponse);

      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('handleCorsOptions', () => {
    it('should return 204 status', () => {
      const response = handleCorsOptions();

      expect(response.status).toBe(204);
    });

    it('should return null body', async () => {
      const response = handleCorsOptions();
      const body = await response.text();

      expect(body).toBe('');
    });

    it('should include all CORS headers', () => {
      const response = handleCorsOptions();

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should be a valid preflight response', () => {
      const response = handleCorsOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    });
  });

  describe('CORS header values', () => {
    it('should allow all origins', () => {
      const headers = getCorsHeaders();

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should specify correct cache duration', () => {
      const headers = getCorsHeaders();

      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should allow GET and OPTIONS methods', () => {
      const headers = getCorsHeaders();

      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });
  });
});
