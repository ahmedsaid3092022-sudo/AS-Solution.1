import { useState, useEffect } from 'react';
import { Language, translations, Translations } from '../i18n/translations';

const LANG_STORAGE_KEY = 'as_solution_lang_v1';

class LanguageStoreState {
  private currentLanguage: Language = 'ar';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
      if (saved && (saved === 'ar' || saved === 'en')) {
        this.currentLanguage = saved;
      } else {
        this.currentLanguage = 'ar';
      }
      this.applyDirection();
    }
  }

  private applyDirection(): void {
    if (typeof document !== 'undefined') {
      const dir = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', this.currentLanguage);
    }
  }

  public getLanguage(): Language {
    return this.currentLanguage;
  }

  public getDir(): 'rtl' | 'ltr' {
    return this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }

  public setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    this.applyDirection();
    this.notify();
  }

  public toggleLanguage(): void {
    const nextLang: Language = this.currentLanguage === 'ar' ? 'en' : 'ar';
    this.setLanguage(nextLang);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getTranslations(): Translations {
    return translations[this.currentLanguage];
  }
}

export const languageStoreState = new LanguageStoreState();

export function useLanguageStore() {
  const [lang, setLang] = useState<Language>(() => languageStoreState.getLanguage());

  useEffect(() => {
    const unsubscribe = languageStoreState.subscribe(() => {
      setLang(languageStoreState.getLanguage());
    });
    return unsubscribe;
  }, []);

  return {
    language: lang,
    dir: lang === 'ar' ? 'rtl' : ('ltr' as 'rtl' | 'ltr'),
    isRtl: lang === 'ar',
    isLtr: lang === 'en',
    t: languageStoreState.getTranslations(),
    setLanguage: (newLang: Language) => languageStoreState.setLanguage(newLang),
    toggleLanguage: () => languageStoreState.toggleLanguage(),
  };
}
