import { useSyncExternalStore, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'cyan' | 'emerald' | 'amber' | 'purple' | 'indigo' | 'rose';

export interface AccentColorConfig {
  id: AccentColor;
  nameAr: string;
  nameEn: string;
  primaryClass: string;
  gradientFrom: string;
  gradientTo: string;
  ringClass: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  hex: string;
}

export const ACCENT_COLORS: Record<AccentColor, AccentColorConfig> = {
  cyan: {
    id: 'cyan',
    nameAr: 'سيان سماوي (افتراضي)',
    nameEn: 'Cyan Blue',
    primaryClass: 'text-cyan-400',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    ringClass: 'ring-cyan-400/40',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    borderClass: 'border-cyan-500/30',
    hex: '#06b6d4',
  },
  emerald: {
    id: 'emerald',
    nameAr: 'زمردي نضير',
    nameEn: 'Emerald Green',
    primaryClass: 'text-emerald-400',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    ringClass: 'ring-emerald-400/40',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    hex: '#10b981',
  },
  amber: {
    id: 'amber',
    nameAr: 'عنبري ذهبي',
    nameEn: 'Amber Gold',
    primaryClass: 'text-amber-400',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    ringClass: 'ring-amber-400/40',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    borderClass: 'border-amber-500/30',
    hex: '#f59e0b',
  },
  purple: {
    id: 'purple',
    nameAr: 'بنفسجي ملكي',
    nameEn: 'Royal Purple',
    primaryClass: 'text-purple-400',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    ringClass: 'ring-purple-400/40',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    borderClass: 'border-purple-500/30',
    hex: '#a855f7',
  },
  indigo: {
    id: 'indigo',
    nameAr: 'نيلي حديث',
    nameEn: 'Modern Indigo',
    primaryClass: 'text-indigo-400',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-blue-700',
    ringClass: 'ring-indigo-400/40',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    borderClass: 'border-indigo-500/30',
    hex: '#6366f1',
  },
  rose: {
    id: 'rose',
    nameAr: 'وردي ياقوتي',
    nameEn: 'Ruby Rose',
    primaryClass: 'text-rose-400',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
    ringClass: 'ring-rose-400/40',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    borderClass: 'border-rose-500/30',
    hex: '#f43f5e',
  },
};

interface ThemeState {
  mode: ThemeMode;
  accent: AccentColor;
}

const initialMode = (typeof window !== 'undefined' && localStorage.getItem('as_app_theme_mode') as ThemeMode) || 'dark';
const initialAccent = (typeof window !== 'undefined' && localStorage.getItem('as_app_theme_accent') as AccentColor) || 'cyan';

let themeState: ThemeState = {
  mode: initialMode,
  accent: initialAccent,
};

const listeners = new Set<() => void>();

function applyThemeDOM(m: ThemeMode, a: AccentColor) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  let isDark = true;
  if (m === 'light') {
    isDark = false;
  } else if (m === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  root.setAttribute('data-accent', a);
}

// Initial application
applyThemeDOM(themeState.mode, themeState.accent);

function notifyTheme() {
  applyThemeDOM(themeState.mode, themeState.accent);
  listeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getThemeSnapshot() {
  return themeState;
}

export function useThemeStore() {
  const state = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeSnapshot);

  const setMode = useCallback((newMode: ThemeMode) => {
    themeState = { ...themeState, mode: newMode };
    if (typeof window !== 'undefined') {
      localStorage.setItem('as_app_theme_mode', newMode);
    }
    notifyTheme();
  }, []);

  const setAccent = useCallback((newAccent: AccentColor) => {
    themeState = { ...themeState, accent: newAccent };
    if (typeof window !== 'undefined') {
      localStorage.setItem('as_app_theme_accent', newAccent);
    }
    notifyTheme();
  }, []);

  return {
    mode: state.mode,
    accent: state.accent,
    accentConfig: ACCENT_COLORS[state.accent] || ACCENT_COLORS.cyan,
    setMode,
    setAccent,
  };
}

