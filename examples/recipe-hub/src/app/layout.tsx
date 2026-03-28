import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'RecipeHub - 한식의 맛을 전합니다',
  description: '정성을 담은 한식 레시피로 매일의 식탁을 특별하게',
  openGraph: {
    title: 'RecipeHub - 한식의 맛을 전합니다',
    description: '정성을 담은 한식 레시피로 매일의 식탁을 특별하게',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FFFBF0]">
        {/* 상단 네비게이션 바 */}
        <header className="sticky top-0 z-50 border-b border-[#E8DFD0] bg-[#FFFBF0]/95 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            {/* 로고 */}
            <Link
              href="/"
              className="font-serif-title text-2xl font-bold text-[#3D2B1F] tracking-tight"
            >
              RecipeHub
            </Link>

            {/* 메뉴 링크 */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-sm font-medium text-[#3D2B1F] transition-colors hover:text-[#8B6914]"
              >
                홈
              </Link>
              <Link
                href="/#recipes"
                className="text-sm font-medium text-[#3D2B1F] transition-colors hover:text-[#8B6914]"
              >
                레시피
              </Link>
              <Link
                href="/recipes/new"
                className="text-sm font-medium text-[#3D2B1F] transition-colors hover:text-[#8B6914]"
              >
                레시피 등록
              </Link>

              {/* 검색 아이콘 */}
              <Link href="/#recipes" className="text-[#9B8E7E] hover:text-[#8B6914] transition-colors">
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 12.15 12.15z"
                  />
                </svg>
              </Link>
            </div>
          </nav>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <footer className="border-t border-[#E8DFD0] bg-[#F5F0E8]">
          <div className="mx-auto max-w-6xl px-4 py-8 text-center">
            <p className="font-serif-title text-lg font-semibold text-[#3D2B1F]">RecipeHub</p>
            <p className="mt-2 text-sm text-[#9B8E7E]">
              RecipeHub &copy; 2026 &mdash; 한식의 맛을 전합니다
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
