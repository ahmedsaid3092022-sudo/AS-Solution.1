import { AuditLog, SeverityLevel } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from './loggerService';

class AuditService {
  public logAction(
    userId: string,
    userName: string,
    action: string,
    module: string,
    details: string,
    severity: SeverityLevel = 'INFO'
  ): AuditLog {
    const logs = sqliteAdapter.getTable('auditLogs') || [];
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      module,
      details,
      severity,
      ipAddress: '127.0.0.1',
    };

    sqliteAdapter.updateTable('auditLogs', [newLog, ...logs].slice(0, 2000));
    loggerService.logInfo(module, `[AUDIT][${action}] ${userName}: ${details}`);
    return newLog;
  }

  public getAuditLogs(filters?: {
    module?: string;
    severity?: SeverityLevel;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): AuditLog[] {
    const logs = sqliteAdapter.getTable('auditLogs') || [];

    return logs.filter((log) => {
      if (filters?.module && filters.module !== 'ALL' && log.module !== filters.module) {
        return false;
      }
      if (filters?.severity && filters.severity !== ('ALL' as any) && log.severity !== filters.severity) {
        return false;
      }
      if (filters?.startDate && log.timestamp < filters.startDate) return false;
      if (filters?.endDate && log.timestamp > filters.endDate) return false;

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q);
        if (!matchesAction && !matchesDetails && !matchesUser) return false;
      }

      return true;
    });
  }

  public clearAuditLogs(): void {
    sqliteAdapter.updateTable('auditLogs', []);
    this.logAction('usr-admin', 'مدير النظام', 'CLEAR_AUDIT_LOGS', 'AUDIT', 'تم مسح سجلات التدقيق والأمان بالكامل');
  }

  public exportAuditLogsAsJson(): string {
    const logs = this.getAuditLogs();
    return JSON.stringify(logs, null, 2);
  }
}

export const auditService = new AuditService();
