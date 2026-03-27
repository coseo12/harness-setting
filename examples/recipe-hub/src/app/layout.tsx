import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RecipeHub - 나만의 레시피 플랫폼',
  description: '레시피를 검색하고, 등록하고, 평가해보세요',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        {/* 상단 네비게이션 바 */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            {/* 로고 */}
            <Link
              href="/"
              className="text-xl font-bold text-orange-600 sm:text-2xl"
            >
              RecipeHub
            </Link>

            {/* 레시피 등록 버튼 */}
            <Link
              href="/recipes/new"
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 sm:px-4 sm:py-2 sm:text-base"
            >
              레시피 등록
            </Link>
          </nav>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
