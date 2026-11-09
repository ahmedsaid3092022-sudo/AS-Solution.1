import { SystemLog, SeverityLevel } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';

class LoggerService {
  private logBuffer: SystemLog[] = [];
  private maxBufferSize = 1000;

  constructor() {
    this.initGlobalErrorHandler();
  }

  private initGlobalErrorHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError(
          'GLOBAL_UNCAUGHT_ERROR',
          `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
          event.error?.stack
        );
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logError(
          'UNHANDLED_PROMISE_REJECTION',
          `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
          event.reason?.stack
        );
      });
    }
  }

  private createLog(
    level: SeverityLevel,
    module: string,
    message: string,
    errorStack?: string,
    meta?: Record<string, any>
  ): SystemLog {
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      errorStack,
      meta,
    };

    // Print to console formatted
    const consolePrefix = `[AS-SOLUTION][${log.timestamp}][${level}][${module}]`;
    if (level === 'ERROR' || level === 'CRITICAL') {
      console.error(`${consolePrefix} ${message}`, errorStack || '', meta || '');
    } else if (level === 'WARN') {
      console.warn(`${consolePrefix} ${message}`, meta || '');
    } else {
      console.log(`${consolePrefix} ${message}`, meta || '');
    }

    // Persist to DB
    try {
      const logs = sqliteAdapter.getTable('systemLogs') || [];
      const updated = [log, ...logs].slice(0, this.maxBufferSize);
      sqliteAdapter.updateTable('systemLogs', updated);
    } catch (err) {
      console.error('Failed to save log to SQLite DB adapter', err);
    }

    return log;
  }

  public logInfo(module: string, message: string, meta?: Record<string, any>): SystemLog {
    return this.createLog('INFO', module, message, undefined, meta);
  }

  public logWarn(module: string, message: string, meta?: Record<string, any>): SystemLog {
    return this.createLog('WARN', module, message, undefined, meta);
  }

  public logError(module: string, message: string, errorStack?: string, meta?: Record<string, any>): SystemLog {
    return this.createLog('ERROR', module, message, errorStack, meta);
  }

  public logCritical(module: string, message: string, errorStack?: string, meta?: Record<string, any>): SystemLog {
    return this.createLog('CRITICAL', module, message, errorStack, meta);
  }

  public getLogs(levelFilter?: SeverityLevel, search?: string): SystemLog[] {
    const logs = sqliteAdapter.getTable('systemLogs') || [];
    return logs.filter((log) => {
      const matchesLevel = !levelFilter || log.level === levelFilter;
      const matchesSearch =
        !search ||
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }

  public clearLogs(): void {
    sqliteAdapter.updateTable('systemLogs', []);
    this.logInfo('SYSTEM', 'تم مسح سجل الأخطاء والتحذيرات النظام محلياً');
  }

  public exportLogsAsJson(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  public exportLogsAsTxt(): string {
    const logs = this.getLogs();
    return logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message} ${
            l.errorStack ? `\nStack: ${l.errorStack}` : ''
          }`
      )
      .join('\n----------------------------------------\n');
  }

  public downloadLogsFile(format: 'json' | 'txt' = 'json'): void {
    const content = format === 'json' ? this.exportLogsAsJson() : this.exportLogsAsTxt();
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const extension = format;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `as_solution_system_logs_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const loggerService = new LoggerService();
