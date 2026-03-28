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
          background: 'linear-gradient(135deg, #3D2B1F, #8B6914)',
          borderRadius: '8px',
        }}
      >
        {/* 냄비/요리 아이콘 */}
        <div
          style={{
            fontSize: 20,
            display: 'flex',
          }}
        >
          🍲
        </div>
      </div>
    ),
    { ...size }
  );
}
