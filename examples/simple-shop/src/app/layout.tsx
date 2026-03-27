import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import CategoryNav from "@/components/CategoryNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimpleShop",
  description: "일상을 디자인하다",
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
      <body className="min-h-full flex flex-col bg-[var(--color-offwhite)]">
        {/* 상단 고정 네비게이션 — 2단 구조 */}
        <header className="bg-[var(--color-offwhite)] border-b border-[var(--color-light-gray)] sticky top-0 z-50">
          {/* 상단: 로고 + 아이콘 */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* 로고 — 세리프, 차콜 */}
            <Link
              href="/"
              className="text-2xl font-serif-title font-bold text-[var(--color-charcoal)] hover:opacity-80 transition-opacity"
            >
              SimpleShop
            </Link>

            {/* 아이콘 영역 */}
            <div className="flex items-center gap-4">
              {/* 검색 아이콘 */}
              <Link
                href="/#products"
                className="text-[var(--color-charcoal)] hover:text-[var(--color-gold)] transition-colors"
                aria-label="검색"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* 위시리스트 하트 아이콘 */}
              <Link
                href="/wishlist"
                className="text-[var(--color-charcoal)] hover:text-[var(--color-gold)] transition-colors"
                aria-label="위시리스트"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 하단: 카테고리 메뉴 — 클라이언트 컴포넌트 (URL searchParams 동기화) */}
          <Suspense fallback={null}>
            <CategoryNav />
          </Suspense>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <footer className="border-t border-[var(--color-light-gray)] bg-[var(--color-offwhite)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <p className="font-serif-title text-[var(--color-charcoal)] text-lg mb-2">SimpleShop</p>
            <p className="text-sm text-[var(--color-warm-gray)]">
              SimpleShop &copy; 2026 &mdash; 일상을 디자인하다
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
