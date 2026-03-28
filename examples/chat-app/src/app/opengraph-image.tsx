import { ImageResponse } from 'next/og';

export const alt = 'ChatApp - 메신저';
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
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 글래스모피즘 카드 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            borderRadius: '32px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* 채팅 아이콘 */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 11.5C21 16.19 16.97 20 12 20C10.82 20 9.69 19.82 8.65 19.47L3 21L4.76 16.47C3.67 15.07 3 13.36 3 11.5C3 6.81 7.03 3 12 3C16.97 3 21 6.81 21 11.5Z"
              fill="rgba(99, 179, 237, 0.85)"
            />
            <circle cx="8.5" cy="11.5" r="1.2" fill="white" />
            <circle cx="12" cy="11.5" r="1.2" fill="white" />
            <circle cx="15.5" cy="11.5" r="1.2" fill="white" />
          </svg>

          {/* 타이틀 */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: 'white',
              marginTop: 32,
              letterSpacing: '-0.02em',
            }}
          >
            ChatApp
          </div>

          {/* 설명 */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 16,
            }}
          >
            다크 글래스모피즘 채팅 애플리케이션
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
