'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, Locale, t as translate } from '@/lib/i18n';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'thinktank_locale';
const COOKIE_KEY = 'thinktank_locale';

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'zh' || stored === 'en') {
        setLocaleState(stored);
        return;
      }
    } catch {
    }
    if (initialLocale === 'zh' || initialLocale === 'en') {
      setLocaleState(initialLocale);
      return;
    }
    setLocaleState(DEFAULT_LOCALE);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
      document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000`;
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale: (next) => setLocaleState(next),
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => translate(DEFAULT_LOCALE, key, params),
    };
  }
  return ctx;
}
