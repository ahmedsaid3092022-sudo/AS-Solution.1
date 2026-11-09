import { useSyncExternalStore, useCallback } from 'react';
import { SystemSettings } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from '../services/loggerService';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyName: 'مؤسسة أيه إس للحلول الذكية',
  workStartTime: '08:00',
  workEndTime: '16:00',
  gracePeriodMinutes: 15,
  autoBackupIntervalHours: 24,
  autoBackupEnabled: true,
  language: 'ar',
  theme: 'dark',
  mainBranchLat: 30.0444,
  mainBranchLng: 31.2357,
  mainBranchRadiusMeters: 150,
  geofencingEnabled: true,
  strictGeofenceBlock: true,
  payrollIntegrationEnabled: true,
  fleetIntegrationEnabled: true,
  autoApproveGeoPunch: true,
  encryptedEventsPipeline: true,
  overtimeHourRateMultiplier: 1.5,
  nightBonusRateMultiplier: 1.25,
};

let currentSettings: SystemSettings = {
  ...DEFAULT_SYSTEM_SETTINGS,
  ...(sqliteAdapter.getDatabase()?.settings || {}),
};

const listeners = new Set<() => void>();

function notifySettings() {
  listeners.forEach((listener) => listener());
}

function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSettingsSnapshot() {
  return currentSettings;
}

export function refreshSettingsStore() {
  const db = sqliteAdapter.getDatabase();
  currentSettings = {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...(db?.settings || {}),
  };
  notifySettings();
}

export function useSettingsStore() {
  const settings = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);

  const updateSettings = useCallback((updated: Partial<SystemSettings>) => {
    const db = sqliteAdapter.getDatabase();
    const newSettings: SystemSettings = {
      ...currentSettings,
      ...updated,
    };

    db.settings = newSettings;
    sqliteAdapter.saveDatabase(db);
    currentSettings = newSettings;

    loggerService.logInfo('SETTINGS', 'تم تحديث إعدادات النظام وقواعد الربط الميداني والمالي');
    notifySettings();
    return newSettings;
  }, []);

  const resetToDefaults = useCallback(() => {
    const db = sqliteAdapter.getDatabase();
    db.settings = { ...DEFAULT_SYSTEM_SETTINGS };
    sqliteAdapter.saveDatabase(db);
    currentSettings = { ...DEFAULT_SYSTEM_SETTINGS };

    loggerService.logWarn('SETTINGS', 'تم إعادة إعدادات النظام إلى الوضع الافتراضي للفرع الرئيسي');
    notifySettings();
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
    refreshSettings: refreshSettingsStore,
  };
}
