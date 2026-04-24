/**
 * Production-safe logger utility.
 * 
 * In development: logs normally via console.
 * In production: suppresses verbose output to prevent leaking
 * sensitive information (stack traces, RPC URLs, wallet data).
 * 
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.error('Something failed:', err);
 *   logger.warn('Heads up:', msg);
 *   logger.info('FYI:', data);
 */

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  /** @param {...any} args */
  error(...args) {
    if (isDev) {
      console.error(...args);
    }
    // In production: silently drop or send to error-reporting service.
    // Uncomment below to send to a service like Sentry:
    // errorReportingService.captureException(args[0]);
  },

  /** @param {...any} args */
  warn(...args) {
    if (isDev) {
      console.warn(...args);
    }
  },

  /** @param {...any} args */
  info(...args) {
    if (isDev) {
      console.info(...args);
    }
  },

  /** @param {...any} args */
  log(...args) {
    if (isDev) {
      console.log(...args);
    }
  },

  /** @param {...any} args */
  debug(...args) {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
