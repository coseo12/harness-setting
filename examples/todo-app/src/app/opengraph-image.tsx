import { ImageResponse } from 'next/og';

export const alt = 'Todo Dashboard - 할 일 관리';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8f6f0 0%, #f0ede4 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 노란 원 배경 + 체크 아이콘 */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#f5d547',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#1a1a1a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#1a1a1a',
            marginTop: 32,
            letterSpacing: '-0.02em',
          }}
        >
          Todo Dashboard
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 28,
            color: '#888',
            marginTop: 16,
          }}
        >
          타임라인 기반 할 일 관리 대시보드
        </div>
      </div>
    ),
    { ...size }
  );
}
