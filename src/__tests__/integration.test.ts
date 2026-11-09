import { describe, it, expect, beforeEach } from 'vitest';
import { subscriptionService } from '../services/subscriptionService';
import { geoService } from '../services/geoService';
import { moduleBridgeService } from '../services/moduleBridgeService';
import { sqliteAdapter } from '../db/sqliteAdapter';

describe('System Integration & QA Tests (Subscription, Geo, ModuleBridge)', () => {
  beforeEach(() => {
    sqliteAdapter.resetToDefaults();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  // -------------------------------------------------------------
  // 1. Subscription & License Verification Tests
  // -------------------------------------------------------------
  describe('SubscriptionService Integration Tests', () => {
    it('should validate active license key and bind hardware fingerprint', () => {
      const company = 'شركة القاهرة للتكنولوجيا';
      const today = new Date().toISOString().split('T')[0];
      const hwId = subscriptionService.getHardwareId();

      const key = subscriptionService.generateLicenseKey({
        companyName: company,
        plan: '1_YEAR',
        activationDate: today,
        maxDevices: 15,
        maxEmployees: 1000,
        hardwareId: hwId,
      });

      const activation = subscriptionService.activateLicenseKey(key);
      expect(activation.success).toBe(true);

      const validation = subscriptionService.validateLicense();
      expect(validation.isValid).toBe(true);
      expect(validation.status).toBe('ACTIVE');
      expect(validation.info.companyName).toBe(company);
      expect(validation.info.maxEmployees).toBe(1000);
      expect(validation.info.maxDevices).toBe(15);
      expect(validation.info.hardwareId).toBe(hwId);
    });

    it('should fail license validation when license is expired', () => {
      const key = subscriptionService.generateLicenseKey({
        companyName: 'شركة منتهية الاشتراك',
        plan: '1_MONTH',
        activationDate: '2020-01-01',
        expirationDate: '2020-02-01',
      });

      const activation = subscriptionService.activateLicenseKey(key);
      expect(activation.success).toBe(true);

      const validation = subscriptionService.validateLicense();
      expect(validation.isValid).toBe(false);
      expect(validation.status).toBe('EXPIRED');
      expect(validation.reason).toContain('انتهت فترة تفعيل الترخيص');
    });

    it('should reject license key issued for a different hardware fingerprint', () => {
      const key = subscriptionService.generateLicenseKey({
        companyName: 'شركة النيل',
        plan: '6_MONTHS',
        activationDate: new Date().toISOString().split('T')[0],
        hardwareId: 'HW-OTHER-DEVICE-99999',
      });

      const verification = subscriptionService.verifyLicenseKey(key);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('المفتاح مخصص لجهاز آخر');
    });

    it('should enforce employee and device capacity limits', () => {
      const db = sqliteAdapter.getDatabase();
      db.license.licenseKey = subscriptionService.generateLicenseKey({
        companyName: 'شركة مصر السريعة',
        plan: '1_MONTH',
        activationDate: new Date().toISOString().split('T')[0],
        maxEmployees: 2,
        maxDevices: 1,
      });
      sqliteAdapter.saveDatabase(db);

      // Current count in defaults: employees length > 2
      const empCapacity = subscriptionService.canAddEmployee();
      expect(empCapacity.allowed).toBe(false);
      expect(empCapacity.messageAr).toContain('تجاوزت سعة الباقة المسموحة');

      const validation = subscriptionService.validateLicense();
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('تجاوزت سعة الباقة المسموحة');
    });

    it('should detect anti-clock tampering when system date moves backward', () => {
      const db = sqliteAdapter.getDatabase();
      db.license.lastKnownTime = new Date('2026-08-01T12:00:00Z').toISOString();
      db.license.tampered = false;
      sqliteAdapter.saveDatabase(db);

      // Simulate system clock going back to 2026-01-01
      const clockCheck = subscriptionService.checkAntiClockTampering(new Date('2026-01-01T12:00:00Z'));
      expect(clockCheck.tampered).toBe(true);
      expect(clockCheck.reason).toContain('تم اكتشاف تلاعب بساعة النظام');

      const validation = subscriptionService.validateLicense();
      expect(validation.isValid).toBe(false);
      expect(validation.status).toBe('TAMPERED');
    });
  });

  // -------------------------------------------------------------
  // 2. GeoService GPS & Geofencing Tests
  // -------------------------------------------------------------
  describe('GeoService Integration Tests', () => {
    it('should calculate accurate Haversine distance between two coordinates', () => {
      // Cairo HQ (30.0444, 31.2357) and nearby point (~150m)
      const lat1 = 30.0444;
      const lon1 = 31.2357;
      const lat2 = 30.0455;
      const lon2 = 31.2365;

      const distance = geoService.calculateDistance(lat1, lon1, lat2, lon2);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });

    it('should return isWithin true for employee inside allowed geofence radius', () => {
      const cairoHQ = { lat: 30.0444, lng: 31.2357 };
      // User is 50 meters away
      const userPos = { lat: 30.0448, lng: 31.2357 };

      const result = geoService.validateGeofence(userPos.lat, userPos.lng, cairoHQ.lat, cairoHQ.lng, 200);
      expect(result.isWithin).toBe(true);
      expect(result.messageAr).toContain('بصمة مقبولة: أنت داخل نطاق موقع العمل');
    });

    it('should return isWithin false for employee outside geofence radius', () => {
      const cairoHQ = { lat: 30.0444, lng: 31.2357 };
      // User is ~1.5 km away in Giza
      const userPos = { lat: 30.0550, lng: 31.2200 };

      const result = geoService.validateGeofence(userPos.lat, userPos.lng, cairoHQ.lat, cairoHQ.lng, 200);
      expect(result.isWithin).toBe(false);
      expect(result.messageAr).toContain('خارج نطاق العمل المصرح به');
    });
  });

  // -------------------------------------------------------------
  // 3. ModuleBridgeService Type-Safe Event Bus & Integration Pipeline
  // -------------------------------------------------------------
  describe('ModuleBridgeService Type-Safe Integration Tests', () => {
    it('should publish and receive type-safe events with payload preservation', () => {
      let receivedEventPayload: any = null;

      const unsubscribe = moduleBridgeService.subscribe('ATTENDANCE_PUNCH', (payload) => {
        receivedEventPayload = payload;
      });

      const testRecord = {
        id: 'att-test-1',
        employeeId: 'emp-101',
        employeeCode: '1001',
        employeeName: 'أحمد محمود علي',
        department: 'الإدارة العامة',
        date: '2026-07-26',
        checkIn: '08:00:00',
        lateMinutes: 0,
        overtimeMinutes: 0,
        status: 'PRESENT' as const,
        verificationMethod: 'GPS' as const,
        branchId: 'branch-cairo',
      };

      moduleBridgeService.publish('ATTENDANCE_PUNCH', { record: testRecord, isGeo: true });

      expect(receivedEventPayload).not.toBeNull();
      expect(receivedEventPayload.record.id).toBe('att-test-1');
      expect(receivedEventPayload.isGeo).toBe(true);

      unsubscribe();
    });

    it('should automatically process driver fleet trip logs on driver check-out', () => {
      const db = sqliteAdapter.getDatabase();
      // Ensure emp-101 is marked as driver
      const driverEmp = db.employees.find((e) => e.id === 'emp-101');
      if (driverEmp) {
        driverEmp.isDriver = true;
      }
      sqliteAdapter.saveDatabase(db);

      const driverRecord = {
        id: 'att-driver-1',
        employeeId: 'emp-101',
        employeeCode: '1001',
        employeeName: 'أحمد محمود علي (سائق)',
        department: 'قسم الحركة والأسطول',
        date: '2026-07-26',
        checkIn: '08:00',
        checkOut: '16:00', // 8 hours transit
        lateMinutes: 0,
        overtimeMinutes: 0,
        status: 'PRESENT' as const,
        verificationMethod: 'GPS' as const,
        branchId: 'branch-cairo',
      };

      const tripLog = moduleBridgeService.processDriverFleetIntegration(driverRecord);

      expect(tripLog).not.toBeNull();
      expect(tripLog?.transitHours).toBe(8);
      expect(tripLog?.estimatedDistanceKm).toBe(360); // 8 * 45
      expect(tripLog?.transitAllowance).toBe(480); // 8 * 60 EGP
    });

    it('should generate balanced double-entry payroll journal draft for finance', () => {
      const todayMonth = new Date().toISOString().substring(0, 7);
      const payrollDraft = moduleBridgeService.generateMonthlyPayrollDraft(todayMonth, 'ALL');

      expect(payrollDraft).toBeDefined();
      expect(payrollDraft.periodMonth).toBe(todayMonth);
      expect(payrollDraft.entries.length).toBeGreaterThan(0);

      // Verify double-entry accounting balance (Total Debits === Total Credits)
      let totalDebits = 0;
      let totalCredits = 0;

      payrollDraft.entries.forEach((e) => {
        totalDebits += e.debit;
        totalCredits += e.credit;
      });

      expect(totalDebits).toBe(totalCredits);
      expect(payrollDraft.netPayrollPayable).toBe(totalDebits - payrollDraft.totalAdvanceRepayments - (payrollDraft.totalAbsenceDeductions + payrollDraft.totalLateDeductions));
    });
  });

  // -------------------------------------------------------------
  // 4. Integrated End-to-End Workflow Scenario
  // -------------------------------------------------------------
  describe('Full End-to-End Integration Scenario', () => {
    it('should execute end-to-end flow: License Check -> Geofence Validation -> Punch -> Driver Fleet Sync -> Financial Journal Generation', () => {
      // Step A: Check license validity & capacity
      const licenseValidation = subscriptionService.validateLicense();
      expect(licenseValidation.isValid).toBe(true);

      // Step B: Geofence validation for GPS punch
      const cairoHQ = { lat: 30.0444, lng: 31.2357 };
      const userLocation = { lat: 30.0445, lng: 31.2358 }; // 20m from HQ
      const geoResult = geoService.validateGeofence(
        userLocation.lat,
        userLocation.lng,
        cairoHQ.lat,
        cairoHQ.lng,
        150
      );
      expect(geoResult.isWithin).toBe(true);

      // Ensure emp-101 is marked as driver and assigned to branch-cairo in DB
      const db = sqliteAdapter.getDatabase();
      const driverEmp = db.employees.find((e) => e.id === 'emp-101');
      if (driverEmp) {
        driverEmp.isDriver = true;
        driverEmp.branchId = 'branch-cairo';
      }
      sqliteAdapter.saveDatabase(db);

      // Step C: Record punch & publish to event bus
      let fleetEventReceived = false;
      moduleBridgeService.subscribe('ATTENDANCE_PUNCH', (payload) => {
        if (payload.record.employeeId === 'emp-101') {
          fleetEventReceived = true;
        }
      });

      const punchRecord = {
        id: 'e2e-punch-1',
        employeeId: 'emp-101',
        employeeCode: '1001',
        employeeName: 'أحمد محمود علي',
        department: 'قسم الحركة والأسطول',
        date: new Date().toISOString().split('T')[0],
        checkIn: '08:00',
        checkOut: '17:00', // 9 hours
        lateMinutes: 0,
        overtimeMinutes: 60,
        status: 'PRESENT' as const,
        verificationMethod: 'GPS' as const,
        branchId: 'branch-cairo',
      };

      moduleBridgeService.publish('ATTENDANCE_PUNCH', { record: punchRecord, isGeo: true });
      expect(fleetEventReceived).toBe(true);

      // Step D: Verify fleet log was created automatically
      const fleetLogs = sqliteAdapter.getTable('driverTripLogs') || [];
      const empTrip = fleetLogs.find((t) => t.driverEmployeeId === 'emp-101');
      expect(empTrip).toBeDefined();
      expect(empTrip?.transitHours).toBe(9);

      // Step E: Trigger Monthly Payroll Accounting Draft
      const monthStr = new Date().toISOString().substring(0, 7);
      const payrollDraft = moduleBridgeService.generateMonthlyPayrollDraft(monthStr, 'branch-cairo');

      expect(payrollDraft.branchId).toBe('branch-cairo');
      expect(payrollDraft.status).toBe('DRAFT');
      expect(payrollDraft.netPayrollPayable).toBeGreaterThan(0);
    });
  });
});
