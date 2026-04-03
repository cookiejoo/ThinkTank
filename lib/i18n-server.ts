import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, Locale } from '@/lib/i18n';

export async function getLocaleFromCookies(): Promise<Locale> {
  const c = await cookies();
  const v = c.get('thinktank_locale')?.value;
  if (v === 'zh' || v === 'en') return v;
  return DEFAULT_LOCALE;
}
