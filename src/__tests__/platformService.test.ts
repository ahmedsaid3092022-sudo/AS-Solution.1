import { describe, it, expect } from 'vitest';
import { platformService } from '../services/platformService';

describe('PlatformService Unit & Integration Tests', () => {
  it('should detect current platform environment accurately', () => {
    const platform = platformService.getPlatform();
    expect(['electron', 'android', 'ios', 'web']).toContain(platform);

    const platformNameAr = platformService.getPlatformNameAr();
    expect(platformNameAr).toBeDefined();
    expect(platformNameAr.length).toBeGreaterThan(0);
  });

  it('should extract a valid hardware UUID hash string', async () => {
    const hwId = await platformService.getHardwareUUID();
    expect(hwId).toBeDefined();
    expect(hwId).toMatch(/^HW-/);
  });

  it('should retrieve location coordinates with fallback or GPS', async () => {
    const location = await platformService.getCurrentLocation();
    expect(location).toBeDefined();
    expect(typeof location.lat).toBe('number');
    expect(typeof location.lng).toBe('number');
    expect(location.lat).toBeGreaterThan(0);
    expect(location.lng).toBeGreaterThan(0);
    expect(location.messageAr).toBeDefined();
  });

  it('should report network status correctly', async () => {
    const network = await platformService.getNetworkStatus();
    expect(network).toBeDefined();
    expect(typeof network.connected).toBe('boolean');
    expect(network.connectionType).toBeDefined();
  });
});
