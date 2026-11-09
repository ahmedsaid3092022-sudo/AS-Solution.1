import { describe, it, expect, beforeEach } from 'vitest';
import { auditService } from '../services/auditService';
import { sqliteAdapter } from '../db/sqliteAdapter';

describe('AuditService Unit Tests', () => {
  beforeEach(() => {
    sqliteAdapter.resetToDefaults();
  });

  it('should log audit actions with correct metadata and severity', () => {
    const log = auditService.logAction(
      'usr-1',
      'أحمد المراجع',
      'CREATE_EMPLOYEE',
      'EMPLOYEES',
      'تم إضافة الموظف الجديد علي حسن',
      'INFO'
    );

    expect(log.id).toBeDefined();
    expect(log.userName).toBe('أحمد المراجع');
    expect(log.action).toBe('CREATE_EMPLOYEE');
    expect(log.severity).toBe('INFO');
  });

  it('should filter audit logs by module and severity', () => {
    auditService.logAction('usr-1', 'مدير 1', 'DELETE_RECORD', 'DATABASE', 'حذف سجل حضور', 'WARN');
    auditService.logAction('usr-2', 'مدير 2', 'LOGIN_FAIL', 'AUTH', 'محاولة محظورة', 'ERROR');

    const errorLogs = auditService.getAuditLogs({ severity: 'ERROR' });
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0].severity).toBe('ERROR');

    const authLogs = auditService.getAuditLogs({ module: 'AUTH' });
    expect(authLogs.length).toBeGreaterThanOrEqual(1);
    expect(authLogs[0].module).toBe('AUTH');
  });

  it('should search audit logs by query keyword', () => {
    auditService.logAction('usr-99', 'سامي', 'UPDATE_SHIFT', 'SETTINGS', 'تغيير مواعيد دوام رمضان', 'INFO');

    const searchResults = auditService.getAuditLogs({ search: 'رمضان' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].details).toContain('رمضان');
  });
});
