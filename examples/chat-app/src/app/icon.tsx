import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          borderRadius: '8px',
        }}
      >
        {/* 채팅 말풍선 아이콘 */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 11.5C21 16.19 16.97 20 12 20C10.82 20 9.69 19.82 8.65 19.47L3 21L4.76 16.47C3.67 15.07 3 13.36 3 11.5C3 6.81 7.03 3 12 3C16.97 3 21 6.81 21 11.5Z"
            fill="rgba(99, 179, 237, 0.9)"
          />
          <circle cx="8.5" cy="11.5" r="1.2" fill="white" />
          <circle cx="12" cy="11.5" r="1.2" fill="white" />
          <circle cx="15.5" cy="11.5" r="1.2" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
