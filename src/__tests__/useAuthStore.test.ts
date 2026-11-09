import { describe, it, expect, beforeEach } from 'vitest';
import { authStoreState } from '../stores/useAuthStore';
import { sqliteAdapter } from '../db/sqliteAdapter';

describe('useAuthStore / AuthStoreState Unit Tests', () => {
  beforeEach(() => {
    sqliteAdapter.resetToDefaults();
    authStoreState.logout();
  });

  it('should authenticate admin credentials successfully', () => {
    const res = authStoreState.login('admin', 'admin123');
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.role).toBe('ADMIN');
    expect(authStoreState.getCurrentUser()).not.toBeNull();
  });

  it('should reject invalid password', () => {
    const res = authStoreState.login('admin', 'wrong_pass_999');
    expect(res.success).toBe(false);
    expect(res.user).toBeUndefined();
    expect(authStoreState.getCurrentUser()).toBeNull();
  });

  it('should check roles correctly', () => {
    authStoreState.login('hr', 'hr123');
    expect(authStoreState.hasRole('HR')).toBe(true);
    expect(authStoreState.hasRole(['ADMIN', 'HR'])).toBe(true);
    expect(authStoreState.hasRole('SECURITY')).toBe(false);
  });

  it('should logout user cleanly', () => {
    authStoreState.login('admin', 'admin123');
    expect(authStoreState.getCurrentUser()).not.toBeNull();

    authStoreState.logout();
    expect(authStoreState.getCurrentUser()).toBeNull();
  });
});
