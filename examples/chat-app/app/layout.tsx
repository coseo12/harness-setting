import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatApp — 실시간 채팅',
  description: 'Harness Engineering Framework 파이프라인 검증용 실시간 채팅 앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
