import CryptoJS from 'crypto-js';
import {
  SubscriptionInfo,
  SubscriptionPlan,
  SubscriptionStatus
} from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from './loggerService';
import { fingerprintService } from './fingerprintService';

const LICENSE_SECRET_KEY = 'AS_SOLUTION_SECRET_LICENSE_KEY_2026_EGYPT';

interface LicensePayload {
  companyName: string;
  plan: SubscriptionPlan;
  activationDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  maxDevices: number;
  maxEmployees: number;
  hardwareId: string;
  issuedAt: string;
}

class SubscriptionService {
  private checkIntervalTimer: any = null;

  constructor() {
    this.startClockMonitoring();
  }

  public getHardwareId(): string {
    let hwId = localStorage.getItem('as_hardware_signature');
    if (!hwId) {
      hwId = fingerprintService.getHardwareFingerprint();
      localStorage.setItem('as_hardware_signature', hwId);
    }
    return hwId;
  }

  public canAddEmployee(): { allowed: boolean; currentCount: number; maxCount: number; messageAr: string } {
    const info = this.getSubscriptionInfo();
    const employees = sqliteAdapter.getTable('employees') || [];
    const currentCount = employees.length;
    const maxCount = info.maxEmployees || 500;
    const allowed = currentCount < maxCount;

    return {
      allowed,
      currentCount,
      maxCount,
      messageAr: allowed
        ? `السعة متاحة (${currentCount}/${maxCount} موظف)`
        : `تجاوزت سعة الباقة المسموحة! عدد الموظفين الحالية (${currentCount}) والحد الأقصى للمستنفدين بالترخيص هو (${maxCount}). يرجى ترقية الاشتراك.`,
    };
  }

  public canAddDevice(): { allowed: boolean; currentCount: number; maxCount: number; messageAr: string } {
    const info = this.getSubscriptionInfo();
    const devices = sqliteAdapter.getTable('devices') || [];
    const currentCount = devices.length;
    const maxCount = info.maxDevices || 10;
    const allowed = currentCount < maxCount;

    return {
      allowed,
      currentCount,
      maxCount,
      messageAr: allowed
        ? `سعة الأجهزة متاحة (${currentCount}/${maxCount} جهاز)`
        : `تجاوزت الحد الأقصى لأجهزة البصمة المسموح بها بترخيصك (${currentCount}/${maxCount}). يرجى ترقية باقة التفعيل.`,
    };
  }

  public generateQRLicensePayload(key: string): string {
    const payload = {
      app: 'AS_SOLUTION_ERP',
      key,
      generatedAt: new Date().toISOString(),
      hw: this.getHardwareId(),
    };
    return btoa(JSON.stringify(payload));
  }

  public activateFromQRPayload(qrData: string): { success: boolean; message: string; info?: SubscriptionInfo } {
    try {
      const decodedStr = atob(qrData.trim());
      const parsed = JSON.parse(decodedStr);
      if (parsed.key) {
        return this.activateLicenseKey(parsed.key);
      }
      return { success: false, message: 'بيانات كود الـ QR غير متعرفة كرمز تفعيل صحيح' };
    } catch (e) {
      // Fallback try raw text string as key directly
      return this.activateLicenseKey(qrData.trim());
    }
  }

  public getPlanNameAr(plan: SubscriptionPlan, customDays?: number): string {
    switch (plan) {
      case '1_MONTH':
        return 'شهر واحد (1 Month)';
      case '2_MONTHS':
        return 'شهرين (2 Months)';
      case '3_MONTHS':
        return '3 أشهر (3 Months)';
      case '6_MONTHS':
        return '6 أشهر (6 Months)';
      case '1_YEAR':
        return 'سنة كاملة (12 Month)';
      case 'CUSTOM':
        return `فترة مخصصة (${customDays || 30} يوم)`;
      default:
        return 'اشتراك مخصص';
    }
  }

  public calculateExpirationDate(activationDateStr: string, plan: SubscriptionPlan, customDays = 30): string {
    const date = new Date(activationDateStr);
    switch (plan) {
      case '1_MONTH':
        date.setMonth(date.getMonth() + 1);
        break;
      case '2_MONTHS':
        date.setMonth(date.getMonth() + 2);
        break;
      case '3_MONTHS':
        date.setMonth(date.getMonth() + 3);
        break;
      case '6_MONTHS':
        date.setMonth(date.getMonth() + 6);
        break;
      case '1_YEAR':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'CUSTOM':
        date.setDate(date.getDate() + customDays);
        break;
    }
    return date.toISOString().split('T')[0];
  }

  public generateLicenseKey(payload: {
    companyName: string;
    plan: SubscriptionPlan;
    activationDate: string; // YYYY-MM-DD
    expirationDate?: string;
    customDays?: number;
    maxDevices?: number;
    maxEmployees?: number;
    hardwareId?: string;
  }): string {
    const expDate =
      payload.expirationDate ||
      this.calculateExpirationDate(payload.activationDate, payload.plan, payload.customDays || 30);

    const fullPayload: LicensePayload = {
      companyName: payload.companyName,
      plan: payload.plan,
      activationDate: payload.activationDate,
      expirationDate: expDate,
      maxDevices: payload.maxDevices || 10,
      maxEmployees: payload.maxEmployees || 500,
      hardwareId: payload.hardwareId || 'ALL_HARDWARE',
      issuedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(fullPayload);
    const encrypted = CryptoJS.AES.encrypt(jsonString, LICENSE_SECRET_KEY).toString();
    const signature = CryptoJS.HmacSHA256(encrypted, LICENSE_SECRET_KEY).toString().substring(0, 8).toUpperCase();

    // Format as readable license key AS-LIC-XXXXX-XXXXX
    const key = `AS-LIC-${encrypted}.${signature}`;
    return key;
  }

  public verifyLicenseKey(key: string): { valid: boolean; payload?: LicensePayload; error?: string } {
    if (!key || !key.startsWith('AS-LIC-')) {
      return { valid: false, error: 'مفتاح التفعيل غير صلب أو غير صحيح البنية' };
    }

    try {
      const parts = key.replace('AS-LIC-', '').split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'صيغة مفتاح الترخيص غير متوافقة' };
      }

      const [encryptedPayload, signature] = parts;
      const expectedSignature = CryptoJS.HmacSHA256(encryptedPayload, LICENSE_SECRET_KEY)
        .toString()
        .substring(0, 8)
        .toUpperCase();

      if (signature !== expectedSignature) {
        return { valid: false, error: 'التوقيع الرقمي للمفتاح غير صالح أو تم التلاعب به' };
      }

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, LICENSE_SECRET_KEY);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        return { valid: false, error: 'فشل فك تشفير بيانات الترخيص' };
      }

      const payload: LicensePayload = JSON.parse(decryptedString);

      // Verify Hardware binding if not wildcard
      const currentHwId = this.getHardwareId();
      if (payload.hardwareId !== 'ALL_HARDWARE' && payload.hardwareId !== currentHwId) {
        return { valid: false, error: `المفتاح مخصص لجهاز آخر (Hardware ID: ${payload.hardwareId})` };
      }

      return { valid: true, payload };
    } catch (e: any) {
      return { valid: false, error: `خطأ في تحليل الترخيص: ${e?.message || 'كود غير معتمد'}` };
    }
  }

  public checkAntiClockTampering(currentDate: Date): { tampered: boolean; reason?: string } {
    try {
      const db = sqliteAdapter.getDatabase();
      const licenseState = db.license || { licenseKey: '', lastKnownTime: '', tampered: false };

      if (licenseState.tampered) {
        return {
          tampered: true,
          reason: 'تم قفل النظام سابقاً بسبب التلاعب بساعة الجهاز. يرجى إدخال ترخيص جديد لإلغاء القفل.',
        };
      }

      const nowMs = currentDate.getTime();
      const lastKnownMs = licenseState.lastKnownTime ? new Date(licenseState.lastKnownTime).getTime() : 0;

      // Allow a 3 minute clock drift grace margin
      const ALLOWED_MARGIN_MS = 3 * 60 * 1000;

      if (lastKnownMs > 0 && nowMs < lastKnownMs - ALLOWED_MARGIN_MS) {
        const reason = `تم اكتشاف تلاعب بساعة النظام! الوقت الحالي (${currentDate.toLocaleString('ar-EG')}) أقدم من آخر استخدام مسجل (${new Date(lastKnownMs).toLocaleString('ar-EG')}).`;

        // Flag tampered in database
        db.license.tampered = true;
        sqliteAdapter.saveDatabase(db);

        loggerService.logCritical('SUBSCRIPTION', reason);

        return { tampered: true, reason };
      }

      // Update last known timestamp if current time is forward
      if (nowMs > lastKnownMs) {
        db.license.lastKnownTime = currentDate.toISOString();
        sqliteAdapter.saveDatabase(db);
      }

      return { tampered: false };
    } catch (e) {
      return { tampered: false };
    }
  }

  public getSubscriptionInfo(): SubscriptionInfo {
    const hwId = this.getHardwareId();
    const db = sqliteAdapter.getDatabase();
    const licenseState = db.license || { licenseKey: '', lastKnownTime: '', tampered: false };

    const now = new Date();
    const clockCheck = this.checkAntiClockTampering(now);

    if (clockCheck.tampered) {
      return {
        status: 'TAMPERED',
        plan: 'CUSTOM',
        planNameAr: 'مقفل بسبب التلاعب بالساعة',
        companyName: db.settings.companyName || 'مؤسسة أيه إس',
        licenseKey: licenseState.licenseKey || '',
        activationDate: '-',
        expirationDate: '-',
        daysRemaining: 0,
        maxDevices: 0,
        maxEmployees: 0,
        hardwareId: hwId,
        tamperedReason: clockCheck.reason,
      };
    }

    if (!licenseState.licenseKey) {
      // Return un-licensed state or auto-generate a 30-day demo license if clean initial run
      const demoKey = this.generateDemoLicenseKey(db.settings.companyName || 'AS Solution Customer');
      db.license.licenseKey = demoKey;
      sqliteAdapter.saveDatabase(db);
      return this.getSubscriptionInfo();
    }

    const verification = this.verifyLicenseKey(licenseState.licenseKey);

    if (!verification.valid || !verification.payload) {
      return {
        status: 'UNLICENSED',
        plan: 'CUSTOM',
        planNameAr: 'غير مرخص',
        companyName: db.settings.companyName || 'مؤسسة أيه إس',
        licenseKey: licenseState.licenseKey,
        activationDate: '-',
        expirationDate: '-',
        daysRemaining: 0,
        maxDevices: 0,
        maxEmployees: 0,
        hardwareId: hwId,
        tamperedReason: verification.error || 'رمز الترخيص غير صالح',
      };
    }

    const payload = verification.payload;
    const expDate = new Date(payload.expirationDate + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = expDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: SubscriptionStatus = 'ACTIVE';
    if (daysRemaining < 0) {
      status = 'EXPIRED';
    } else if (daysRemaining <= 7) {
      status = 'WARNING';
    }

    return {
      status,
      plan: payload.plan,
      planNameAr: this.getPlanNameAr(payload.plan),
      companyName: payload.companyName,
      licenseKey: licenseState.licenseKey,
      activationDate: payload.activationDate,
      expirationDate: payload.expirationDate,
      daysRemaining: Math.max(0, daysRemaining),
      maxDevices: payload.maxDevices,
      maxEmployees: payload.maxEmployees,
      hardwareId: hwId,
    };
  }

  public validateLicense(): {
    isValid: boolean;
    status: SubscriptionStatus;
    reason?: string;
    info: SubscriptionInfo;
    capacity: {
      employeeCapacity: { allowed: boolean; currentCount: number; maxCount: number; messageAr: string };
      deviceCapacity: { allowed: boolean; currentCount: number; maxCount: number; messageAr: string };
    };
  } {
    const info = this.getSubscriptionInfo();
    const empCap = this.canAddEmployee();
    const devCap = this.canAddDevice();

    if (info.status === 'TAMPERED') {
      return {
        isValid: false,
        status: 'TAMPERED',
        reason: info.tamperedReason || 'تم اكتشاف تلاعب بساعة الجهاز وتوقف النظام.',
        info,
        capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
      };
    }

    if (info.status === 'UNLICENSED') {
      return {
        isValid: false,
        status: 'UNLICENSED',
        reason: info.tamperedReason || 'الترخيص غير صالح أو غير معتمد.',
        info,
        capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
      };
    }

    if (info.status === 'EXPIRED') {
      return {
        isValid: false,
        status: 'EXPIRED',
        reason: `انتهت فترة تفعيل الترخيص بتاريخ ${info.expirationDate}. يرجى التجديد.`,
        info,
        capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
      };
    }

    if (!empCap.allowed) {
      return {
        isValid: false,
        status: info.status,
        reason: empCap.messageAr,
        info,
        capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
      };
    }

    if (!devCap.allowed) {
      return {
        isValid: false,
        status: info.status,
        reason: devCap.messageAr,
        info,
        capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
      };
    }

    return {
      isValid: true,
      status: info.status,
      info,
      capacity: { employeeCapacity: empCap, deviceCapacity: devCap },
    };
  }

  private generateDemoLicenseKey(companyName: string): string {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.generateLicenseKey({
      companyName,
      plan: '1_MONTH',
      activationDate: todayStr,
      customDays: 30,
      maxDevices: 10,
      maxEmployees: 500,
    });
  }

  public activateLicenseKey(key: string): { success: boolean; message: string; info?: SubscriptionInfo } {
    const verification = this.verifyLicenseKey(key);
    if (!verification.valid || !verification.payload) {
      loggerService.logWarn('SUBSCRIPTION', `فشل تفعيل الترخيص: ${verification.error}`);
      return {
        success: false,
        message: verification.error || 'كود الترخيص غير صالح',
      };
    }

    const db = sqliteAdapter.getDatabase();
    db.license = {
      licenseKey: key,
      lastKnownTime: new Date().toISOString(),
      tampered: false,
    };
    sqliteAdapter.saveDatabase(db);

    loggerService.logInfo(
      'SUBSCRIPTION',
      `تم تفعيل اشتراك جديد بنجاح للشركة: ${verification.payload.companyName} لمدة: ${verification.payload.plan}`
    );

    const info = this.getSubscriptionInfo();
    return {
      success: true,
      message: `تم تفعيل الاشتراك بنجاح للشركة (${verification.payload.companyName}). ينتهي الاشتراك في: ${verification.payload.expirationDate}`,
      info,
    };
  }

  private startClockMonitoring(): void {
    if (typeof window !== 'undefined' && !this.checkIntervalTimer) {
      this.checkIntervalTimer = setInterval(() => {
        this.getSubscriptionInfo();
      }, 15000);
    }
  }
}

export const subscriptionService = new SubscriptionService();
