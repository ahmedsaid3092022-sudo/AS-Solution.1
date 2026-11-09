import { AttendanceRecord, AttendanceStatus, ExitReasonRecord, GeoPunchLocation } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from './loggerService';
import { geoService } from './geoService';
import { moduleBridgeService } from './moduleBridgeService';

class AttendanceService {
  public getAttendanceRecords(filters?: {
    date?: string;
    department?: string;
    status?: AttendanceStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    branchId?: string;
  }): AttendanceRecord[] {
    const records = sqliteAdapter.getTable('attendance') || [];

    return records.filter((r) => {
      if (filters?.date && r.date !== filters.date) return false;

      if (filters?.startDate && r.date < filters.startDate) return false;
      if (filters?.endDate && r.date > filters.endDate) return false;

      if (filters?.department && filters.department !== 'ALL' && r.department !== filters.department) {
        return false;
      }

      if (filters?.status && filters.status !== ('ALL' as any) && r.status !== filters.status) {
        return false;
      }

      if (filters?.branchId && filters.branchId !== 'ALL' && r.branchId && r.branchId !== filters.branchId) {
        return false;
      }

      if (filters?.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = r.employeeName.toLowerCase().includes(query);
        const matchesCode = r.employeeCode.toLowerCase().includes(query);
        const matchesDept = r.department.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }

      return true;
    });
  }

  public calculateLateAndOvertime(
    checkIn?: string,
    checkOut?: string,
    workStartTime = '08:00',
    workEndTime = '16:00',
    gracePeriodMinutes = 15
  ): {
    lateMinutes: number;
    overtimeMinutes: number;
    nightBonusMinutes: number;
    isCrossMidnight: boolean;
    status: AttendanceStatus;
  } {
    let lateMinutes = 0;
    let overtimeMinutes = 0;
    let nightBonusMinutes = 0;
    let isCrossMidnight = false;
    let status: AttendanceStatus = 'PRESENT';

    if (!checkIn) {
      return { lateMinutes: 0, overtimeMinutes: 0, nightBonusMinutes: 0, isCrossMidnight: false, status: 'ABSENT' };
    }

    const [startH, startM] = workStartTime.split(':').map(Number);
    const [endH, endM] = workEndTime.split(':').map(Number);

    let startMinsTotal = startH * 60 + startM;
    let endMinsTotal = endH * 60 + endM;

    if (endMinsTotal < startMinsTotal) {
      isCrossMidnight = true;
      endMinsTotal += 24 * 60;
    }

    const [inH, inM] = checkIn.split(':').map(Number);
    let checkInTotalMins = inH * 60 + inM;

    if (isCrossMidnight && checkInTotalMins < startMinsTotal - 180) {
      checkInTotalMins += 24 * 60;
    }

    if (checkInTotalMins > startMinsTotal + gracePeriodMinutes) {
      lateMinutes = checkInTotalMins - startMinsTotal;
      status = 'LATE';
    }

    if (checkOut) {
      const [outH, outM] = checkOut.split(':').map(Number);
      let checkOutTotalMins = outH * 60 + outM;

      if (isCrossMidnight && checkOutTotalMins < startMinsTotal - 180) {
        checkOutTotalMins += 24 * 60;
      }

      if (checkOutTotalMins < endMinsTotal - 10) {
        status = 'EARLY_EXIT';
      } else if (checkOutTotalMins > endMinsTotal + 15) {
        overtimeMinutes = checkOutTotalMins - endMinsTotal;
      }

      const durationMins = checkOutTotalMins - checkInTotalMins;
      if (isCrossMidnight || inH >= 22 || inH < 6 || outH >= 22 || outH < 6) {
        nightBonusMinutes = Math.min(Math.max(0, durationMins), 480);
      }
    }

    return { lateMinutes, overtimeMinutes, nightBonusMinutes, isCrossMidnight, status };
  }

  public recordCheckInOrOut(
    employeeId: string,
    type: 'CHECK_IN' | 'CHECK_OUT',
    timeStr: string,
    deviceId?: string,
    geoPunch?: GeoPunchLocation
  ): AttendanceRecord {
    const employees = sqliteAdapter.getTable('employees');
    const emp = employees.find((e) => e.id === employeeId || e.code === employeeId || e.biometricId === employeeId);

    if (!emp) {
      throw new Error(`الموظف برقم (${employeeId}) غير موجود في قاعدة البيانات`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const settings = sqliteAdapter.getTable('settings');
    const shifts = sqliteAdapter.getTable('shifts') || [];
    const records = sqliteAdapter.getTable('attendance') || [];

    const empShift = shifts.find((s) => s.id === emp.shiftId) || shifts.find((s) => s.isDefault) || shifts[0];
    const startTime = empShift ? empShift.startTime : settings.workStartTime;
    const endTime = empShift ? empShift.endTime : settings.workEndTime;
    const graceMinutes = empShift ? empShift.gracePeriodMinutes : settings.gracePeriodMinutes;

    let existingRecord = records.find((r) => r.employeeId === emp.id && r.date === todayStr);

    if (existingRecord) {
      if (type === 'CHECK_IN') {
        existingRecord.checkIn = timeStr;
      } else {
        existingRecord.checkOut = timeStr;
      }

      const calc = this.calculateLateAndOvertime(
        existingRecord.checkIn,
        existingRecord.checkOut,
        startTime,
        endTime,
        graceMinutes
      );

      existingRecord.lateMinutes = calc.lateMinutes;
      existingRecord.overtimeMinutes = calc.overtimeMinutes;
      existingRecord.nightBonusMinutes = calc.nightBonusMinutes;
      existingRecord.isCrossMidnight = calc.isCrossMidnight;
      existingRecord.status = calc.status;
      existingRecord.shiftId = empShift?.id;
      existingRecord.shiftName = empShift?.name;
      existingRecord.branchId = emp.branchId;
      if (deviceId) existingRecord.deviceId = deviceId;
      if (geoPunch) existingRecord.geoPunch = geoPunch;

      sqliteAdapter.updateTable('attendance', records);
      loggerService.logInfo('ATTENDANCE', `تم تحديث سجل (${type}) للموظف ${emp.name} في ${timeStr}`);

      moduleBridgeService.publish('ATTENDANCE_PUNCH', { record: existingRecord, isGeo: !!geoPunch });
      return existingRecord;
    } else {
      const calc = this.calculateLateAndOvertime(
        type === 'CHECK_IN' ? timeStr : undefined,
        type === 'CHECK_OUT' ? timeStr : undefined,
        startTime,
        endTime,
        graceMinutes
      );

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: emp.name,
        department: emp.department,
        date: todayStr,
        checkIn: type === 'CHECK_IN' ? timeStr : undefined,
        checkOut: type === 'CHECK_OUT' ? timeStr : undefined,
        lateMinutes: calc.lateMinutes,
        overtimeMinutes: calc.overtimeMinutes,
        nightBonusMinutes: calc.nightBonusMinutes,
        isCrossMidnight: calc.isCrossMidnight,
        status: calc.status,
        deviceId: deviceId || 'dev-1',
        shiftId: empShift?.id,
        shiftName: empShift?.name,
        branchId: emp.branchId,
        geoPunch,
      };

      sqliteAdapter.updateTable('attendance', [newRecord, ...records]);
      loggerService.logInfo('ATTENDANCE', `تم تسجيل (${type}) للموظف ${emp.name} الساعة ${timeStr}`);

      moduleBridgeService.publish('ATTENDANCE_PUNCH', { record: newRecord, isGeo: !!geoPunch });
      return newRecord;
    }
  }

  public async recordMobilePunchWithGPS(
    employeeId: string,
    type: 'CHECK_IN' | 'CHECK_OUT',
    timeStr: string,
    userLat: number,
    userLng: number
  ): Promise<{ record: AttendanceRecord; geoResult: ReturnType<typeof geoService.validateGeofence> }> {
    const employees = sqliteAdapter.getTable('employees');
    const emp = employees.find((e) => e.id === employeeId || e.code === employeeId);
    if (!emp) {
      throw new Error(`الموظف غير موجود`);
    }

    const branches = sqliteAdapter.getTable('branches') || [];
    const settings = sqliteAdapter.getTable('settings');
    const empBranch = branches.find((b) => b.id === emp.branchId) || branches[0];

    const targetLat = empBranch?.latitude ?? settings.mainBranchLat ?? 30.0444;
    const targetLng = empBranch?.longitude ?? settings.mainBranchLng ?? 31.2357;
    const allowedRadius = empBranch?.radiusMeters ?? settings.mainBranchRadiusMeters ?? 200;

    const geoResult = geoService.validateGeofence(userLat, userLng, targetLat, targetLng, allowedRadius);

    const geoPunch: GeoPunchLocation = {
      latitude: userLat,
      longitude: userLng,
      isWithinGeofence: geoResult.isWithin,
      distanceMeters: geoResult.distanceMeters,
      allowedRadiusMeters: allowedRadius,
      siteName: empBranch?.nameAr || 'المقر الرئيسي',
    };

    const record = this.recordCheckInOrOut(emp.id, type, timeStr, 'dev-mobile-gps', geoPunch);
    return { record, geoResult };
  }

  public getTodaySummary(): {
    totalEmployees: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    earlyExitCount: number;
    attendancePercentage: number;
  } {
    const todayStr = new Date().toISOString().split('T')[0];
    const employees = sqliteAdapter.getTable('employees').filter((e) => e.status === 'ACTIVE');
    const todayRecords = this.getAttendanceRecords({ date: todayStr });

    const totalEmployees = employees.length;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let earlyExitCount = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'LATE') lateCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'EARLY_EXIT') earlyExitCount++;
    });

    // Unrecorded active employees default to ABSENT
    const recordedIds = new Set(todayRecords.map((r) => r.employeeId));
    const unrecordedCount = employees.filter((e) => !recordedIds.has(e.id)).length;
    absentCount += unrecordedCount;

    const actualPresent = presentCount + lateCount + earlyExitCount;
    const attendancePercentage = totalEmployees > 0 ? Math.round((actualPresent / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      presentCount,
      lateCount,
      absentCount,
      earlyExitCount,
      attendancePercentage,
    };
  }

  public getExitReasons(date?: string): ExitReasonRecord[] {
    const reasons = sqliteAdapter.getTable('exitReasons') || [];
    if (date) {
      return reasons.filter((ex) => ex.date === date);
    }
    return reasons;
  }

  public addExitReason(record: Omit<ExitReasonRecord, 'id'>): ExitReasonRecord {
    const reasons = sqliteAdapter.getTable('exitReasons') || [];
    const newReason: ExitReasonRecord = {
      ...record,
      id: `ex-${Date.now()}`,
    };

    sqliteAdapter.updateTable('exitReasons', [newReason, ...reasons]);

    // Also update attendance record status to EARLY_EXIT if matching today's record
    const attendance = sqliteAdapter.getTable('attendance') || [];
    const attRec = attendance.find((a) => a.employeeId === record.employeeId && a.date === record.date);

    if (attRec) {
      attRec.status = 'EARLY_EXIT';
      attRec.exitReason = record.reason;
      sqliteAdapter.updateTable('attendance', attendance);
    }

    loggerService.logInfo('ATTENDANCE', `تم تسجيل إذن خروج للموظف ${record.employeeName}: ${record.reason}`);
    return newReason;
  }
}

export const attendanceService = new AttendanceService();
