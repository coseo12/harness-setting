import { ImageResponse } from 'next/og';

export const alt = 'RecipeHub - 한식의 맛을 전합니다';
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
          background: 'linear-gradient(135deg, #FFFBF0 0%, #F5F0E8 50%, #E8DFD0 100%)',
          fontFamily: 'serif',
        }}
      >
        {/* 장식 상단 라인 */}
        <div
          style={{
            width: 80,
            height: 3,
            background: '#8B6914',
            borderRadius: 2,
            marginBottom: 40,
            display: 'flex',
          }}
        />

        {/* 아이콘 */}
        <div style={{ fontSize: 72, display: 'flex', marginBottom: 24 }}>
          🍲
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#3D2B1F',
            letterSpacing: '-0.01em',
          }}
        >
          RecipeHub
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 28,
            color: '#9B8E7E',
            marginTop: 16,
          }}
        >
          한식의 맛을 전합니다
        </div>

        {/* 장식 하단 라인 */}
        <div
          style={{
            width: 80,
            height: 3,
            background: '#8B6914',
            borderRadius: 2,
            marginTop: 40,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
