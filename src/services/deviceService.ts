import { BiometricDevice } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { attendanceService } from './attendanceService';
import { loggerService } from './loggerService';

class DeviceService {
  public getDevices(): BiometricDevice[] {
    return sqliteAdapter.getTable('devices') || [];
  }

  public addDevice(device: Omit<BiometricDevice, 'id' | 'lastSync' | 'totalLogs' | 'status'>): BiometricDevice {
    const devices = this.getDevices();
    const newDevice: BiometricDevice = {
      ...device,
      id: `dev-${Date.now()}`,
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      totalLogs: 0,
    };

    sqliteAdapter.updateTable('devices', [...devices, newDevice]);
    loggerService.logInfo('DEVICE', `تم إضافة جهاز بصمة جديد: ${newDevice.name} (${newDevice.ipAddress}:${newDevice.port})`);
    return newDevice;
  }

  public updateDevice(id: string, updates: Partial<BiometricDevice>): BiometricDevice {
    const devices = this.getDevices();
    const index = devices.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('الجهاز غير موجود');

    devices[index] = { ...devices[index], ...updates };
    sqliteAdapter.updateTable('devices', devices);
    return devices[index];
  }

  public deleteDevice(id: string): void {
    const devices = this.getDevices().filter((d) => d.id !== id);
    sqliteAdapter.updateTable('devices', devices);
    loggerService.logInfo('DEVICE', `تم حذف جهاز البصمة برقم (${id})`);
  }

  public async syncDeviceLogs(deviceId: string): Promise<{ syncedLogsCount: number; message: string }> {
    const devices = this.getDevices();
    const dev = devices.find((d) => d.id === deviceId);
    if (!dev) throw new Error('جهاز البصمة غير موجود');

    // Update device status to SYNCING
    this.updateDevice(deviceId, { status: 'SYNCING' });

    // Simulate network handshake delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate fetching attendance logs from biometric terminal
    const employees = sqliteAdapter.getTable('employees');
    let syncedCount = 0;

    // Pick 2 random employees to generate check-in/out
    const activeEmps = employees.filter((e) => e.status === 'ACTIVE');
    if (activeEmps.length > 0) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      // Record checkIn or checkOut for a random active employee
      const randomEmp = activeEmps[Math.floor(Math.random() * activeEmps.length)];
      const type = Math.random() > 0.5 ? 'CHECK_IN' : 'CHECK_OUT';
      attendanceService.recordCheckInOrOut(randomEmp.id, type, timeStr, dev.id);
      syncedCount++;
    }

    // Update last sync time & status
    const updatedDev = this.updateDevice(deviceId, {
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      totalLogs: (dev.totalLogs || 0) + syncedCount,
    });

    loggerService.logInfo(
      'DEVICE',
      `تم مزامنة سجلات الحضور بنجاح من الجهاز ${dev.name}. عدد السجلات المستوردة: ${syncedCount}`
    );

    return {
      syncedLogsCount: syncedCount,
      message: `تم مزامنة الجهاز (${dev.name}) بنجاح. تم استيراد ${syncedCount} سجل حضور.`,
    };
  }
}

export const deviceService = new DeviceService();
