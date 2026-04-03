import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: '肢別トラッカー',
  description: '行政書士試験 肢別過去問 学習トラッカー',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">
        <AuthProvider>
          <div className="mx-auto max-w-md min-h-dvh bg-white shadow-sm">
            <main className="pb-20">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
