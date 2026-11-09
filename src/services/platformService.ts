import { fingerprintService } from './fingerprintService';
import { loggerService } from './loggerService';

export type PlatformType = 'electron' | 'android' | 'ios' | 'web';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  provider: 'CAPACITOR_GPS' | 'WEB_GEOLOCATION' | 'DEFAULT_FALLBACK';
  messageAr: string;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';
}

class PlatformService {
  /**
   * Auto-detect current operating environment
   */
  public getPlatform(): PlatformType {
    if (typeof window !== 'undefined' && Boolean((window as any).electronAPI)) {
      return 'electron';
    }

    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      const capPlatform = (window as any).Capacitor.getPlatform();
      if (capPlatform === 'android') return 'android';
      if (capPlatform === 'ios') return 'ios';
    }

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('android')) return 'android';
      if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
      if (ua.includes('electron')) return 'electron';
    }

    return 'web';
  }

  public get isElectron(): boolean {
    return this.getPlatform() === 'electron';
  }

  public get isNativeMobile(): boolean {
    const p = this.getPlatform();
    return p === 'android' || p === 'ios';
  }

  public get isAndroid(): boolean {
    return this.getPlatform() === 'android';
  }

  public get isiOS(): boolean {
    return this.getPlatform() === 'ios';
  }

  public get isWeb(): boolean {
    return this.getPlatform() === 'web';
  }

  public getPlatformNameAr(): string {
    const p = this.getPlatform();
    switch (p) {
      case 'electron':
        return 'تطبيق سطح المكتب (Windows Electron)';
      case 'android':
        return 'تطبيق الهاتف (Android App)';
      case 'ios':
        return 'تطبيق الهاتف (iOS App)';
      case 'web':
      default:
        return 'متصفح السحابة والويب (Cloud Web)';
    }
  }

  /**
   * Extract Hardware UUID according to current platform
   */
  public async getHardwareUUID(): Promise<string> {
    try {
      if (this.isElectron && (window as any).electronAPI?.getHardwareUUID) {
        const desktopId = await (window as any).electronAPI.getHardwareUUID();
        if (desktopId) return desktopId;
      }

      if (this.isNativeMobile && (window as any).Capacitor?.Plugins?.Device) {
        const devicePlugin = (window as any).Capacitor.Plugins.Device;
        const info = await devicePlugin.getId();
        if (info?.identifier) {
          return `HW-MOB-${info.identifier.substring(0, 12).toUpperCase()}`;
        }
      }

      // Fallback to Web Fingerprint Service
      return fingerprintService.getHardwareFingerprint();
    } catch (err) {
      loggerService.logError('PLATFORM', 'فشل استخراج البصمة الرقمية من النظام', err);
      return fingerprintService.getHardwareFingerprint();
    }
  }

  /**
   * Get current location using mobile GPS or Web Geolocation
   */
  public async getCurrentLocation(): Promise<LocationCoordinates> {
    try {
      // 1. Mobile Capacitor Geolocation
      if (this.isNativeMobile && (window as any).Capacitor?.Plugins?.Geolocation) {
        const geoPlugin = (window as any).Capacitor.Plugins.Geolocation;
        const position = await geoPlugin.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          provider: 'CAPACITOR_GPS',
          messageAr: 'تم تحديد الموقع بدقة فائقة من مستشعر GPS الموبايل',
        };
      }

      // 2. Web HTML5 Geolocation API
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                provider: 'WEB_GEOLOCATION',
                messageAr: 'تم تحديد الموقع بواسطة خدمات موقع المتصفح (Web Geolocation)',
              });
            },
            (_err) => {
              // Default fallback: Cairo HQ (30.0444, 31.2357)
              resolve({
                lat: 30.0444,
                lng: 31.2357,
                accuracy: 50,
                provider: 'DEFAULT_FALLBACK',
                messageAr: 'موقع افتراضي (المقر الرئيسي بالتاجر/القاهرة)',
              });
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      return {
        lat: 30.0444,
        lng: 31.2357,
        accuracy: 100,
        provider: 'DEFAULT_FALLBACK',
        messageAr: 'تعذر الوصول لمستشعر الموقع، تم استخدام الإحداثيات الافتراضية',
      };
    } catch (err) {
      loggerService.logWarn('PLATFORM', 'تعذر قراءة الموقع الحقيقي، جاري استخدام النطاق الافتراضي');
      return {
        lat: 30.0444,
        lng: 31.2357,
        accuracy: 100,
        provider: 'DEFAULT_FALLBACK',
        messageAr: 'المقر الرئيسي بالتاجر/القاهرة (افتراضي)',
      };
    }
  }

  /**
   * Monitor Network Connectivity
   */
  public async getNetworkStatus(): Promise<NetworkStatus> {
    try {
      if (this.isNativeMobile && (window as any).Capacitor?.Plugins?.Network) {
        const status = await (window as any).Capacitor.Plugins.Network.getStatus();
        return {
          connected: Boolean(status.connected),
          connectionType: status.connectionType || 'cellular',
        };
      }

      const connected = typeof navigator !== 'undefined' ? navigator.onLine : true;
      return {
        connected,
        connectionType: connected ? 'wifi' : 'none',
      };
    } catch (err) {
      return { connected: true, connectionType: 'ethernet' };
    }
  }

  /**
   * Window Control Commands for Electron Desktop App
   */
  public async minimizeWindow(): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.minimizeWindow) {
      await (window as any).electronAPI.minimizeWindow();
    }
  }

  public async maximizeWindow(): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.maximizeWindow) {
      await (window as any).electronAPI.maximizeWindow();
    }
  }

  public async closeWindow(): Promise<void> {
    if (this.isElectron && (window as any).electronAPI?.closeWindow) {
      await (window as any).electronAPI.closeWindow();
    }
  }

  public async isMaximized(): Promise<boolean> {
    if (this.isElectron && (window as any).electronAPI?.isMaximized) {
      return await (window as any).electronAPI.isMaximized();
    }
    return false;
  }
}

export const platformService = new PlatformService();
