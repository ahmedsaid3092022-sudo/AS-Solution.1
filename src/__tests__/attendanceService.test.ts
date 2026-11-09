import { describe, it, expect, beforeEach } from 'vitest';
import { attendanceService } from '../services/attendanceService';
import { sqliteAdapter } from '../db/sqliteAdapter';

describe('AttendanceService Unit Tests', () => {
  beforeEach(() => {
    sqliteAdapter.resetToDefaults();
  });

  it('should calculate late minutes correctly for check-in after grace period', () => {
    // Work start 08:00, grace period 15 mins -> 08:15 is okay, 08:25 is 25 mins late
    const result = attendanceService.calculateLateAndOvertime('08:25', '16:00', '08:00', '16:00', 15);
    expect(result.status).toBe('LATE');
    expect(result.lateMinutes).toBe(25);
  });

  it('should calculate present status without late minutes if check-in within grace period', () => {
    const result = attendanceService.calculateLateAndOvertime('08:10', '16:00', '08:00', '16:00', 15);
    expect(result.status).toBe('PRESENT');
    expect(result.lateMinutes).toBe(0);
  });

  it('should calculate overtime minutes correctly if check-out is after work end time', () => {
    const result = attendanceService.calculateLateAndOvertime('08:00', '17:30', '08:00', '16:00', 15);
    expect(result.status).toBe('PRESENT');
    expect(result.overtimeMinutes).toBe(90);
  });

  it('should record new check-in for an existing employee', () => {
    const record = attendanceService.recordCheckInOrOut('1001', 'CHECK_IN', '07:55:00');
    expect(record).toBeDefined();
    expect(record.employeeCode).toBe('1001');
    expect(record.checkIn).toBe('07:55:00');
  });

  it('should get today attendance summary correctly', () => {
    const summary = attendanceService.getTodaySummary();
    expect(summary.totalEmployees).toBeGreaterThan(0);
    expect(summary.presentCount + summary.lateCount + summary.absentCount + summary.earlyExitCount).toBe(
      summary.totalEmployees
    );
  });

  it('should register exit reason and mark attendance as EARLY_EXIT', () => {
    const exitReason = attendanceService.addExitReason({
      employeeId: 'emp-101',
      employeeName: 'أحمد محمود علي',
      date: new Date().toISOString().split('T')[0],
      departureTime: '14:00',
      reason: 'عذر طبي طارئ',
      approvedBy: 'مدير الموارد البشرية',
    });

    expect(exitReason.id).toBeDefined();
    expect(exitReason.reason).toBe('عذر طبي طارئ');
  });
});
