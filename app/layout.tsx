import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import { getLocaleFromCookies } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: "ThinkTank",
  description: "Markdown Documentation System",
};

import { AuthProvider } from '@/components/auth-provider';
import { I18nProvider } from '@/components/i18n-provider';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <body>
        <AuthProvider>
          <I18nProvider initialLocale={locale}>
            {children}
            <Toaster richColors position="top-center" />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
