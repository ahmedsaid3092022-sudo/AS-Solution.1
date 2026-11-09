/**
 * Hardware Fingerprinting Service (fingerprintService.ts)
 * Generates a unique digital fingerprint for the workstation/server machine
 * combining canvas rendering, webgl signature, CPU cores, screen dimensions, and system timezone.
 */

export const fingerprintService = {
  /**
   * Generates a deterministic Hardware UUID hash string from client machine metrics.
   */
  getHardwareFingerprint(): string {
    try {
      const components: string[] = [];

      // Screen & Window
      if (typeof window !== 'undefined') {
        components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);
        components.push(`${navigator.hardwareConcurrency || 4}`);
        components.push(`${(navigator as any).deviceMemory || 8}`);
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        components.push(navigator.language || 'en');
      }

      // Canvas Fingerprint
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('AS-SOLUTION-HW-ID', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('AS-SOLUTION-HW-ID', 4, 17);
          components.push(canvas.toDataURL());
        }
      }

      const rawString = components.join('###');
      return 'HW-' + this.simpleHash(rawString);
    } catch (err) {
      return 'HW-ASSOLUTION-STD-3000';
    }
  },

  /**
   * Fast cyrb53 or FNV-1a hash generator string
   */
  simpleHash(str: string): string {
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const val = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).toUpperCase();
    return val.padStart(12, '0').slice(0, 12);
  },
};
