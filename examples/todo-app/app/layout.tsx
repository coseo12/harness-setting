import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'To-Do App',
  description: 'Harness 파이프라인 검증용 To-Do 앱',
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
