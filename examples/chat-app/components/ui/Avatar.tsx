'use client';

interface AvatarProps {
  nickname: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

// 닉네임 해시 기반 6가지 그래디언트 색상
const GRADIENT_COLORS = [
  'linear-gradient(135deg, #4A7DFF, #6C63FF)',
  'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  'linear-gradient(135deg, #34C759, #30D5C8)',
  'linear-gradient(135deg, #FF3B30, #FF6B6B)',
  'linear-gradient(135deg, #AF52DE, #5856D6)',
  'linear-gradient(135deg, #FFD60A, #FF9F0A)',
];

function getGradient(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[index];
}

export default function Avatar({ nickname, size = 'md', online }: AvatarProps) {
  // 닉네임 첫 글자 (한글/영문 모두 지원)
  const initial = nickname.charAt(0).toUpperCase();
  const gradient = getGradient(nickname);

  return (
    <div className={`avatar ${size}`} style={{ background: gradient }}>
      {initial}
      {online && <span className="avatar-online" />}
    </div>
  );
}
