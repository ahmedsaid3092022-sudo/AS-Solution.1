import CryptoJS from 'crypto-js';
import { BackupMetadata, DatabaseTables } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from './loggerService';

const BACKUP_HISTORY_KEY = 'as_solution_backup_history_v1';
const DEFAULT_ENCRYPTION_KEY = 'AS_SOLUTION_BACKUP_SECURE_KEY_2026';

export interface BackupPackage {
  version: string;
  databaseName: string;
  createdAt: string;
  appVersion: string;
  note?: string;
  encrypted: boolean;
  checksum: string;
  data: string | DatabaseTables; // Raw string if encrypted, or DatabaseTables object
}

class BackupService {
  private autoBackupTimer: any = null;

  constructor() {
    this.initAutoBackupSchedule();
  }

  private calculateChecksum(dataObj: any): string {
    const json = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
    return CryptoJS.SHA256(json).toString().toUpperCase();
  }

  public getBackupHistory(): BackupMetadata[] {
    try {
      const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveBackupHistory(history: BackupMetadata[]): void {
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
  }

  public createBackup(note?: string, passphrase?: string): { success: boolean; backupPackage: BackupPackage; metadata: BackupMetadata } {
    try {
      const currentDb = sqliteAdapter.getDatabase();
      const createdAt = new Date().toISOString();
      const rawChecksum = this.calculateChecksum(currentDb);

      let payloadData: string | DatabaseTables = currentDb;
      let isEncrypted = false;

      const secretKey = passphrase || DEFAULT_ENCRYPTION_KEY;
      if (passphrase) {
        const dbJson = JSON.stringify(currentDb);
        payloadData = CryptoJS.AES.encrypt(dbJson, secretKey).toString();
        isEncrypted = true;
      }

      const backupPkg: BackupPackage = {
        version: '1.0',
        databaseName: 'as_solution.db',
        createdAt,
        appVersion: '2.5.0',
        note: note || 'نسخة احتياطية تلقائية لقاعدة البيانات',
        encrypted: isEncrypted,
        checksum: rawChecksum,
        data: payloadData,
      };

      const pkgJson = JSON.stringify(backupPkg);
      const blobSize = new Blob([pkgJson]).size;
      const formattedSize = (blobSize / 1024).toFixed(2) + ' KB';

      const metadata: BackupMetadata = {
        id: `bkp-${Date.now()}`,
        timestamp: createdAt,
        fileName: `as_solution_db_backup_${createdAt.split('T')[0]}_${Date.now().toString().slice(-4)}.asbak`,
        fileSize: formattedSize,
        tablesCount: {
          employees: currentDb.employees.length,
          attendance: currentDb.attendance.length,
          exitReasons: currentDb.exitReasons.length,
          devices: currentDb.devices.length,
          auditLogs: currentDb.auditLogs.length,
          settings: 1,
        },
        checksum: rawChecksum,
        encrypted: isEncrypted,
        note: note || 'نسخة احتياطية',
      };

      // Add to local history
      const history = this.getBackupHistory();
      this.saveBackupHistory([metadata, ...history].slice(0, 50));

      loggerService.logInfo(
        'BACKUP',
        `تم إنشاء نسخة احتياطية جديدة لقاعدة البيانات (as_solution.db) بحجم ${formattedSize}`
      );

      return { success: true, backupPackage: backupPkg, metadata };
    } catch (e: any) {
      loggerService.logError('BACKUP', 'فشل في إنشاء النسخة الاحتياطية', e?.stack);
      throw new Error(`فشل إنشاء النسخة الاحتياطية: ${e?.message || e}`);
    }
  }

  public downloadBackupFile(note?: string, passphrase?: string): void {
    const { backupPackage, metadata } = this.createBackup(note, passphrase);
    const content = JSON.stringify(backupPackage, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public restoreBackup(
    backupJsonString: string,
    passphrase?: string
  ): { success: boolean; message: string; restoredTablesCount?: Record<string, number> } {
    try {
      if (!backupJsonString) {
        return { success: false, message: 'ملف النسخة الاحتياطية فارغ' };
      }

      let backupPkg: BackupPackage;
      try {
        backupPkg = JSON.parse(backupJsonString);
      } catch (err) {
        return { success: false, message: 'صيغة ملف النسخة الاحتياطية غير صالحة (JSON غير مكرر)' };
      }

      if (!backupPkg.version || !backupPkg.data) {
        return { success: false, message: 'الملف المرفق ليس ملف نسخة احتياطية معتمد لبرنامج أيه إس (AS Solution)' };
      }

      let restoredDb: DatabaseTables;

      if (backupPkg.encrypted) {
        const key = passphrase || DEFAULT_ENCRYPTION_KEY;
        try {
          const decryptedBytes = CryptoJS.AES.decrypt(backupPkg.data as string, key);
          const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedJson) {
            return { success: false, message: 'كلمة المرور الخاصة بفك تشفير النسخة الاحتياطية غير صحيحة' };
          }
          restoredDb = JSON.parse(decryptedJson);
        } catch (e) {
          return { success: false, message: 'فشل فك تشفير النسخة الاحتياطية. يرجى التأكد من كلمة المرور' };
        }
      } else {
        restoredDb = backupPkg.data as DatabaseTables;
      }

      // Verify Checksum if provided
      if (backupPkg.checksum) {
        const calculated = this.calculateChecksum(restoredDb);
        if (calculated !== backupPkg.checksum) {
          loggerService.logWarn('BACKUP', 'تنبيه: الكود التكاملي للنسخة الاحتياطية لا يطابق البيانات (Checksum Mismatch)');
        }
      }

      // Validate required tables presence
      if (!Array.isArray(restoredDb.employees) || !Array.isArray(restoredDb.attendance)) {
        return { success: false, message: 'بيانات قاعدة البيانات المسترجعة تفتقد للجداول الأساسية' };
      }

      // Apply DB update
      sqliteAdapter.saveDatabase(restoredDb);

      const restoredTablesCount = {
        employees: restoredDb.employees.length,
        attendance: restoredDb.attendance.length,
        exitReasons: restoredDb.exitReasons ? restoredDb.exitReasons.length : 0,
        devices: restoredDb.devices ? restoredDb.devices.length : 0,
        auditLogs: restoredDb.auditLogs ? restoredDb.auditLogs.length : 0,
        settings: 1,
      };

      loggerService.logInfo(
        'BACKUP',
        `تم استرجاع قاعدة البيانات (as_solution.db) بنجاح. عدد الموظفين: ${restoredTablesCount.employees}، سجلات الحضور: ${restoredTablesCount.attendance}`
      );

      return {
        success: true,
        message: 'تم استرجاع النسخة الاحتياطية وقاعدة البيانات بنجاح!',
        restoredTablesCount,
      };
    } catch (e: any) {
      loggerService.logError('BACKUP', 'خطأ أثناء استرجاع قاعدة البيانات', e?.stack);
      return { success: false, message: `فشل عملية الاسترجاع: ${e?.message || e}` };
    }
  }

  public initAutoBackupSchedule(): void {
    if (typeof window === 'undefined') return;

    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }

    // Check backup timer every 30 minutes
    this.autoBackupTimer = setInterval(() => {
      try {
        const db = sqliteAdapter.getDatabase();
        if (db.settings.autoBackupEnabled) {
          const history = this.getBackupHistory();
          const lastBackup = history[0];
          const intervalMs = (db.settings.autoBackupIntervalHours || 24) * 60 * 60 * 1000;

          if (!lastBackup || Date.now() - new Date(lastBackup.timestamp).getTime() >= intervalMs) {
            this.createBackup('نسخة احتياطية دورية تلقائية');
          }
        }
      } catch (err) {
        console.error('Auto backup execution error:', err);
      }
    }, 30 * 60 * 1000);
  }
}

export const backupService = new BackupService();
