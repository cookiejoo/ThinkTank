'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Locale } from '@/lib/i18n';
import { useI18n } from '@/components/i18n-provider';

export function LanguageSwitcher({
  className,
  variant = 'select',
}: {
  className?: string;
  variant?: 'select' | 'button';
}) {
  const { locale, setLocale, t } = useI18n();

  if (variant === 'button') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={className || 'h-8 px-2'}>
            {locale === 'zh' ? t('lang.zh') : t('lang.en')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2">
          <div className="grid gap-1">
            <Button
              type="button"
              variant={locale === 'zh' ? 'default' : 'ghost'}
              className="justify-start h-9"
              onClick={() => setLocale('zh')}
            >
              {t('lang.zh')}
            </Button>
            <Button
              type="button"
              variant={locale === 'en' ? 'default' : 'ghost'}
              className="justify-start h-9"
              onClick={() => setLocale('en')}
            >
              {t('lang.en')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className={className || 'w-[120px]'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh">{t('lang.zh')}</SelectItem>
        <SelectItem value="en">{t('lang.en')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
