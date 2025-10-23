type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }
}

export const logger = new Logger();
