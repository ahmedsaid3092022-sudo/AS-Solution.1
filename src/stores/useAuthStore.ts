import { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { auditService } from '../services/auditService';
import { loggerService } from '../services/loggerService';

const DEMO_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    passwordHash: 'admin123',
    name: 'مدير النظام الرئيسي (Admin)',
    role: 'ADMIN',
    email: 'admin@assolution.com',
  },
  {
    id: 'usr-hr',
    username: 'hr',
    passwordHash: 'hr123',
    name: 'سارة إبراهيم (إدارة الموارد البشرية)',
    role: 'HR',
    email: 'sara.hr@assolution.com',
  },
  {
    id: 'usr-sec',
    username: 'security',
    passwordHash: 'sec123',
    name: 'محمود حسن (مسؤول الأجهزة والحراسة)',
    role: 'SECURITY',
    email: 'security@assolution.com',
  },
  {
    id: 'usr-mgr',
    username: 'manager',
    passwordHash: 'mgr123',
    name: 'مهندس أحمد علي (مدير قسم IT)',
    role: 'MANAGER',
    email: 'ahmed.mgr@assolution.com',
  },
];

const AUTH_STORAGE_KEY = 'as_solution_auth_user_v1';

class AuthStoreState {
  private currentUser: User | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initSession();
  }

  private initSession(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved);
        } catch {
          this.currentUser = DEMO_USERS[0]; // fallback default admin
        }
      } else {
        // Default login as Admin
        this.currentUser = {
          id: DEMO_USERS[0].id,
          username: DEMO_USERS[0].username,
          name: DEMO_USERS[0].name,
          role: DEMO_USERS[0].role,
          email: DEMO_USERS[0].email,
          lastLogin: new Date().toISOString(),
        };
        this.saveSession();
      }
    }
  }

  private saveSession(): void {
    if (this.currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public login(username: string, password: string): { success: boolean; message: string; user?: User } {
    const found = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.passwordHash === password
    );

    if (!found) {
      loggerService.logWarn('AUTH', `محاولة دخول فاشلة للمستخدم (${username})`);
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    const user: User = {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
      email: found.email,
      lastLogin: new Date().toISOString(),
    };

    this.currentUser = user;
    this.saveSession();

    auditService.logAction(user.id, user.name, 'USER_LOGIN', 'AUTH', 'تسجيل دخول ناجح إلى النظام');
    return { success: true, message: 'تم تسجيل الدخول بنجاح', user };
  }

  public logout(): void {
    if (this.currentUser) {
      auditService.logAction(
        this.currentUser.id,
        this.currentUser.name,
        'USER_LOGOUT',
        'AUTH',
        'تسجيل الخروج من النظام'
      );
    }
    this.currentUser = null;
    this.saveSession();
  }

  public hasRole(roles: Role | Role[]): boolean {
    if (!this.currentUser) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(this.currentUser.role);
  }
}

export const authStoreState = new AuthStoreState();

export function useAuthStore() {
  const [user, setUser] = useState<User | null>(() => authStoreState.getCurrentUser());

  useEffect(() => {
    const unsubscribe = authStoreState.subscribe(() => {
      setUser(authStoreState.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  return {
    currentUser: user,
    isAuthenticated: !!user,
    login: (u: string, p: string) => authStoreState.login(u, p),
    logout: () => authStoreState.logout(),
    hasRole: (roles: Role | Role[]) => authStoreState.hasRole(roles),
  };
}
