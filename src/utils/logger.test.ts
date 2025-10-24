import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: any;

  beforeEach(() => {
    logger = new Logger();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log', () => {
    it('should log with correct level', () => {
      logger.log('info', 'Test message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('info');
      expect(logOutput.message).toBe('Test message');
    });

    it('should include timestamp', () => {
      logger.log('info', 'Test message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.timestamp).toBeDefined();
      expect(new Date(logOutput.timestamp).toISOString()).toBe(logOutput.timestamp);
    });

    it('should include metadata', () => {
      const metadata = { user: 'test', action: 'login' };
      logger.log('info', 'User action', metadata);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user).toBe('test');
      expect(logOutput.action).toBe('login');
    });

    it('should output valid JSON', () => {
      logger.log('info', 'Test message', { key: 'value' });

      expect(() => {
        JSON.parse(consoleLogSpy.mock.calls[0][0]);
      }).not.toThrow();
    });
  });

  describe('debug', () => {
    it('should log with debug level', () => {
      logger.debug('Debug message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('debug');
      expect(logOutput.message).toBe('Debug message');
    });

    it('should include metadata', () => {
      logger.debug('Debug message', { details: 'test' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.details).toBe('test');
    });
  });

  describe('info', () => {
    it('should log with info level', () => {
      logger.info('Info message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('info');
      expect(logOutput.message).toBe('Info message');
    });

    it('should include metadata', () => {
      logger.info('Info message', { count: 5 });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.count).toBe(5);
    });
  });

  describe('warn', () => {
    it('should log with warn level', () => {
      logger.warn('Warning message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('warn');
      expect(logOutput.message).toBe('Warning message');
    });

    it('should include metadata', () => {
      logger.warn('Warning message', { reason: 'rate limit' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.reason).toBe('rate limit');
    });
  });

  describe('error', () => {
    it('should log with error level', () => {
      logger.error('Error message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('error');
      expect(logOutput.message).toBe('Error message');
    });

    it('should include metadata', () => {
      logger.error('Error message', { error: 'Connection failed' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.error).toBe('Connection failed');
    });
  });

  describe('metadata handling', () => {
    it('should handle complex objects', () => {
      const metadata = {
        user: { id: 1, name: 'test' },
        items: [1, 2, 3],
      };
      logger.info('Complex metadata', metadata);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user).toEqual({ id: 1, name: 'test' });
      expect(logOutput.items).toEqual([1, 2, 3]);
    });

    it('should handle nested objects', () => {
      const metadata = {
        response: {
          status: 200,
          data: { value: 'test' },
        },
      };
      logger.info('Nested metadata', metadata);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.response.status).toBe(200);
      expect(logOutput.response.data.value).toBe('test');
    });

    it('should handle no metadata', () => {
      logger.info('No metadata');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('info');
      expect(logOutput.message).toBe('No metadata');
      expect(logOutput.timestamp).toBeDefined();
    });
  });
});
