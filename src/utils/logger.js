/**
 * Logging utility for better debugging and production monitoring
 * Provides different log levels and can be extended for error tracking services
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
}

const LOG_COLORS = {
  DEBUG: 'color: #7c3aed; font-weight: bold;',
  INFO: 'color: #0ea5e9; font-weight: bold;',
  WARN: 'color: #f59e0b; font-weight: bold;',
  ERROR: 'color: #ef4444; font-weight: bold;',
}

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV
    this.isProduction = import.meta.env.PROD
  }

  /**
   * Format log message with timestamp
   */
  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    const baseMsg = `[${timestamp}] [${level}] ${message}`
    return data ? `${baseMsg} | Data:` : baseMsg
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (!this.isDevelopment) return
    
    const formatted = this._formatMessage(LOG_LEVELS.DEBUG, message, data)
    console.log(`%c${formatted}`, LOG_COLORS.DEBUG, data || '')
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    const formatted = this._formatMessage(LOG_LEVELS.INFO, message, data)
    console.log(`%c${formatted}`, LOG_COLORS.INFO, data || '')
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    const formatted = this._formatMessage(LOG_LEVELS.WARN, message, data)
    console.warn(`%c${formatted}`, LOG_COLORS.WARN, data || '')
    
    if (this.isProduction) {
      this._reportToService(LOG_LEVELS.WARN, message, data)
    }
  }

  /**
   * Log error message
   */
  error(message, error = null, data = null) {
    const formatted = this._formatMessage(LOG_LEVELS.ERROR, message, error || data)
    console.error(`%c${formatted}`, LOG_COLORS.ERROR, error || data || '')
    
    // Always report errors in production
    if (this.isProduction) {
      this._reportToService(LOG_LEVELS.ERROR, message, error, data)
    }
  }

  /**
   * Log with custom level
   */
  log(level, message, data = null) {
    const color = LOG_COLORS[level] || 'color: #6b7280;'
    const formatted = this._formatMessage(level, message, data)
    console.log(`%c${formatted}`, color, data || '')
  }

  /**
   * Report error to external service (Sentry, LogRocket, etc.)
   * TODO: Integrate with actual error tracking service
   */
  _reportToService(level, message, error, data) {
    if (!this.isProduction) return

    const errorData = {
      level,
      message,
      error: error?.toString() || '',
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error?.stack || '',
    }

    // Placeholder for error reporting service
    try {
      // TODO: Uncomment when integrating with Sentry
      // Sentry.captureException(error, { level, message, data })
      
      // Or use custom endpoint:
      // fetch('/api/logs', { method: 'POST', body: JSON.stringify(errorData) })
      
      console.log('Error report would be sent:', errorData)
    } catch (err) {
      console.error('Failed to report error:', err)
    }
  }

  /**
   * Group console logs (useful for related operations)
   */
  group(label, callback) {
    if (!this.isDevelopment) {
      callback()
      return
    }

    console.group(label)
    callback()
    console.groupEnd()
  }

  /**
   * Time an operation
   */
  time(label, callback) {
    console.time(label)
    const result = callback()
    console.timeEnd(label)
    return result
  }

  /**
   * Clear all logs (be careful with this)
   */
  clear() {
    if (this.isDevelopment) {
      console.clear()
    }
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * React hook for logging component lifecycle
 */
export const useLogger = (componentName) => {
  return {
    debug: (message, data) => logger.debug(`[${componentName}] ${message}`, data),
    info: (message, data) => logger.info(`[${componentName}] ${message}`, data),
    warn: (message, data) => logger.warn(`[${componentName}] ${message}`, data),
    error: (message, error, data) => logger.error(`[${componentName}] ${message}`, error, data),
  }
}

/**
 * Higher-order function to log function calls
 */
export const withLogging = (func, funcName) => {
  return (...args) => {
    logger.debug(`Calling ${funcName}`, args)
    try {
      const result = func(...args)
      if (result instanceof Promise) {
        return result
          .then(res => {
            logger.debug(`${funcName} completed`)
            return res
          })
          .catch(err => {
            logger.error(`${funcName} failed`, err)
            throw err
          })
      }
      return result
    } catch (err) {
      logger.error(`${funcName} failed`, err)
      throw err
    }
  }
}