import { ImageResponse } from 'next/og';

export const alt = 'SimpleShop - 일상을 디자인하다';
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
          background: '#F7F5F2',
          fontFamily: 'serif',
        }}
      >
        {/* 쇼핑백 아이콘 */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
            stroke="#C4983B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 6H21"
            stroke="#C4983B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
            stroke="#C4983B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#2D2D2D',
            marginTop: 32,
            letterSpacing: '-0.01em',
          }}
        >
          SimpleShop
        </div>

        {/* 구분선 */}
        <div
          style={{
            width: 60,
            height: 2,
            background: '#C4983B',
            marginTop: 24,
            marginBottom: 24,
            display: 'flex',
          }}
        />

        {/* 설명 */}
        <div
          style={{
            fontSize: 28,
            color: '#A09890',
          }}
        >
          일상을 디자인하다
        </div>
      </div>
    ),
    { ...size }
  );
}
